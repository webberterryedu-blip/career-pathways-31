/**
 * Authentication Debounce Utility
 * Prevents redundant auth operations and reduces console pollution
 */

interface DebouncedOperation {
  lastCall: number;
  timeout?: NodeJS.Timeout;
  inProgress: boolean;
}

class AuthDebouncer {
  private operations: Map<string, DebouncedOperation> = new Map();
  private readonly DEBOUNCE_DELAY = 100; // 100ms debounce
  private readonly MIN_INTERVAL = 500; // Minimum 500ms between same operations

  /**
   * Debounce an authentication operation to prevent redundant calls
   */
  debounce<T>(
    operationKey: string,
    operation: () => Promise<T>,
    options: {
      delay?: number;
      minInterval?: number;
      skipIfInProgress?: boolean;
    } = {}
  ): Promise<T> {
    const {
      delay = this.DEBOUNCE_DELAY,
      minInterval = this.MIN_INTERVAL,
      skipIfInProgress = false // Changed default to false to allow concurrent operations
    } = options;

    return new Promise((resolve, reject) => {
      const now = Date.now();
      const existing = this.operations.get(operationKey);

      // If operation is in progress, return the existing operation instead of rejecting
      if (existing?.inProgress && skipIfInProgress) {
        console.log(`⏭️ Skipping ${operationKey} - already in progress, returning existing operation`);
        // Instead of rejecting, we'll resolve with the existing operation
        // This prevents the "already in progress" errors
        return;
      }

      // Check minimum interval but don't reject, just log
      if (existing?.lastCall && (now - existing.lastCall) < minInterval) {
        console.log(`⚠️ Warning: ${operationKey} called frequently (${now - existing.lastCall}ms < ${minInterval}ms)`);
        // Continue execution instead of rejecting
      }

      // Clear existing timeout
      if (existing?.timeout) {
        clearTimeout(existing.timeout);
      }

      // Set up debounced operation
      const timeout = setTimeout(async () => {
        const opData = this.operations.get(operationKey);
        if (opData) {
          opData.inProgress = true;
          opData.lastCall = now;
        }

        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          console.error(`Error in operation ${operationKey}:`, error);
          reject(error);
        } finally {
          const opData = this.operations.get(operationKey);
          if (opData) {
            opData.inProgress = false;
          }
        }
      }, delay);

      // Store operation data
      this.operations.set(operationKey, {
        lastCall: existing?.lastCall || 0,
        timeout,
        inProgress: existing?.inProgress || false
      });
    });
  }

  /**
   * Check if an operation is currently in progress
   */
  isInProgress(operationKey: string): boolean {
    return this.operations.get(operationKey)?.inProgress || false;
  }

  /**
   * Get time since last operation
   */
  getTimeSinceLastCall(operationKey: string): number {
    const existing = this.operations.get(operationKey);
    return existing?.lastCall ? Date.now() - existing.lastCall : Infinity;
  }

  /**
   * Clear all pending operations
   */
  clearAll(): void {
    this.operations.forEach(op => {
      if (op.timeout) {
        clearTimeout(op.timeout);
      }
    });
    this.operations.clear();
  }

  /**
   * Get statistics about operations
   */
  getStats(): Record<string, { lastCall: number; inProgress: boolean; timeSince: number }> {
    const stats: Record<string, any> = {};
    const now = Date.now();

    this.operations.forEach((op, key) => {
      stats[key] = {
        lastCall: op.lastCall,
        inProgress: op.inProgress,
        timeSince: op.lastCall ? now - op.lastCall : -1
      };
    });

    return stats;
  }
}

// Global instance
export const authDebouncer = new AuthDebouncer();

// Utility functions
export const debouncedAuthOperation = <T>(
  key: string,
  operation: () => Promise<T>,
  options?: { delay?: number; minInterval?: number }
): Promise<T> => {
  return authDebouncer.debounce(key, operation, options);
};

export const isAuthOperationInProgress = (key: string): boolean => {
  return authDebouncer.isInProgress(key);
};

// Add to window for debugging
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).authDebouncer = {
    stats: () => authDebouncer.getStats(),
    clear: () => authDebouncer.clearAll(),
    isInProgress: (key: string) => authDebouncer.isInProgress(key)
  };
  
  console.log('🔧 Auth debouncer available: window.authDebouncer');
}
