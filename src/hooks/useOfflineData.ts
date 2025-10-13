import { useState, useEffect, useCallback } from 'react';
import { offlineSyncManager, SyncStatus } from '../services/offlineSync';
import { useErrorHandler } from './useErrorHandler';

interface UseOfflineDataOptions {
  table: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface OfflineDataState<T> {
  data: T[];
  loading: boolean;
  error: any;
  isOffline: boolean;
  pendingOperations: number;
  lastSync: Date | null;
}

export const useOfflineData = <T = any>(options: UseOfflineDataOptions) => {
  const { table, autoRefresh = true, refreshInterval = 30000 } = options;
  const { handleError } = useErrorHandler();

  const [state, setState] = useState<OfflineDataState<T>>({
    data: [],
    loading: true,
    error: null,
    isOffline: !navigator.onLine,
    pendingOperations: 0,
    lastSync: null
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    pendingOperations: 0,
    hasConflicts: false
  });

  // Load data from cache or server
  const loadData = useCallback(async (forceOnline = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await offlineSyncManager.getData(table, forceOnline);
      setState(prev => ({
        ...prev,
        data,
        loading: false,
        error: null
      }));
    } catch (error) {
      const appError = handleError(error, {
        action: 'load_data',
        data: { table }
      });
      setState(prev => ({
        ...prev,
        loading: false,
        error: appError
      }));
    }
  }, [table, handleError]);

  // Insert new item
  const insertItem = useCallback(async (item: Partial<T>): Promise<{ data?: T; error?: any }> => {
    try {
      const result = await offlineSyncManager.insertData(table, item);
      
      if (result.data) {
        setState(prev => ({
          ...prev,
          data: [...prev.data, result.data]
        }));
      }

      return result;
    } catch (error) {
      const appError = handleError(error, {
        action: 'insert_item',
        data: { table, item }
      });
      return { error: appError };
    }
  }, [table, handleError]);

  // Update existing item
  const updateItem = useCallback(async (id: string, updates: Partial<T>): Promise<{ data?: T; error?: any }> => {
    try {
      const result = await offlineSyncManager.updateData(table, id, updates);
      
      if (result.data) {
        setState(prev => ({
          ...prev,
          data: prev.data.map(item => 
            (item as any).id === id ? result.data : item
          )
        }));
      }

      return result;
    } catch (error) {
      const appError = handleError(error, {
        action: 'update_item',
        data: { table, id, updates }
      });
      return { error: appError };
    }
  }, [table, handleError]);

  // Delete item
  const deleteItem = useCallback(async (id: string): Promise<{ error?: any }> => {
    try {
      const result = await offlineSyncManager.deleteData(table, id);
      
      if (!result.error) {
        setState(prev => ({
          ...prev,
          data: prev.data.filter(item => (item as any).id !== id)
        }));
      }

      return result;
    } catch (error) {
      const appError = handleError(error, {
        action: 'delete_item',
        data: { table, id }
      });
      return { error: appError };
    }
  }, [table, handleError]);

  // Refresh data from server
  const refresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  // Sync pending operations
  const sync = useCallback(async () => {
    try {
      const result = await offlineSyncManager.syncPendingOperations();
      
      if (result.success) {
        // Reload data after successful sync
        await loadData(true);
      }

      return result;
    } catch (error) {
      handleError(error, {
        action: 'sync_operations',
        data: { table }
      });
      return {
        success: false,
        syncedOperations: 0,
        failedOperations: 0,
        errors: [error]
      };
    }
  }, [loadData, handleError, table]);

  // Setup sync status listener
  useEffect(() => {
    const unsubscribe = offlineSyncManager.addSyncListener((status) => {
      setSyncStatus(status);
      setState(prev => ({
        ...prev,
        isOffline: !status.isOnline,
        pendingOperations: status.pendingOperations,
        lastSync: status.lastSync
      }));
    });

    return unsubscribe;
  }, []);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto refresh when online
  useEffect(() => {
    if (!autoRefresh || !syncStatus.isOnline) return;

    const interval = setInterval(() => {
      if (syncStatus.isOnline && !syncStatus.isSyncing) {
        loadData();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, syncStatus.isOnline, syncStatus.isSyncing, loadData]);

  // Auto sync when coming online
  useEffect(() => {
    if (syncStatus.isOnline && syncStatus.pendingOperations > 0) {
      sync();
    }
  }, [syncStatus.isOnline, syncStatus.pendingOperations, sync]);

  return {
    // Data state
    data: state.data,
    loading: state.loading,
    error: state.error,
    
    // Offline state
    isOffline: state.isOffline,
    pendingOperations: state.pendingOperations,
    lastSync: state.lastSync,
    isSyncing: syncStatus.isSyncing,
    hasConflicts: syncStatus.hasConflicts,

    // Actions
    loadData,
    insertItem,
    updateItem,
    deleteItem,
    refresh,
    sync,

    // Utilities
    isItemPending: (id: string) => {
      const item = state.data.find(item => (item as any).id === id);
      return item && ((item as any)._temp || (item as any)._modified);
    },
    isItemDeleted: (id: string) => {
      const item = state.data.find(item => (item as any).id === id);
      return item && (item as any)._deleted;
    }
  };
};