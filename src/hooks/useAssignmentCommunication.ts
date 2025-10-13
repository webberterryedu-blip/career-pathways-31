import { useCallback, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { AssignmentCommunicationService } from '@/services/assignmentCommunication';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing assignment communication
 * Integrates the communication service with the notification system
 */
export function useAssignmentCommunication() {
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  // Notify assignment creation
  const notifyAssignmentCreated = useCallback(async (
    assignmentId: string,
    studentId: string,
    assistantId: string | null,
    partTitle: string,
    weekDate: string
  ) => {
    try {
      await AssignmentCommunicationService.notifyAssignmentCreated(
        assignmentId,
        studentId,
        assistantId,
        partTitle,
        weekDate
      );

      // Add local notification for immediate feedback
      if (user?.id === studentId || user?.id === assistantId) {
        addNotification({
          type: 'assignment',
          title: 'Nova Designação',
          message: `Designação "${partTitle}" para ${weekDate}`,
          assignmentId,
          duration: 0,
          action: {
            label: 'Ver Detalhes',
            onClick: () => {
              window.location.href = `/designacoes?assignment=${assignmentId}`;
            }
          }
        });
      }

    } catch (error) {
      console.error('Error notifying assignment creation:', error);
      addNotification({
        type: 'error',
        title: 'Erro de Comunicação',
        message: 'Não foi possível enviar notificação da designação.',
        duration: 5000
      });
    }
  }, [addNotification, user?.id]);

  // Notify assignment update
  const notifyAssignmentUpdated = useCallback(async (
    assignmentId: string,
    studentId: string,
    assistantId: string | null,
    changes: string[],
    partTitle: string
  ) => {
    try {
      await AssignmentCommunicationService.notifyAssignmentUpdated(
        assignmentId,
        studentId,
        assistantId,
        changes,
        partTitle
      );

      // Add local notification for immediate feedback
      if (user?.id === studentId || user?.id === assistantId) {
        addNotification({
          type: 'warning',
          title: 'Designação Atualizada',
          message: `"${partTitle}" foi modificada: ${changes.join(', ')}`,
          assignmentId,
          duration: 0,
          action: {
            label: 'Ver Alterações',
            onClick: () => {
              window.location.href = `/designacoes?assignment=${assignmentId}`;
            }
          }
        });
      }

    } catch (error) {
      console.error('Error notifying assignment update:', error);
      addNotification({
        type: 'error',
        title: 'Erro de Comunicação',
        message: 'Não foi possível enviar notificação da atualização.',
        duration: 5000
      });
    }
  }, [addNotification, user?.id]);

  // Notify assignment cancellation
  const notifyAssignmentCancelled = useCallback(async (
    assignmentId: string,
    studentId: string,
    assistantId: string | null,
    partTitle: string,
    reason?: string
  ) => {
    try {
      await AssignmentCommunicationService.notifyAssignmentCancelled(
        assignmentId,
        studentId,
        assistantId,
        partTitle,
        reason
      );

      // Add local notification for immediate feedback
      if (user?.id === studentId || user?.id === assistantId) {
        addNotification({
          type: 'error',
          title: 'Designação Cancelada',
          message: `"${partTitle}" foi cancelada${reason ? `: ${reason}` : ''}`,
          assignmentId,
          duration: 0
        });
      }

    } catch (error) {
      console.error('Error notifying assignment cancellation:', error);
      addNotification({
        type: 'error',
        title: 'Erro de Comunicação',
        message: 'Não foi possível enviar notificação do cancelamento.',
        duration: 5000
      });
    }
  }, [addNotification, user?.id]);

  // Request feedback
  const requestFeedback = useCallback(async (
    assignmentId: string,
    studentId: string,
    partTitle: string
  ) => {
    try {
      await AssignmentCommunicationService.requestFeedback(
        assignmentId,
        studentId,
        partTitle
      );

      // Add local notification if it's for the current user
      if (user?.id === studentId) {
        addNotification({
          type: 'info',
          title: 'Avaliação Solicitada',
          message: `Como foi sua experiência com "${partTitle}"?`,
          assignmentId,
          duration: 0,
          action: {
            label: 'Avaliar',
            onClick: () => {
              // Open feedback modal or navigate to feedback page
              console.log('Open feedback modal for assignment:', assignmentId);
            }
          }
        });
      }

    } catch (error) {
      console.error('Error requesting feedback:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Solicitar Avaliação',
        message: 'Não foi possível solicitar avaliação da designação.',
        duration: 5000
      });
    }
  }, [addNotification, user?.id]);

  // Submit feedback
  const submitFeedback = useCallback(async (
    assignmentId: string,
    studentId: string,
    feedback: {
      rating: 1 | 2 | 3 | 4 | 5;
      comments?: string;
      areas_for_improvement?: string[];
      strengths?: string[];
    }
  ) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      await AssignmentCommunicationService.submitFeedback(
        assignmentId,
        studentId,
        user.id,
        feedback
      );

      addNotification({
        type: 'success',
        title: 'Avaliação Enviada',
        message: 'Obrigado por sua avaliação! Ela nos ajuda a melhorar.',
        duration: 5000
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Enviar Avaliação',
        message: 'Não foi possível enviar sua avaliação. Tente novamente.',
        duration: 5000
      });
    }
  }, [addNotification, user?.id]);

  // Load user notifications from database
  const loadUserNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const notifications = await AssignmentCommunicationService.getUserNotifications(user.id);
      
      // Convert database notifications to local notifications
      notifications.forEach(dbNotification => {
        // Only add unread notifications to avoid duplicates
        if (!dbNotification.readAt) {
          addNotification({
            type: dbNotification.type === 'assignment_created' ? 'assignment' :
                  dbNotification.type === 'assignment_updated' ? 'warning' :
                  dbNotification.type === 'assignment_cancelled' ? 'error' :
                  dbNotification.type === 'reminder' ? 'reminder' :
                  'info',
            title: dbNotification.title,
            message: dbNotification.message,
            assignmentId: dbNotification.assignmentId,
            duration: 0,
            action: dbNotification.metadata?.requires_action ? {
              label: 'Ver Detalhes',
              onClick: () => {
                window.location.href = `/designacoes?assignment=${dbNotification.assignmentId}`;
              }
            } : undefined
          });
        }
      });

    } catch (error) {
      console.error('Error loading user notifications:', error);
    }
  }, [user?.id, addNotification]);

  // Set up real-time subscription for assignment notifications
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('user_notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'assignment_notifications',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new;
          
          addNotification({
            type: notification.type === 'assignment_created' ? 'assignment' :
                  notification.type === 'assignment_updated' ? 'warning' :
                  notification.type === 'assignment_cancelled' ? 'error' :
                  notification.type === 'reminder' ? 'reminder' :
                  'info',
            title: notification.title,
            message: notification.message,
            assignmentId: notification.assignment_id,
            duration: 0,
            action: notification.metadata?.requires_action ? {
              label: 'Ver Detalhes',
              onClick: () => {
                window.location.href = `/designacoes?assignment=${notification.assignment_id}`;
              }
            } : undefined
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, addNotification]);

  // Load notifications on mount
  useEffect(() => {
    loadUserNotifications();
  }, [loadUserNotifications]);

  return {
    notifyAssignmentCreated,
    notifyAssignmentUpdated,
    notifyAssignmentCancelled,
    requestFeedback,
    submitFeedback,
    loadUserNotifications
  };
}