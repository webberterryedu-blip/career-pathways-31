import React, { useEffect, useState } from 'react';
import { AppError } from '../utils/errorHandler';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ErrorNotificationProps {
  error: AppError;
  onDismiss: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onDismiss,
  autoHide = true,
  autoHideDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && error.type !== 'validation') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Allow fade out animation
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, error.type, onDismiss]);

  const getIcon = () => {
    switch (error.type) {
      case 'validation':
        return <Info className="h-4 w-4" />;
      case 'network':
      case 'database':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (error.type) {
      case 'validation':
        return 'default';
      case 'network':
      case 'database':
      case 'authentication':
      case 'authorization':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 w-96 transition-all duration-300",
      isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
    )}>
      <Alert variant={getVariant()}>
        {getIcon()}
        <AlertTitle className="flex items-center justify-between">
          Error
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </AlertTitle>
        <AlertDescription className="mt-2">
          {error.userMessage}
        </AlertDescription>

        {error.recoveryActions && error.recoveryActions.length > 0 && (
          <div className="mt-3 flex gap-2">
            {error.recoveryActions.map((action, index) => (
              <Button
                key={index}
                variant={action.type === 'primary' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  action.action();
                  onDismiss();
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </Alert>
    </div>
  );
};

// Global error notification manager
interface ErrorNotificationState {
  errors: AppError[];
}

export const useErrorNotifications = () => {
  const [state, setState] = useState<ErrorNotificationState>({ errors: [] });

  const showError = (error: AppError) => {
    setState(prev => ({
      errors: [...prev.errors, error]
    }));
  };

  const dismissError = (errorId: string) => {
    setState(prev => ({
      errors: prev.errors.filter(error => error.id !== errorId)
    }));
  };

  const clearAllErrors = () => {
    setState({ errors: [] });
  };

  return {
    errors: state.errors,
    showError,
    dismissError,
    clearAllErrors
  };
};

// Global error notification container
export const ErrorNotificationContainer: React.FC = () => {
  const { errors, dismissError } = useErrorNotifications();

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {errors.map((error) => (
        <ErrorNotification
          key={error.id}
          error={error}
          onDismiss={() => dismissError(error.id)}
        />
      ))}
    </div>
  );
};