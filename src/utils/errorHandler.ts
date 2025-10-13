import { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
  id: string;
  type: ErrorType;
  message: string;
  userMessage: string;
  details?: any;
  timestamp: Date;
  context?: ErrorContext;
  recoveryActions?: RecoveryAction[];
}

export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  ASSIGNMENT = 'assignment',
  PROGRAM = 'program',
  STUDENT = 'student',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  userId?: string;
  page?: string;
  action?: string;
  data?: any;
}

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  type: 'primary' | 'secondary';
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Process and standardize errors from various sources
   */
  processError(error: any, context?: ErrorContext): AppError {
    const appError: AppError = {
      id: this.generateErrorId(),
      type: this.determineErrorType(error),
      message: this.extractErrorMessage(error),
      userMessage: this.generateUserMessage(error),
      details: error,
      timestamp: new Date(),
      context,
      recoveryActions: this.generateRecoveryActions(error, context)
    };

    this.logError(appError);
    return appError;
  }

  /**
   * Handle Supabase-specific errors
   */
  handleSupabaseError(error: PostgrestError, context?: ErrorContext): AppError {
    const appError: AppError = {
      id: this.generateErrorId(),
      type: ErrorType.DATABASE,
      message: error.message,
      userMessage: this.getSupabaseUserMessage(error),
      details: error,
      timestamp: new Date(),
      context,
      recoveryActions: this.getSupabaseRecoveryActions(error)
    };

    this.logError(appError);
    return appError;
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error: any, context?: ErrorContext): AppError {
    const appError: AppError = {
      id: this.generateErrorId(),
      type: ErrorType.NETWORK,
      message: error.message || 'Network error occurred',
      userMessage: 'Connection problem. Please check your internet connection.',
      details: error,
      timestamp: new Date(),
      context,
      recoveryActions: [
        {
          label: 'Retry',
          action: () => window.location.reload(),
          type: 'primary'
        },
        {
          label: 'Work Offline',
          action: () => this.enableOfflineMode(),
          type: 'secondary'
        }
      ]
    };

    this.logError(appError);
    return appError;
  }

  /**
   * Handle validation errors
   */
  handleValidationError(errors: ValidationError[], context?: ErrorContext): AppError {
    const appError: AppError = {
      id: this.generateErrorId(),
      type: ErrorType.VALIDATION,
      message: `Validation failed: ${errors.map(e => e.message).join(', ')}`,
      userMessage: 'Please correct the highlighted fields and try again.',
      details: errors,
      timestamp: new Date(),
      context,
      recoveryActions: [
        {
          label: 'Review Form',
          action: () => this.scrollToFirstError(),
          type: 'primary'
        }
      ]
    };

    this.logError(appError);
    return appError;
  }

  private determineErrorType(error: any): ErrorType {
    if (error?.code?.startsWith('PGRST')) return ErrorType.DATABASE;
    if (error?.name === 'ValidationError') return ErrorType.VALIDATION;
    if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') return ErrorType.NETWORK;
    if (error?.status === 401) return ErrorType.AUTHENTICATION;
    if (error?.status === 403) return ErrorType.AUTHORIZATION;
    if (error?.type === 'assignment_error') return ErrorType.ASSIGNMENT;
    if (error?.type === 'program_error') return ErrorType.PROGRAM;
    if (error?.type === 'student_error') return ErrorType.STUDENT;
    return ErrorType.UNKNOWN;
  }

  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error_description) return error.error_description;
    if (error?.details) return error.details;
    return 'An unexpected error occurred';
  }

  private generateUserMessage(error: any): string {
    const errorType = this.determineErrorType(error);
    
    switch (errorType) {
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.NETWORK:
        return 'Connection problem. Please check your internet connection.';
      case ErrorType.AUTHENTICATION:
        return 'Please log in again to continue.';
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.';
      case ErrorType.DATABASE:
        return 'Database error. Please try again or contact support.';
      case ErrorType.ASSIGNMENT:
        return 'Assignment error. Please check the assignment details.';
      case ErrorType.PROGRAM:
        return 'Program error. Please check the program configuration.';
      case ErrorType.STUDENT:
        return 'Student data error. Please verify the student information.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  private generateRecoveryActions(error: any, context?: ErrorContext): RecoveryAction[] {
    const errorType = this.determineErrorType(error);
    const actions: RecoveryAction[] = [];

    switch (errorType) {
      case ErrorType.NETWORK:
        actions.push(
          {
            label: 'Retry',
            action: () => window.location.reload(),
            type: 'primary'
          },
          {
            label: 'Work Offline',
            action: () => this.enableOfflineMode(),
            type: 'secondary'
          }
        );
        break;
      case ErrorType.AUTHENTICATION:
        actions.push({
          label: 'Log In Again',
          action: () => window.location.href = '/login',
          type: 'primary'
        });
        break;
      case ErrorType.VALIDATION:
        actions.push({
          label: 'Review Form',
          action: () => this.scrollToFirstError(),
          type: 'primary'
        });
        break;
      default:
        actions.push({
          label: 'Try Again',
          action: () => window.location.reload(),
          type: 'primary'
        });
    }

    return actions;
  }

  private getSupabaseUserMessage(error: PostgrestError): string {
    if (error.code === 'PGRST116') {
      return 'No data found matching your request.';
    }
    if (error.code === 'PGRST301') {
      return 'You don\'t have permission to access this data.';
    }
    if (error.code?.startsWith('23')) {
      return 'Data constraint violation. Please check your input.';
    }
    return 'Database error. Please try again or contact support.';
  }

  private getSupabaseRecoveryActions(error: PostgrestError): RecoveryAction[] {
    const actions: RecoveryAction[] = [];

    if (error.code === 'PGRST301') {
      actions.push({
        label: 'Log In Again',
        action: () => window.location.href = '/login',
        type: 'primary'
      });
    } else {
      actions.push({
        label: 'Try Again',
        action: () => window.location.reload(),
        type: 'primary'
      });
    }

    return actions;
  }

  private logError(error: AppError): void {
    // Add to local log
    this.errorLog.unshift(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error:', error);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(error);
    }
  }

  private async sendToMonitoring(error: AppError): Promise<void> {
    try {
      // In a real implementation, this would send to a service like Sentry
      // For now, we'll just store in Supabase
      const { supabase } = await import('@/integrations/supabase/client');
      
      await supabase
        .from('error_logs')
        .insert({
          error_id: error.id,
          error_type: error.type,
          message: error.message,
          user_message: error.userMessage,
          details: error.details,
          context: error.context,
          timestamp: error.timestamp.toISOString()
        });
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring:', monitoringError);
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private enableOfflineMode(): void {
    // Dispatch custom event to enable offline mode
    window.dispatchEvent(new CustomEvent('enable-offline-mode'));
  }

  private scrollToFirstError(): void {
    const firstError = document.querySelector('[data-error="true"]');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit = 10): AppError[] {
    return this.errorLog.slice(0, limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<{ data?: T; error?: AppError }> => {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const appError = errorHandler.processError(error, context);
    return { error: appError };
  }
};

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => R,
  context?: ErrorContext
) => {
  return (...args: T): R | AppError => {
    try {
      return fn(...args);
    } catch (error) {
      return errorHandler.processError(error, context);
    }
  };
};