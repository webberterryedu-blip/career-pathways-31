import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAssignments } from '@/contexts/AssignmentContext';

interface RealTimeStatusIndicatorProps {
  className?: string;
  showText?: boolean;
}

/**
 * RealTimeStatusIndicator - Shows the current real-time connection status
 * Displays connection state and optimistic update status
 */
export default function RealTimeStatusIndicator({ 
  className, 
  showText = false 
}: RealTimeStatusIndicatorProps) {
  const { isRealTimeConnected, optimisticUpdates } = useAssignments();
  
  const hasOptimisticUpdates = optimisticUpdates.length > 0;
  const hasPendingUpdates = optimisticUpdates.some(u => 
    Date.now() - u.timestamp > 5000 // Pending for more than 5 seconds
  );

  const getStatusInfo = () => {
    if (!isRealTimeConnected) {
      return {
        icon: WifiOff,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        text: 'Desconectado',
        description: 'Sem conexão em tempo real'
      };
    }

    if (hasPendingUpdates) {
      return {
        icon: AlertCircle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        text: 'Sincronizando',
        description: 'Algumas alterações estão pendentes'
      };
    }

    if (hasOptimisticUpdates) {
      return {
        icon: Wifi,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        text: 'Atualizando',
        description: 'Processando alterações'
      };
    }

    return {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      text: 'Conectado',
      description: 'Tempo real ativo'
    };
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  if (showText) {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium',
        status.bgColor,
        status.borderColor,
        status.color,
        className
      )}>
        <Icon className="h-4 w-4" />
        <span>{status.text}</span>
        {hasOptimisticUpdates && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-current rounded-full">
            {optimisticUpdates.length}
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'relative inline-flex items-center justify-center w-8 h-8 rounded-full border-2',
        status.bgColor,
        status.borderColor,
        className
      )}
      title={status.description}
    >
      <Icon className={cn('h-4 w-4', status.color)} />
      
      {hasOptimisticUpdates && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-blue-500 rounded-full">
          {optimisticUpdates.length}
        </span>
      )}
      
      {hasPendingUpdates && (
        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full animate-pulse" />
      )}
    </div>
  );
}