import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../useErrorHandler';
import { errorHandler } from '../../utils/errorHandler';
import { useErrorNotifications } from '../../components/ErrorNotification';

// Mock dependencies
vi.mock('../../utils/errorHandler', () => ({
  errorHandler: {
    processError: vi.fn(),
    handleSupabaseError: vi.fn(),
    handleNetworkError: vi.fn(),
    handleValidationError: vi.fn()
  },
  handleAsyncError: vi.fn()
}));

vi.mock('../../components/ErrorNotification', () => ({
  useErrorNotifications: vi.fn()
}));

const mockErrorHandler = errorHandler as any;
const mockUseErrorNotifications = useErrorNotifications as any;

describe('useErrorHandler', () => {
  const mockShowError = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseErrorNotifications.mockReturnValue({
      showError: mockShowError
    });
  });

  describe('Hook Initialization', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      expect(result.current).toBeDefined();
      expect(typeof result.current.handleError).toBe('function');
      expect(typeof result.current.handleSupabaseError).toBe('function');
      expect(typeof result.current.handleNetworkError).toBe('function');
      expect(typeof result.current.handleValidationError).toBe('function');
      expect(typeof result.current.withErrorHandling).toBe('function');
      expect(typeof result.current.safeAsync).toBe('function');
    });
  });

  describe('Error Handling Functions', () => {
    it('should handle generic errors', () => {
      const mockAppError = {
        id: 'error-1',
        type: 'unknown',
        message: 'Test error',
        userMessage: 'Something went wrong',
        timestamp: new Date()
      };
      
      mockErrorHandler.processError.mockReturnValue(mockAppError);
      
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        const appError = result.current.handleError(new Error('Test error'));
        expect(appError).toBe(mockAppError);
      });
      
      expect(mockErrorHandler.processError).toHaveBeenCalledWith(
        expect.any(Error),
        undefined
      );
      expect(mockShowError).toHaveBeenCalledWith(mockAppError);
    });

    it('should handle errors with context', () => {
      const mockAppError = {
        id: 'error-1',
        type: 'unknown',
        message: 'Test error',
        userMessage: 'Something went wrong',
        timestamp: new Date()
      };
      
      const context = { userId: 'user-1', action: 'test' };
      mockErrorHandler.processError.mockReturnValue(mockAppError);
      
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        result.current.handleError(new Error('Test error'), context);
      });
      
      expect(mockErrorHandler.processError).toHaveBeenCalledWith(
        expect.any(Error),
        context
      );
    });

    it('should handle Supabase errors', () => {
      const mockAppError = {
        id: 'error-1',
        type: 'database',
        message: 'Database error',
        userMessage: 'Database error occurred',
        timestamp: new Date()
      };
      
      const supabaseError = { code: 'PGRST116', message: 'No rows found' };
      mockErrorHandler.handleSupabaseError.mockReturnValue(mockAppError);
      
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        const appError = result.current.handleSupabaseError(supabaseError);
        expect(appError).toBe(mockAppError);
      });
      
      expect(mockErrorHandler.handleSupabaseError).toHaveBeenCalledWith(
        supabaseError,
        undefined
      );
      expect(mockShowError).toHaveBeenCalledWith(mockAppError);
    });

    it('should handle network errors', () => {
      const mockAppError = {
        id: 'error-1',
        type: 'network',
        message: 'Network error',
        userMessage: 'Connection problem',
        timestamp: new Date()
      };
      
      const networkError = { name: 'NetworkError', message: 'Connection failed' };
      mockErrorHandler.handleNetworkError.mockReturnValue(mockAppError);
      
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        const appError = result.current.handleNetworkError(networkError);
        expect(appError).toBe(mockAppError);
      });
      
      expect(mockErrorHandler.handleNetworkError).toHaveBeenCalledWith(
        networkError,
        undefined
      );
      expect(mockShowError).toHaveBeenCalledWith(mockAppError);
    });

    it('should handle validation errors', () => {
      const mockAppError = {
        id: 'error-1',
        type: 'validation',
        message: 'Validation failed',
        userMessage: 'Please check your input',
        timestamp: new Date()
      };
      
      const validationErrors = [
        { field: 'email', message: 'Invalid email', code: 'invalid', severity: 'error' as const }
      ];
      mockErrorHandler.handleValidationError.mockReturnValue(mockAppError);
      
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        const appError = result.current.handleValidationError(validationErrors);
        expect(appError).toBe(mockAppError);
      });
      
      expect(mockErrorHandler.handleValidationError).toHaveBeenCalledWith(
        validationErrors,
        undefined
      );
      expect(mockShowError).toHaveBeenCalledWith(mockAppError);
    });
  });

  describe('Async Error Handling', () => {
    it('should handle successful async operations', async () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const successOperation = async () => 'success result';
      
      await act(async () => {
        const response = await result.current.withErrorHandling(successOperation)();
        expect(response.data).toBe('success result');
        expect(response.error).toBeUndefined();
      });
    });

    it('should handle failed async operations', async () => {
      const mockAppError = {
        id: 'error-1',
        type: 'unknown',
        message: 'Async error',
        userMessage: 'Something went wrong',
        timestamp: new Date()
      };
      
      mockErrorHandler.processError.mockReturnValue(mockAppError);
      
      const { result } = renderHook(() => useErrorHandler());
      
      const failOperation = async () => {
        throw new Error('Async error');
      };
      
      await act(async () => {
        const response = await result.current.withErrorHandling(failOperation)();
        expect(response.data).toBeUndefined();
        expect(response.error).toBe(mockAppError);
      });
      
      expect(mockShowError).toHaveBeenCalledWith(mockAppError);
    });

    it('should handle async operations with context', async () => {
      const mockAppError = {
        id: 'error-1',
        type: 'unknown',
        message: 'Async error',
        userMessage: 'Something went wrong',
        timestamp: new Date()
      };
      
      const context = { action: 'async_test' };
      mockErrorHandler.processError.mockReturnValue(mockAppError);
      
      const { result } = renderHook(() => useErrorHandler());
      
      const failOperation = async () => {
        throw new Error('Async error');
      };
      
      await act(async () => {
        await result.current.withErrorHandling(failOperation, context)();
      });
      
      expect(mockErrorHandler.processError).toHaveBeenCalledWith(
        expect.any(Error),
        context
      );
    });

    it('should handle async operations with parameters', async () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const operationWithParams = async (a: number, b: number) => a + b;
      
      await act(async () => {
        const response = await result.current.withErrorHandling(operationWithParams)(2, 3);
        expect(response.data).toBe(5);
      });
    });
  });

  describe('Safe Async Operations', () => {
    it('should handle successful safe async operations', async () => {
      // Mock the handleAsyncError function
      const { handleAsyncError } = await import('../../utils/errorHandler');
      const mockHandleAsyncError = handleAsyncError as any;
      mockHandleAsyncError.mockResolvedValue({ data: 'success' });
      
      const { result } = renderHook(() => useErrorHandler());
      
      const operation = async () => 'success';
      
      await act(async () => {
        const response = await result.current.safeAsync(operation);
        expect(response.data).toBe('success');
      });
      
      expect(mockHandleAsyncError).toHaveBeenCalledWith(operation, undefined);
    });

    it('should handle failed safe async operations', async () => {
      const mockAppError = {
        id: 'error-1',
        type: 'unknown',
        message: 'Safe async error',
        userMessage: 'Something went wrong',
        timestamp: new Date()
      };
      
      const { handleAsyncError } = await import('../../utils/errorHandler');
      const mockHandleAsyncError = handleAsyncError as any;
      mockHandleAsyncError.mockResolvedValue({ error: mockAppError });
      
      const { result } = renderHook(() => useErrorHandler());
      
      const operation = async () => {
        throw new Error('Safe async error');
      };
      
      await act(async () => {
        const response = await result.current.safeAsync(operation);
        expect(response.error).toBe(mockAppError);
      });
    });

    it('should handle safe async operations with context', async () => {
      const { handleAsyncError } = await import('../../utils/errorHandler');
      const mockHandleAsyncError = handleAsyncError as any;
      mockHandleAsyncError.mockResolvedValue({ data: 'success' });
      
      const { result } = renderHook(() => useErrorHandler());
      
      const operation = async () => 'success';
      const context = { action: 'safe_test' };
      
      await act(async () => {
        await result.current.safeAsync(operation, context);
      });
      
      expect(mockHandleAsyncError).toHaveBeenCalledWith(operation, context);
    });
  });

  describe('Function Stability', () => {
    it('should maintain function references across re-renders', () => {
      const { result, rerender } = renderHook(() => useErrorHandler());
      
      const firstRender = {
        handleError: result.current.handleError,
        handleSupabaseError: result.current.handleSupabaseError,
        handleNetworkError: result.current.handleNetworkError,
        handleValidationError: result.current.handleValidationError,
        withErrorHandling: result.current.withErrorHandling,
        safeAsync: result.current.safeAsync
      };
      
      rerender();
      
      const secondRender = {
        handleError: result.current.handleError,
        handleSupabaseError: result.current.handleSupabaseError,
        handleNetworkError: result.current.handleNetworkError,
        handleValidationError: result.current.handleValidationError,
        withErrorHandling: result.current.withErrorHandling,
        safeAsync: result.current.safeAsync
      };
      
      // Functions should be stable (same reference)
      expect(firstRender.handleError).toBe(secondRender.handleError);
      expect(firstRender.handleSupabaseError).toBe(secondRender.handleSupabaseError);
      expect(firstRender.handleNetworkError).toBe(secondRender.handleNetworkError);
      expect(firstRender.handleValidationError).toBe(secondRender.handleValidationError);
      expect(firstRender.withErrorHandling).toBe(secondRender.withErrorHandling);
      expect(firstRender.safeAsync).toBe(secondRender.safeAsync);
    });

    it('should update functions when showError changes', () => {
      const { result, rerender } = renderHook(() => useErrorHandler());
      
      const firstHandleError = result.current.handleError;
      
      // Change the showError mock
      const newShowError = vi.fn();
      mockUseErrorNotifications.mockReturnValue({
        showError: newShowError
      });
      
      rerender();
      
      const secondHandleError = result.current.handleError;
      
      // Function should be different due to dependency change
      expect(firstHandleError).not.toBe(secondHandleError);
    });
  });

  describe('Error Notification Integration', () => {
    it('should call showError for all error types', () => {
      const mockAppError = {
        id: 'error-1',
        type: 'unknown',
        message: 'Test error',
        userMessage: 'Something went wrong',
        timestamp: new Date()
      };
      
      mockErrorHandler.processError.mockReturnValue(mockAppError);
      mockErrorHandler.handleSupabaseError.mockReturnValue(mockAppError);
      mockErrorHandler.handleNetworkError.mockReturnValue(mockAppError);
      mockErrorHandler.handleValidationError.mockReturnValue(mockAppError);
      
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        result.current.handleError(new Error('Test'));
        result.current.handleSupabaseError({ code: 'PGRST116' });
        result.current.handleNetworkError({ name: 'NetworkError' });
        result.current.handleValidationError([]);
      });
      
      expect(mockShowError).toHaveBeenCalledTimes(4);
      expect(mockShowError).toHaveBeenCalledWith(mockAppError);
    });

    it('should not call showError when useErrorNotifications is not available', () => {
      mockUseErrorNotifications.mockReturnValue({});
      
      const mockAppError = {
        id: 'error-1',
        type: 'unknown',
        message: 'Test error',
        userMessage: 'Something went wrong',
        timestamp: new Date()
      };
      
      mockErrorHandler.processError.mockReturnValue(mockAppError);
      
      const { result } = renderHook(() => useErrorHandler());
      
      // Should not throw when showError is not available
      expect(() => {
        act(() => {
          result.current.handleError(new Error('Test'));
        });
      }).not.toThrow();
    });
  });

  describe('Complex Error Scenarios', () => {
    it('should handle nested async operations', async () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const nestedOperation = async () => {
        const innerOperation = async () => 'inner result';
        return await innerOperation();
      };
      
      await act(async () => {
        const response = await result.current.withErrorHandling(nestedOperation)();
        expect(response.data).toBe('inner result');
      });
    });

    it('should handle multiple concurrent errors', async () => {
      const mockAppError = {
        id: 'error-1',
        type: 'unknown',
        message: 'Concurrent error',
        userMessage: 'Something went wrong',
        timestamp: new Date()
      };
      
      mockErrorHandler.processError.mockReturnValue(mockAppError);
      
      const { result } = renderHook(() => useErrorHandler());
      
      const failOperation = async () => {
        throw new Error('Concurrent error');
      };
      
      await act(async () => {
        const promises = [
          result.current.withErrorHandling(failOperation)(),
          result.current.withErrorHandling(failOperation)(),
          result.current.withErrorHandling(failOperation)()
        ];
        
        const results = await Promise.all(promises);
        
        results.forEach(result => {
          expect(result.error).toBe(mockAppError);
        });
      });
      
      expect(mockShowError).toHaveBeenCalledTimes(3);
    });

    it('should handle errors with complex data types', () => {
      const complexError = {
        name: 'ComplexError',
        message: 'Complex error occurred',
        details: {
          code: 'COMPLEX_001',
          metadata: {
            timestamp: Date.now(),
            context: { userId: 'user-1' }
          }
        }
      };
      
      const mockAppError = {
        id: 'error-1',
        type: 'unknown',
        message: 'Complex error occurred',
        userMessage: 'Something went wrong',
        timestamp: new Date(),
        details: complexError
      };
      
      mockErrorHandler.processError.mockReturnValue(mockAppError);
      
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        const appError = result.current.handleError(complexError);
        expect(appError.details).toBe(complexError);
      });
    });
  });
});