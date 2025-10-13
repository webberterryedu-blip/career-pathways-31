import { useCallback } from 'react';
import { errorHandler, AppError, ErrorContext, handleAsyncError } from '../utils/errorHandler';
import { useErrorNotifications } from '../components/ErrorNotification';

export const useErrorHandler = () => {
  const { showError } = useErrorNotifications();

  const handleError = useCallback((error: any, context?: ErrorContext): AppError => {
    const appError = errorHandler.processError(error, context);
    showError(appError);
    return appError;
  }, [showError]);

  const handleSupabaseError = useCallback((error: any, context?: ErrorContext): AppError => {
    const appError = errorHandler.handleSupabaseError(error, context);
    showError(appError);
    return appError;
  }, [showError]);

  const handleNetworkError = useCallback((error: any, context?: ErrorContext): AppError => {
    const appError = errorHandler.handleNetworkError(error, context);
    showError(appError);
    return appError;
  }, [showError]);

  const handleValidationError = useCallback((errors: any[], context?: ErrorContext): AppError => {
    const appError = errorHandler.handleValidationError(errors, context);
    showError(appError);
    return appError;
  }, [showError]);

  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: ErrorContext
  ) => {
    return async (...args: T): Promise<{ data?: R; error?: AppError }> => {
      try {
        const data = await fn(...args);
        return { data };
      } catch (error) {
        const appError = handleError(error, context);
        return { error: appError };
      }
    };
  }, [handleError]);

  const safeAsync = useCallback(<T>(
    operation: () => Promise<T>,
    context?: ErrorContext
  ): Promise<{ data?: T; error?: AppError }> => {
    return handleAsyncError(operation, context);
  }, []);

  return {
    handleError,
    handleSupabaseError,
    handleNetworkError,
    handleValidationError,
    withErrorHandling,
    safeAsync
  };
};