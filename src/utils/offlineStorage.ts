// Offline storage utilities for caching data and managing sync
export interface OfflineData {
  id: string;
  table: string;
  data: any;
  operation: 'insert' | 'update' | 'delete';
  timestamp: number;
  synced: boolean;
}

export interface CachedData {
  id: string;
  table: string;
  data: any;
  lastUpdated: number;
  version: number;
}

export class OfflineStorage {
  private static instance: OfflineStorage;
  private dbName = 'meeting-management-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('cached_data')) {
          const cachedStore = db.createObjectStore('cached_data', { keyPath: 'id' });
          cachedStore.createIndex('table', 'table', { unique: false });
          cachedStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        if (!db.objectStoreNames.contains('pending_operations')) {
          const pendingStore = db.createObjectStore('pending_operations', { keyPath: 'id' });
          pendingStore.createIndex('table', 'table', { unique: false });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
          pendingStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_metadata')) {
          db.createObjectStore('sync_metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // Clear all data (useful for debugging)
  async clearAllData(): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(['cached_data', 'pending_operations', 'sync_metadata'], 'readwrite');
        
        transaction.objectStore('cached_data').clear();
        transaction.objectStore('pending_operations').clear();
        transaction.objectStore('sync_metadata').clear();
        
        transaction.oncomplete = () => {
          console.log('All offline data cleared');
          resolve();
        };
        
        transaction.onerror = () => reject(transaction.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Check database health
  async checkDatabaseHealth(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      if (!this.db) await this.initialize();
      
      // Check if all required object stores exist
      const requiredStores = ['cached_data', 'pending_operations', 'sync_metadata'];
      for (const store of requiredStores) {
        if (!this.db!.objectStoreNames.contains(store)) {
          issues.push(`Missing object store: ${store}`);
        }
      }
      
      // Check if indexes exist
      const transaction = this.db!.transaction(['pending_operations'], 'readonly');
      const store = transaction.objectStore('pending_operations');
      
      const requiredIndexes = ['table', 'timestamp', 'synced'];
      for (const index of requiredIndexes) {
        try {
          store.index(index);
        } catch (error) {
          issues.push(`Missing index: ${index}`);
        }
      }
      
      return { healthy: issues.length === 0, issues };
    } catch (error) {
      issues.push(`Database initialization error: ${error}`);
      return { healthy: false, issues };
    }
  }

  // Cache data for offline access
  async cacheData(table: string, data: any[]): Promise<void> {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction(['cached_data'], 'readwrite');
    const store = transaction.objectStore('cached_data');

    const promises = data.map(item => {
      const cachedItem: CachedData = {
        id: `${table}_${item.id}`,
        table,
        data: item,
        lastUpdated: Date.now(),
        version: 1
      };
      return store.put(cachedItem);
    });

    await Promise.all(promises);
  }

  // Get cached data
  async getCachedData(table: string): Promise<any[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_data'], 'readonly');
      const store = transaction.objectStore('cached_data');
      const index = store.index('table');
      const request = index.getAll(table);

      request.onsuccess = () => {
        const cachedItems = request.result as CachedData[];
        const data = cachedItems.map(item => item.data);
        resolve(data);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Get single cached item
  async getCachedItem(table: string, id: string): Promise<any | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_data'], 'readonly');
      const store = transaction.objectStore('cached_data');
      const request = store.get(`${table}_${id}`);

      request.onsuccess = () => {
        const cachedItem = request.result as CachedData;
        resolve(cachedItem ? cachedItem.data : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Store pending operation for sync
  async storePendingOperation(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any
  ): Promise<string> {
    if (!this.db) await this.initialize();

    const operationId = `${table}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pendingOperation: OfflineData = {
      id: operationId,
      table,
      data,
      operation,
      timestamp: Date.now(),
      synced: false
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_operations'], 'readwrite');
      const store = transaction.objectStore('pending_operations');
      const request = store.add(pendingOperation);

      request.onsuccess = () => resolve(operationId);
      request.onerror = () => reject(request.error);
    });
  }

  // Get pending operations
  async getPendingOperations(): Promise<OfflineData[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(['pending_operations'], 'readonly');
        const store = transaction.objectStore('pending_operations');
        
        // Check if the index exists before using it
        let request;
        try {
          const index = store.index('synced');
          // Use IDBKeyRange for proper key handling
          const keyRange = IDBKeyRange.only(false);
          request = index.getAll(keyRange);
        } catch (indexError) {
          // Fallback to getting all records and filtering
          request = store.getAll();
        }

        request.onsuccess = () => {
          const results = request.result;
          // Filter for unsynced operations if we got all records
          const pendingOps = results.filter((op: OfflineData) => !op.synced);
          resolve(pendingOps);
        };
        
        request.onerror = () => reject(request.error);
        
        transaction.onerror = () => reject(transaction.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Mark operation as synced
  async markOperationSynced(operationId: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_operations'], 'readwrite');
      const store = transaction.objectStore('pending_operations');
      const getRequest = store.get(operationId);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.synced = true;
          const putRequest = store.put(operation);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Remove synced operations
  async cleanupSyncedOperations(): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_operations'], 'readwrite');
      const store = transaction.objectStore('pending_operations');
      const index = store.index('synced');
      const request = index.openCursor(IDBKeyRange.only(true));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Set sync metadata
  async setSyncMetadata(key: string, value: any): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_metadata'], 'readwrite');
      const store = transaction.objectStore('sync_metadata');
      const request = store.put({ key, value, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get sync metadata
  async getSyncMetadata(key: string): Promise<any> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_metadata'], 'readonly');
      const store = transaction.objectStore('sync_metadata');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Clear all cached data
  async clearCache(): Promise<void> {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction(['cached_data', 'pending_operations', 'sync_metadata'], 'readwrite');
    
    await Promise.all([
      transaction.objectStore('cached_data').clear(),
      transaction.objectStore('pending_operations').clear(),
      transaction.objectStore('sync_metadata').clear()
    ]);
  }

  // Get storage usage info
  async getStorageInfo(): Promise<{
    cachedItems: number;
    pendingOperations: number;
    lastSync: number | null;
  }> {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction(['cached_data', 'pending_operations', 'sync_metadata'], 'readonly');
    
    const [cachedCount, pendingCount, lastSync] = await Promise.all([
      this.getObjectStoreCount(transaction.objectStore('cached_data')),
      this.getObjectStoreCount(transaction.objectStore('pending_operations')),
      this.getSyncMetadata('last_sync_timestamp')
    ]);

    return {
      cachedItems: cachedCount,
      pendingOperations: pendingCount,
      lastSync
    };
  }

  private getObjectStoreCount(store: IDBObjectStore): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Global offline storage instance
export const offlineStorage = OfflineStorage.getInstance();