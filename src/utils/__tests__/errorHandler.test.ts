import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler, ErrorType, AppError, errorHandler, handleAsyncError, withErrorHandling } from '../errorHandler';

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock window methods
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    reload: vi.fn()
  },
  writable: true
});

// Mock custom event dispatch
const mockDispatchEvent = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);

// Mock Supabase module
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}));

describe('ErrorHandler', () => {
  let errorHandlerInstance: ErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    errorHandlerInstance = ErrorHandler.getInstance();
    errorHandlerInstance.clearErrorLog();
    
    // Reset environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ErrorHandler.getInstance();
      const instance2 = ErrorHandler.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Error Type Detection', () => {
    it('should detect database errors', () => {
      const dbError = { code: 'PGRST116', message: 'No rows found' };
      const appError = errorHandlerInstance.processError(dbError);
      
      expect(appError.type).toBe(ErrorType.DATABASE);
      expect(appError.message).toBe('No rows found');
    });

    it('should detect validation errors', () => {
      const validationError = { name: 'ValidationError', message: 'Invalid input' };
      const appError = errorHandlerInstance.processError(validationError);
      
      expect(appError.type).toBe(ErrorType.VALIDATION);
      expect(appError.userMessage).toBe('Please check your input and try again.');
    });

    it('should detect network errors', () => {
      const networkError = { name: 'NetworkError', message: 'Connection failed' };
      const appError = errorHandlerInstance.processError(networkError);
      
      expect(appError.type).toBe(ErrorType.NETWORK);
      expect(appError.userMessage).toBe('Connection problem. Please check your internet connection.');
    });

    it('should detect authentication errors', () => {
      const authError = { status: 401, message: 'Unauthorized' };
      const appError = errorHandlerInstance.processError(authError);
      
      expect(appError.type).toBe(ErrorType.AUTHENTICATION);
      expect(appError.userMessage).toBe('Please log in again to continue.');
    });

    it('should detect authorization errors', () => {
      const authzError = { status: 403, message: 'Forbidden' };
      const appError = errorHandlerInstance.processError(authzError);
      
      expect(appError.type).toBe(ErrorType.AUTHORIZATION);
      expect(appError.userMessage).toBe('You don\'t have permission to perform this action.');
    });

    it('should detect assignment errors', () => {
      const assignmentError = { type: 'assignment_error', message: 'Invalid assignment' };
      const appError = errorHandlerInstance.processError(assignmentError);
      
      expect(appError.type).toBe(ErrorType.ASSIGNMENT);
      expect(appError.userMessage).toBe('Assignment error. Please check the assignment details.');
    });

    it('should default to unknown error type', () => {
      const unknownError = { someProperty: 'value' };
      const appError = errorHandlerInstance.processError(unknownError);
      
      expect(appError.type).toBe(ErrorType.UNKNOWN);
      expect(appError.userMessage).toBe('Something went wrong. Please try again.');
    });
  });

  describe('Error Message Extraction', () => {
    it('should extract message from string error', () => {
      const appError = errorHandlerInstance.processError('Simple error message');
      expect(appError.message).toBe('Simple error message');
    });

    it('should extract message from error object', () => {
      const error = { message: 'Error object message' };
      const appError = errorHandlerInstance.processError(error);
      expect(appError.message).toBe('Error object message');
    });

    it('should extract error_description when available', () => {
      const error = { error_description: 'OAuth error description' };
      const appError = errorHandlerInstance.processError(error);
      expect(appError.message).toBe('OAuth error description');
    });

    it('should extract details when available', () => {
      const error = { details: 'Error details' };
      const appError = errorHandlerInstance.processError(error);
      expect(appError.message).toBe('Error details');
    });

    it('should use default message for unknown error format', () => {
      const error = { unknownProperty: 'value' };
      const appError = errorHandlerInstance.processError(error);
      expect(appError.message).toBe('An unexpected error occurred');
    });
  });

  describe('Recovery Actions Generation', () => {
    it('should generate retry actions for network errors', () => {
      const networkError = { name: 'NetworkError', message: 'Connection failed' };
      const appError = errorHandlerInstance.processError(networkError);
      
      expect(appError.recoveryActions).toHaveLength(2);
      expect(appError.recoveryActions![0].label).toBe('Retry');
      expect(appError.recoveryActions![1].label).toBe('Work Offline');
    });

    it('should generate login action for authentication errors', () => {
      const authError = { status: 401, message: 'Unauthorized' };
      const appError = errorHandlerInstance.processError(authError);
      
      expect(appError.recoveryActions).toHaveLength(1);
      expect(appError.recoveryActions![0].label).toBe('Log In Again');
    });

    it('should generate review form action for validation errors', () => {
      const validationError = { name: 'ValidationError', message: 'Invalid input' };
      const appError = errorHandlerInstance.processError(validationError);
      
      expect(appError.recoveryActions).toHaveLength(1);
      expect(appError.recoveryActions![0].label).toBe('Review Form');
    });

    it('should execute retry action', () => {
      const networkError = { name: 'NetworkError', message: 'Connection failed' };
      const appError = errorHandlerInstance.processError(networkError);
      
      appError.recoveryActions![0].action();
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('should execute offline mode action', () => {
      const networkError = { name: 'NetworkError', message: 'Connection failed' };
      const appError = errorHandlerInstance.processError(networkError);
      
      appError.recoveryActions![1].action();
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'enable-offline-mode' })
      );
    });
  });

  describe('Supabase Error Handling', () => {
    it('should handle PGRST116 (no data found)', () => {
      const supabaseError = { code: 'PGRST116', message: 'No rows found' };
      const appError = errorHandlerInstance.handleSupabaseError(supabaseError);
      
      expect(appError.type).toBe(ErrorType.DATABASE);
      expect(appError.userMessage).toBe('No data found matching your request.');
    });

    it('should handle PGRST301 (permission denied)', () => {
      const supabaseError = { code: 'PGRST301', message: 'Permission denied' };
      const appError = errorHandlerInstance.handleSupabaseError(supabaseError);
      
      expect(appError.userMessage).toBe('You don\'t have permission to access this data.');
      expect(appError.recoveryActions![0].label).toBe('Log In Again');
    });

    it('should handle constraint violations', () => {
      const supabaseError = { code: '23505', message: 'Unique constraint violation' };
      const appError = errorHandlerInstance.handleSupabaseError(supabaseError);
      
      expect(appError.userMessage).toBe('Data constraint violation. Please check your input.');
    });

    it('should handle generic database errors', () => {
      const supabaseError = { code: 'PGRST000', message: 'Generic error' };
      const appError = errorHandlerInstance.handleSupabaseError(supabaseError);
      
      expect(appError.userMessage).toBe('Database error. Please try again or contact support.');
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors with recovery actions', () => {
      const networkError = new Error('Network request failed');
      const appError = errorHandlerInstance.handleNetworkError(networkError);
      
      expect(appError.type).toBe(ErrorType.NETWORK);
      expect(appError.userMessage).toBe('Connection problem. Please check your internet connection.');
      expect(appError.recoveryActions).toHaveLength(2);
    });

    it('should handle network errors without message', () => {
      const networkError = {};
      const appError = errorHandlerInstance.handleNetworkError(networkError);
      
      expect(appError.message).toBe('Network error occurred');
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle validation errors array', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email', code: 'invalid_email', severity: 'error' as const },
        { field: 'name', message: 'Name required', code: 'required', severity: 'error' as const }
      ];
      
      const appError = errorHandlerInstance.handleValidationError(validationErrors);
      
      expect(appError.type).toBe(ErrorType.VALIDATION);
      expect(appError.message).toBe('Validation failed: Invalid email, Name required');
      expect(appError.details).toEqual(validationErrors);
    });

    it('should provide review form recovery action', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email', code: 'invalid_email', severity: 'error' as const }
      ];
      
      const appError = errorHandlerInstance.handleValidationError(validationErrors);
      
      expect(appError.recoveryActions).toHaveLength(1);
      expect(appError.recoveryActions![0].label).toBe('Review Form');
    });
  });

  describe('Error Logging', () => {
    it('should log errors to internal log', () => {
      const error = new Error('Test error');
      errorHandlerInstance.processError(error);
      
      const recentErrors = errorHandlerInstance.getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].message).toBe('Test error');
    });

    it('should limit log size', () => {
      // Create more than max log size errors
      for (let i = 0; i < 105; i++) {
        errorHandlerInstance.processError(new Error(`Error ${i}`));
      }
      
      const recentErrors = errorHandlerInstance.getRecentErrors();
      expect(recentErrors.length).toBeLessThanOrEqual(100);
    });

    it('should clear error log', () => {
      errorHandlerInstance.processError(new Error('Test error'));
      expect(errorHandlerInstance.getRecentErrors()).toHaveLength(1);
      
      errorHandlerInstance.clearErrorLog();
      expect(errorHandlerInstance.getRecentErrors()).toHaveLength(0);
    });

    it('should log to console in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Dev error');
      
      errorHandlerInstance.processError(error);
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        'App Error:',
        expect.objectContaining({ message: 'Dev error' })
      );
    });
  });

  describe('Context Handling', () => {
    it('should include context in error', () => {
      const error = new Error('Test error');
      const context = {
        userId: 'user-123',
        page: 'dashboard',
        action: 'load_data'
      };
      
      const appError = errorHandlerInstance.processError(error, context);
      
      expect(appError.context).toEqual(context);
    });

    it('should handle missing context gracefully', () => {
      const error = new Error('Test error');
      const appError = errorHandlerInstance.processError(error);
      
      expect(appError.context).toBeUndefined();
    });
  });

  describe('Error ID Generation', () => {
    it('should generate unique error IDs', () => {
      const error1 = errorHandlerInstance.processError(new Error('Error 1'));
      const error2 = errorHandlerInstance.processError(new Error('Error 2'));
      
      expect(error1.id).toBeDefined();
      expect(error2.id).toBeDefined();
      expect(error1.id).not.toBe(error2.id);
      expect(error1.id).toMatch(/^err_\d+_[a-z0-9]+$/);
    });
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleAsyncError', () => {
    it('should handle successful async operations', async () => {
      const successOperation = async () => 'success result';
      
      const result = await handleAsyncError(successOperation);
      
      expect(result.data).toBe('success result');
      expect(result.error).toBeUndefined();
    });

    it('should handle failed async operations', async () => {
      const failOperation = async () => {
        throw new Error('Async error');
      };
      
      const result = await handleAsyncError(failOperation);
      
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toBe('Async error');
    });

    it('should include context in async error handling', async () => {
      const failOperation = async () => {
        throw new Error('Async error');
      };
      
      const context = { action: 'test_operation' };
      const result = await handleAsyncError(failOperation, context);
      
      expect(result.error!.context).toEqual(context);
    });
  });

  describe('withErrorHandling', () => {
    it('should handle successful synchronous operations', () => {
      const successFn = (x: number, y: number) => x + y;
      const wrappedFn = withErrorHandling(successFn);
      
      const result = wrappedFn(2, 3);
      
      expect(result).toBe(5);
    });

    it('should handle failed synchronous operations', () => {
      const failFn = () => {
        throw new Error('Sync error');
      };
      const wrappedFn = withErrorHandling(failFn);
      
      const result = wrappedFn();
      
      expect(result).toBeInstanceOf(Object);
      expect((result as AppError).message).toBe('Sync error');
    });

    it('should include context in sync error handling', () => {
      const failFn = () => {
        throw new Error('Sync error');
      };
      const context = { action: 'test_sync' };
      const wrappedFn = withErrorHandling(failFn, context);
      
      const result = wrappedFn();
      
      expect((result as AppError).context).toEqual(context);
    });
  });
});

describe('Error Recovery Mechanisms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should scroll to first error element', () => {
    // Mock DOM element with error
    const mockElement = {
      scrollIntoView: vi.fn()
    };
    
    vi.spyOn(document, 'querySelector').mockReturnValue(mockElement as any);
    
    const validationError = { name: 'ValidationError', message: 'Invalid input' };
    const appError = errorHandler.processError(validationError);
    
    // Execute the recovery action
    appError.recoveryActions![0].action();
    
    expect(document.querySelector).toHaveBeenCalledWith('[data-error="true"]');
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center'
    });
  });

  it('should handle missing error element gracefully', () => {
    vi.spyOn(document, 'querySelector').mockReturnValue(null);
    
    const validationError = { name: 'ValidationError', message: 'Invalid input' };
    const appError = errorHandler.processError(validationError);
    
    // Should not throw when element is not found
    expect(() => {
      appError.recoveryActions![0].action();
    }).not.toThrow();
  });
});