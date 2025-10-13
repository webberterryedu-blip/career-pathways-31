import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { offlineSyncManager, SyncStatus, SyncResult } from '../services/offlineSync';
import { offlineStorage } from '../utils/offlineStorage';

interface OfflineContextValue {
  // Status
  syncStatus: SyncStatus;
  
  // Actions
  sync: () => Promise<SyncResult>;
  preloadData: () => Promise<void>;
  clearCache: () => Promise<void>;
  
  // Utilities
  isOnline: boolean;
  canSync: boolean;
  hasOfflineCapability: boolean;
}

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    pendingOperations: 0,
    hasConflicts: false
  });

  const [hasOfflineCapability, setHasOfflineCapability] = useState(false);

  // Initialize offline capabilities
  useEffect(() => {
    const initializeOffline = async () => {
      try {
        // Check if IndexedDB is available
        if ('indexedDB' in window) {
          await offlineStorage.initialize();
          setHasOfflineCapability(true);
          
          // Preload essential data
          await offlineSyncManager.preloadOfflineData();
        }
      } catch (error) {
        console.warn('Failed to initialize offline capabilities:', error);
        setHasOfflineCapability(false);
      }
    };

    initializeOffline();
  }, []);

  // Setup sync status listener
  useEffect(() => {
    const updateStatus = async () => {
      try {
        const status = await offlineSyncManager.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.warn('Failed to get sync status:', error);
        // Set a default status on error
        setSyncStatus({
          isOnline: navigator.onLine,
          pendingOperations: 0,
          lastSync: null,
          isSyncing: false,
          hasConflicts: false,
        });
      }
    };

    updateStatus();

    const unsubscribe = offlineSyncManager.addSyncListener(setSyncStatus);
    return unsubscribe;
  }, []);

  // Sync pending operations
  const sync = async (): Promise<SyncResult> => {
    return await offlineSyncManager.syncPendingOperations();
  };

  // Preload data for offline use
  const preloadData = async (): Promise<void> => {
    await offlineSyncManager.preloadOfflineData();
  };

  // Clear offline cache
  const clearCache = async (): Promise<void> => {
    await offlineStorage.clearCache();
    setSyncStatus(prev => ({
      ...prev,
      pendingOperations: 0,
      lastSync: null
    }));
  };

  const value: OfflineContextValue = {
    // Status
    syncStatus,
    
    // Actions
    sync,
    preloadData,
    clearCache,
    
    // Utilities
    isOnline: syncStatus.isOnline,
    canSync: syncStatus.isOnline && !syncStatus.isSyncing && syncStatus.pendingOperations > 0,
    hasOfflineCapability
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextValue => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};