import { supabase } from '@/integrations/supabase/client';
import { offlineStorage, OfflineData } from '../utils/offlineStorage';
import { errorHandler } from '../utils/errorHandler';

export interface SyncResult {
  success: boolean;
  syncedOperations: number;
  failedOperations: number;
  errors: any[];
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingOperations: number;
  hasConflicts: boolean;
}

export class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private isOnline = navigator.onLine;
  private isSyncing = false;
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private autoSyncInterval: NodeJS.Timeout | null = null;

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager();
    }
    return OfflineSyncManager.instance;
  }

  constructor() {
    this.setupNetworkListeners();
    this.startAutoSync();
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyStatusChange();
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatusChange();
    });

    // Listen for custom offline mode events
    window.addEventListener('enable-offline-mode', () => {
      this.isOnline = false;
      this.notifyStatusChange();
    });
  }

  private startAutoSync(): void {
    // Sync every 5 minutes when online
    this.autoSyncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingOperations();
      }
    }, 5 * 60 * 1000);
  }

  // Add sync status listener
  addSyncListener(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private async notifyStatusChange(): Promise<void> {
    const status = await this.getSyncStatus();
    this.syncListeners.forEach(listener => listener(status));
  }

  // Get current sync status
  async getSyncStatus(): Promise<SyncStatus> {
    const pendingOperations = await offlineStorage.getPendingOperations();
    const lastSync = await offlineStorage.getSyncMetadata('last_sync_timestamp');

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSync: lastSync ? new Date(lastSync) : null,
      pendingOperations: pendingOperations.length,
      hasConflicts: false // TODO: Implement conflict detection
    };
  }

  // Cache data for offline access
  async cacheTableData(table: string): Promise<void> {
    try {
      const { data, error } = await (supabase as any)
        .from(table)
        .select('*');

      if (error) {
        // Handle specific error cases
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn(`Table ${table} does not exist, skipping cache`);
          return;
        }
        throw error;
      }

      if (data) {
        await offlineStorage.cacheData(table, data);
      }
    } catch (error) {
      console.warn(`Failed to cache ${table} data:`, error);
      // Don't throw error for missing tables, just log warning
      if (error instanceof Error && error.message?.includes('404')) {
        console.warn(`Table ${table} not found (404), skipping cache`);
        return;
      }
      // Only throw for unexpected errors
      throw error;
    }
  }

  // Get data (online or cached)
  async getData(table: string, forceOnline = false): Promise<any[]> {
    if (this.isOnline && !forceOnline) {
      try {
        const { data, error } = await (supabase as any)
          .from(table)
          .select('*');

        if (error) throw error;

        // Cache the fresh data
        if (data) {
          await offlineStorage.cacheData(table, data);
          return data;
        }
      } catch (error) {
        console.warn(`Failed to fetch ${table} online, falling back to cache:`, error);
      }
    }

    // Return cached data
    return await offlineStorage.getCachedData(table);
  }

  // Insert data (online or queue for sync)
  async insertData(table: string, data: any): Promise<{ data?: any; error?: any }> {
    if (this.isOnline) {
      try {
        const { data: insertedData, error } = await (supabase as any)
          .from(table)
          .insert(data)
          .select()
          .single();

        if (error) throw error;

        // Update cache
        const cachedData = await offlineStorage.getCachedData(table);
        cachedData.push(insertedData);
        await offlineStorage.cacheData(table, cachedData);

        return { data: insertedData };
      } catch (error) {
        // If online insert fails, queue for sync
        await offlineStorage.storePendingOperation(table, 'insert', data);
        return { error };
      }
    } else {
      // Queue for sync when online
      await offlineStorage.storePendingOperation(table, 'insert', data);
      
      // Add to cache with temporary ID
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempData = { ...data, id: tempId, _temp: true };
      
      const cachedData = await offlineStorage.getCachedData(table);
      cachedData.push(tempData);
      await offlineStorage.cacheData(table, cachedData);

      return { data: tempData };
    }
  }

  // Update data (online or queue for sync)
  async updateData(table: string, id: string, data: any): Promise<{ data?: any; error?: any }> {
    if (this.isOnline) {
      try {
        const { data: updatedData, error } = await (supabase as any)
          .from(table)
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // Update cache
        const cachedData = await offlineStorage.getCachedData(table);
        const index = cachedData.findIndex(item => item.id === id);
        if (index > -1) {
          cachedData[index] = updatedData;
          await offlineStorage.cacheData(table, cachedData);
        }

        return { data: updatedData };
      } catch (error) {
        // If online update fails, queue for sync
        await offlineStorage.storePendingOperation(table, 'update', { id, ...data });
        return { error };
      }
    } else {
      // Queue for sync when online
      await offlineStorage.storePendingOperation(table, 'update', { id, ...data });
      
      // Update cache
      const cachedData = await offlineStorage.getCachedData(table);
      const index = cachedData.findIndex(item => item.id === id);
      if (index > -1) {
        cachedData[index] = { ...cachedData[index], ...data, _modified: true };
        await offlineStorage.cacheData(table, cachedData);
      }

      return { data: cachedData[index] };
    }
  }

  // Delete data (online or queue for sync)
  async deleteData(table: string, id: string): Promise<{ error?: any }> {
    if (this.isOnline) {
      try {
        const { error } = await (supabase as any)
          .from(table)
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Remove from cache
        const cachedData = await offlineStorage.getCachedData(table);
        const filteredData = cachedData.filter(item => item.id !== id);
        await offlineStorage.cacheData(table, filteredData);

        return {};
      } catch (error) {
        // If online delete fails, queue for sync
        await offlineStorage.storePendingOperation(table, 'delete', { id });
        return { error };
      }
    } else {
      // Queue for sync when online
      await offlineStorage.storePendingOperation(table, 'delete', { id });
      
      // Mark as deleted in cache
      const cachedData = await offlineStorage.getCachedData(table);
      const index = cachedData.findIndex(item => item.id === id);
      if (index > -1) {
        cachedData[index] = { ...cachedData[index], _deleted: true };
        await offlineStorage.cacheData(table, cachedData);
      }

      return {};
    }
  }

  // Sync pending operations when online
  async syncPendingOperations(): Promise<SyncResult> {
    if (!this.isOnline || this.isSyncing) {
      return {
        success: false,
        syncedOperations: 0,
        failedOperations: 0,
        errors: ['Not online or already syncing']
      };
    }

    this.isSyncing = true;
    this.notifyStatusChange();

    const result: SyncResult = {
      success: true,
      syncedOperations: 0,
      failedOperations: 0,
      errors: []
    };

    try {
      const pendingOperations = await offlineStorage.getPendingOperations();
      
      for (const operation of pendingOperations) {
        try {
          await this.syncOperation(operation);
          await offlineStorage.markOperationSynced(operation.id);
          result.syncedOperations++;
        } catch (error) {
          result.failedOperations++;
          result.errors.push({
            operation: operation.id,
            error: error
          });
          
          errorHandler.processError(error, {
            action: 'sync_operation',
            data: { operation }
          });
        }
      }

      // Clean up synced operations
      await offlineStorage.cleanupSyncedOperations();
      
      // Update last sync timestamp
      await offlineStorage.setSyncMetadata('last_sync_timestamp', Date.now());

      result.success = result.failedOperations === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(error);
    } finally {
      this.isSyncing = false;
      this.notifyStatusChange();
    }

    return result;
  }

  private async syncOperation(operation: OfflineData): Promise<void> {
    const { table, data, operation: op } = operation;

    switch (op) {
      case 'insert':
        const { error: insertError } = await (supabase as any)
          .from(table)
          .insert(data);
        if (insertError) throw insertError;
        break;

      case 'update':
        const { id, ...updateData } = data;
        const { error: updateError } = await (supabase as any)
          .from(table)
          .update(updateData)
          .eq('id', id);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await (supabase as any)
          .from(table)
          .delete()
          .eq('id', data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  // Force sync when coming online
  private async syncWhenOnline(): Promise<void> {
    // Wait a bit for connection to stabilize
    setTimeout(() => {
      this.syncPendingOperations();
    }, 1000);
  }

  // Preload essential data for offline use
  async preloadOfflineData(): Promise<void> {
    const essentialTables = [
      'estudantes',
      'programas',
      'designacoes'
      // Note: 'congregacoes' table doesn't exist in current schema
    ];

    for (const table of essentialTables) {
      try {
        await this.cacheTableData(table);
      } catch (error) {
        console.warn(`Failed to preload ${table}:`, error);
        // Continue with other tables even if one fails
      }
    }
  }

  // Clean up resources
  destroy(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }
    
    window.removeEventListener('online', this.syncWhenOnline);
    window.removeEventListener('offline', this.notifyStatusChange);
    
    this.syncListeners = [];
  }
}

// Global offline sync manager instance
export const offlineSyncManager = OfflineSyncManager.getInstance();