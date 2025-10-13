/**
 * Debug utilities for offline storage issues
 */
import { offlineStorage } from './offlineStorage';

// Add debug utilities to window object for console access
declare global {
  interface Window {
    debugOffline: {
      checkHealth: () => Promise<void>;
      clearAll: () => Promise<void>;
      getPendingOps: () => Promise<void>;
      resetDatabase: () => Promise<void>;
    };
  }
}

export const initializeDebugUtils = () => {
  if (typeof window !== 'undefined') {
    window.debugOffline = {
      // Check database health
      checkHealth: async () => {
        try {
          const health = await offlineStorage.checkDatabaseHealth();
          console.log('Database Health Check:', health);
          
          if (!health.healthy) {
            console.warn('Database issues found:', health.issues);
            console.log('Try running: debugOffline.resetDatabase()');
          } else {
            console.log('✅ Database is healthy');
          }
        } catch (error) {
          console.error('Health check failed:', error);
        }
      },

      // Clear all data
      clearAll: async () => {
        try {
          await offlineStorage.clearAllData();
          console.log('✅ All offline data cleared');
        } catch (error) {
          console.error('Failed to clear data:', error);
        }
      },

      // Get pending operations (with error handling)
      getPendingOps: async () => {
        try {
          const ops = await offlineStorage.getPendingOperations();
          console.log('Pending operations:', ops);
        } catch (error) {
          console.error('Failed to get pending operations:', error);
          console.log('This might indicate an IndexedDB corruption issue');
          console.log('Try running: debugOffline.resetDatabase()');
        }
      },

      // Reset database completely
      resetDatabase: async () => {
        try {
          // Close current connection
          const storage = offlineStorage as any;
          if (storage.db) {
            storage.db.close();
            storage.db = null;
          }

          // Delete the database
          const deleteRequest = indexedDB.deleteDatabase('meeting-management-offline');
          
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve(undefined);
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onblocked = () => {
              console.warn('Database deletion blocked. Close all tabs and try again.');
              reject(new Error('Database deletion blocked'));
            };
          });

          console.log('✅ Database deleted successfully');
          console.log('Refresh the page to recreate the database');
        } catch (error) {
          console.error('Failed to reset database:', error);
        }
      },
    };

    console.log('🔧 Debug utilities loaded. Available commands:');
    console.log('  debugOffline.checkHealth() - Check database health');
    console.log('  debugOffline.clearAll() - Clear all offline data');
    console.log('  debugOffline.getPendingOps() - Get pending operations');
    console.log('  debugOffline.resetDatabase() - Reset database completely');
  }
};