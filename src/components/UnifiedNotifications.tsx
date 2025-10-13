import React, { useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

const UnifiedNotifications: React.FC = () => {
  // Mock notifications - in real app, this would come from context/API
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'info',
      title: 'Nova Designação Disponível',
      message: 'Você tem uma nova designação para a semana de 15-21 de Janeiro',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      actionUrl: '/designacoes'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Prazo se Aproximando',
      message: 'Sua designação de "Leitura da Bíblia" é amanhã',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false
    },
    {
      id: '3',
      type: 'success',
      title: 'Programa Atualizado',
      message: 'O programa da semana foi atualizado com sucesso',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertCircle;
      case 'info':
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
      default:
        return 'text-blue-600';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m atrás`;
    } else if (hours < 24) {
      return `${hours}h atrás`;
    } else {
      return `${days}d atrás`;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-auto p-1"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              Nenhuma notificação
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={cn(
                    'px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer',
                    !notification.read && 'bg-blue-50/50'
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', getNotificationColor(notification.type))} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          !notification.read && 'text-gray-900',
                          notification.read && 'text-gray-600'
                        )}>
                          {notification.title}
                        </p>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        
                        {notification.actionUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto p-1 text-blue-600 hover:text-blue-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              // In real app, navigate to actionUrl
                              console.log('Navigate to:', notification.actionUrl);
                            }}
                          >
                            Ver detalhes
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => console.log('View all notifications')}
              >
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UnifiedNotifications;