import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Clock, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification } from '@/contexts/NotificationContext';

/**
 * NotificationArea - Global notification system
 * Displays system-wide alerts, success messages, and important information
 * Now integrated with the NotificationContext for real-time updates
 */
export default function NotificationArea() {
  const { notifications, removeNotification, markAsRead } = useNotifications();

  // Auto-mark notifications as read when they're displayed
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.action) {
      notification.action.onClick();
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      case 'assignment':
        return Clock;
      case 'reminder':
        return Bell;
      case 'info':
      default:
        return Info;
    }
  };

  const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'assignment':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'reminder':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'assignment':
        return 'text-purple-400';
      case 'reminder':
        return 'text-orange-400';
      case 'info':
      default:
        return 'text-blue-400';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  const formatTimestamp = (timestamp?: Date) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}m atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    return timestamp.toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            
            return (
              <div
                key={notification.id}
                className={cn(
                  'pointer-events-auto rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out cursor-pointer',
                  getNotificationStyles(notification.type),
                  !notification.read && 'ring-2 ring-current ring-opacity-20'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Icon className={cn('h-5 w-5', getIconStyles(notification.type))} />
                  </div>
                  
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        {notification.title}
                      </h3>
                      {notification.timestamp && (
                        <span className="text-xs opacity-70">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      )}
                    </div>
                    
                    {notification.message && (
                      <p className="mt-1 text-sm opacity-90">
                        {notification.message}
                      </p>
                    )}
                    
                    {notification.action && (
                      <div className="mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(notification);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-current bg-white/20 hover:bg-white/30 transition-colors"
                        >
                          {notification.action.label}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {notification.dismissible !== false && (
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="inline-flex rounded-md p-1.5 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current transition-colors"
                      >
                        <span className="sr-only">Fechar</span>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}