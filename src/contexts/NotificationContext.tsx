import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'assignment' | 'reminder';
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 means persistent
  timestamp: Date;
  userId?: string;
  assignmentId?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  read?: boolean;
}

interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  
  // Assignment-specific notifications
  notifyAssignmentChange: (assignmentId: string, type: 'created' | 'updated' | 'cancelled', details?: string) => void;
  notifyAssignmentReminder: (assignmentId: string, studentName: string, partTitle: string, weekDate: string) => void;
  
  // Real-time subscription management
  subscribeToNotifications: () => () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate unique ID for notifications
  const generateId = useCallback(() => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add notification
  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date(),
      dismissible: notification.dismissible !== false,
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove notifications with duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.duration);
    }

    return newNotification.id;
  }, [generateId]);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Assignment-specific notification helpers
  const notifyAssignmentChange = useCallback((
    assignmentId: string, 
    type: 'created' | 'updated' | 'cancelled', 
    details?: string
  ) => {
    const titles = {
      created: 'Nova Designação',
      updated: 'Designação Atualizada',
      cancelled: 'Designação Cancelada'
    };

    const messages = {
      created: 'Você recebeu uma nova designação.',
      updated: 'Uma de suas designações foi atualizada.',
      cancelled: 'Uma de suas designações foi cancelada.'
    };

    addNotification({
      type: 'assignment',
      title: titles[type],
      message: details || messages[type],
      assignmentId,
      userId: user?.id,
      duration: 0, // Persistent for assignment changes
      action: {
        label: 'Ver Designação',
        onClick: () => {
          // Navigate to assignment details
          window.location.href = `/designacoes?assignment=${assignmentId}`;
        }
      }
    });
  }, [addNotification, user?.id]);

  // Assignment reminder notification
  const notifyAssignmentReminder = useCallback((
    assignmentId: string,
    studentName: string,
    partTitle: string,
    weekDate: string
  ) => {
    addNotification({
      type: 'reminder',
      title: 'Lembrete de Designação',
      message: `${studentName}, sua designação "${partTitle}" é na semana de ${weekDate}.`,
      assignmentId,
      userId: user?.id,
      duration: 0, // Persistent for reminders
      action: {
        label: 'Ver Detalhes',
        onClick: () => {
          window.location.href = `/designacoes?assignment=${assignmentId}`;
        }
      }
    });
  }, [addNotification, user?.id]);

  // Subscribe to real-time notifications
  const subscribeToNotifications = useCallback(() => {
    if (!user) return () => {};

    // Subscribe to assignment changes that affect the current user
    const assignmentSubscription = supabase
      .channel('user_assignments')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'designacoes',
          filter: `estudante_id=eq.${user.id}`
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          switch (eventType) {
            case 'INSERT':
              notifyAssignmentChange(newRecord.id, 'created');
              break;
            case 'UPDATE':
              if (oldRecord && newRecord) {
                // Check what changed
                const statusChanged = oldRecord.status !== newRecord.status;
                const dateChanged = oldRecord.data_designacao !== newRecord.data_designacao;
                
                let details = '';
                if (statusChanged) {
                  details += `Status alterado para: ${newRecord.status}. `;
                }
                if (dateChanged) {
                  details += `Data alterada para: ${newRecord.data_designacao}. `;
                }
                
                notifyAssignmentChange(newRecord.id, 'updated', details.trim());
              }
              break;
            case 'DELETE':
              if (oldRecord) {
                notifyAssignmentChange(oldRecord.id, 'cancelled');
              }
              break;
          }
        }
      )
      .subscribe();

    // Subscribe to assistant assignments
    const assistantSubscription = supabase
      .channel('user_assistant_assignments')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'designacoes',
          filter: `ajudante_id=eq.${user.id}`
        },
        (payload) => {
          const { eventType, new: newRecord } = payload;
          
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            addNotification({
              type: 'assignment',
              title: 'Designação como Ajudante',
              message: 'Você foi designado como ajudante em uma apresentação.',
              assignmentId: newRecord.id,
              duration: 0,
              action: {
                label: 'Ver Designação',
                onClick: () => {
                  window.location.href = `/designacoes?assignment=${newRecord.id}`;
                }
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      assignmentSubscription.unsubscribe();
      assistantSubscription.unsubscribe();
    };
  }, [user, notifyAssignmentChange, addNotification]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Set up real-time subscriptions when user is available
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToNotifications();
      return unsubscribe;
    }
  }, [user, subscribeToNotifications]);

  // Clean up notifications when user logs out
  useEffect(() => {
    if (!user) {
      setNotifications([]);
    }
  }, [user]);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    notifyAssignmentChange,
    notifyAssignmentReminder,
    subscribeToNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}