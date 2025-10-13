import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { offlineStorage, OfflineData } from '../offlineStorage';

// Mock IndexedDB
const mockIDBDatabase = {
  transaction: vi.fn(),
  close: vi.fn(),
  createObjectStore: vi.fn(),
  deleteObjectStore: vi.fn()
};

const mockIDBTransaction = {
  objectStore: vi.fn(),
  oncomplete: null,
  onerror: null,
  onabort: null
};

const mockIDBObjectStore = {
  add: vi.fn(),
  put: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  createIndex: vi.fn(),
  index: vi.fn()
};

const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null
};

const mockIDBOpenRequest = {
  ...mockIDBRequest,
  onupgradeneeded: null,
  onblocked: null
};

// Mock IndexedDB API
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: vi.fn(() => mockIDBOpenRequest),
    deleteDatabase: vi.fn(() => mockIDBRequest)
  }
});

describe('OfflineStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);
    mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);
    
    // Setup default successful responses
    mockIDBObjectStore.add.mockReturnValue({ ...mockIDBRequest, result: 'success' });
    mockIDBObjectStore.put.mockReturnValue({ ...mockIDBRequest, result: 'success' });
    mockIDBObjectStore.get.mockReturnValue({ ...mockIDBRequest, result: null });
    mockIDBObjectStore.getAll.mockReturnValue({ ...mockIDBRequest, result: [] });
    mockIDBObjectStore.delete.mockReturnValue({ ...mockIDBRequest, result: undefined });
    mockIDBObjectStore.clear.mockReturnValue({ ...mockIDBRequest, result: undefined });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Database Initialization', () => {
    it('should initialize database successfully', async () => {
      const openRequest = mockIDBOpenRequest;
      openRequest.result = mockIDBDatabase;

      // Simulate successful database open
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: { result: mockIDBDatabase } } as any);
        }
      }, 0);

      const db = await offlineStorage.initDB();
      expect(db).toBe(mockIDBDatabase);
      expect(window.indexedDB.open).toHaveBeenCalledWith('MeetingManagementOffline', 1);
    });

    it('should handle database open errors', async () => {
      const openRequest = mockIDBOpenRequest;
      const mockError = new Error('Database open failed');

      // Simulate database open error
      setTimeout(() => {
        if (openRequest.onerror) {
          openRequest.onerror({ target: { error: mockError } } as any);
        }
      }, 0);

      await expect(offlineStorage.initDB()).rejects.toThrow('Database open failed');
    });

    it('should handle database upgrade', async () => {
      const openRequest = mockIDBOpenRequest;
      openRequest.result = mockIDBDatabase;

      // Simulate database upgrade needed
      setTimeout(() => {
        if (openRequest.onupgradeneeded) {
          openRequest.onupgradeneeded({ target: { result: mockIDBDatabase } } as any);
        }
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: { result: mockIDBDatabase } } as any);
        }
      }, 0);

      await offlineStorage.initDB();

      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('cache', { keyPath: 'table' });
      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('pendingOperations', { 
        keyPath: 'id', 
        autoIncrement: true 
      });
      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('metadata', { keyPath: 'key' });
    });
  });

  describe('Cache Operations', () => {
    beforeEach(() => {
      // Mock successful database initialization
      const openRequest = mockIDBOpenRequest;
      openRequest.result = mockIDBDatabase;
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: { result: mockIDBDatabase } } as any);
        }
      }, 0);
    });

    it('should cache data successfully', async () => {
      const testData = [{ id: '1', name: 'Test' }];
      const putRequest = { ...mockIDBRequest, result: 'success' };
      mockIDBObjectStore.put.mockReturnValue(putRequest);

      // Simulate successful put operation
      setTimeout(() => {
        if (putRequest.onsuccess) {
          putRequest.onsuccess({ target: { result: 'success' } } as any);
        }
      }, 0);

      await offlineStorage.cacheData('test_table', testData);

      expect(mockIDBDatabase.transaction).toHaveBeenCalledWith(['cache'], 'readwrite');
      expect(mockIDBObjectStore.put).toHaveBeenCalledWith({
        table: 'test_table',
        data: testData,
        timestamp: expect.any(Number)
      });
    });

    it('should handle cache errors', async () => {
      const testData = [{ id: '1', name: 'Test' }];
      const putRequest = { ...mockIDBRequest, error: new Error('Cache failed') };
      mockIDBObjectStore.put.mockReturnValue(putRequest);

      // Simulate put operation error
      setTimeout(() => {
        if (putRequest.onerror) {
          putRequest.onerror({ target: { error: new Error('Cache failed') } } as any);
        }
      }, 0);

      await expect(offlineStorage.cacheData('test_table', testData))
        .rejects.toThrow('Cache failed');
    });

    it('should retrieve cached data successfully', async () => {
      const cachedData = {
        table: 'test_table',
        data: [{ id: '1', name: 'Test' }],
        timestamp: Date.now()
      };
      
      const getRequest = { ...mockIDBRequest, result: cachedData };
      mockIDBObjectStore.get.mockReturnValue(getRequest);

      // Simulate successful get operation
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: { result: cachedData } } as any);
        }
      }, 0);

      const result = await offlineStorage.getCachedData('test_table');

      expect(result).toEqual(cachedData.data);
      expect(mockIDBDatabase.transaction).toHaveBeenCalledWith(['cache'], 'readonly');
      expect(mockIDBObjectStore.get).toHaveBeenCalledWith('test_table');
    });

    it('should return empty array when no cached data exists', async () => {
      const getRequest = { ...mockIDBRequest, result: undefined };
      mockIDBObjectStore.get.mockReturnValue(getRequest);

      // Simulate get operation with no result
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: { result: undefined } } as any);
        }
      }, 0);

      const result = await offlineStorage.getCachedData('nonexistent_table');

      expect(result).toEqual([]);
    });

    it('should handle cache retrieval errors', async () => {
      const getRequest = { ...mockIDBRequest, error: new Error('Get failed') };
      mockIDBObjectStore.get.mockReturnValue(getRequest);

      // Simulate get operation error
      setTimeout(() => {
        if (getRequest.onerror) {
          getRequest.onerror({ target: { error: new Error('Get failed') } } as any);
        }
      }, 0);

      await expect(offlineStorage.getCachedData('test_table'))
        .rejects.toThrow('Get failed');
    });

    it('should clear cache successfully', async () => {
      const clearRequest = { ...mockIDBRequest, result: undefined };
      mockIDBObjectStore.clear.mockReturnValue(clearRequest);

      // Simulate successful clear operation
      setTimeout(() => {
        if (clearRequest.onsuccess) {
          clearRequest.onsuccess({ target: { result: undefined } } as any);
        }
      }, 0);

      await offlineStorage.clearCache();

      expect(mockIDBDatabase.transaction).toHaveBeenCalledWith(['cache'], 'readwrite');
      expect(mockIDBObjectStore.clear).toHaveBeenCalled();
    });
  });

  describe('Pending Operations', () => {
    beforeEach(() => {
      // Mock successful database initialization
      const openRequest = mockIDBOpenRequest;
      openRequest.result = mockIDBDatabase;
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: { result: mockIDBDatabase } } as any);
        }
      }, 0);
    });

    it('should store pending operation successfully', async () => {
      const addRequest = { ...mockIDBRequest, result: 1 };
      mockIDBObjectStore.add.mockReturnValue(addRequest);

      // Simulate successful add operation
      setTimeout(() => {
        if (addRequest.onsuccess) {
          addRequest.onsuccess({ target: { result: 1 } } as any);
        }
      }, 0);

      await offlineStorage.storePendingOperation('test_table', 'insert', { name: 'Test' });

      expect(mockIDBDatabase.transaction).toHaveBeenCalledWith(['pendingOperations'], 'readwrite');
      expect(mockIDBObjectStore.add).toHaveBeenCalledWith({
        table: 'test_table',
        operation: 'insert',
        data: { name: 'Test' },
        timestamp: expect.any(Number),
        synced: false
      });
    });

    it('should handle pending operation storage errors', async () => {
      const addRequest = { ...mockIDBRequest, error: new Error('Add failed') };
      mockIDBObjectStore.add.mockReturnValue(addRequest);

      // Simulate add operation error
      setTimeout(() => {
        if (addRequest.onerror) {
          addRequest.onerror({ target: { error: new Error('Add failed') } } as any);
        }
      }, 0);

      await expect(offlineStorage.storePendingOperation('test_table', 'insert', { name: 'Test' }))
        .rejects.toThrow('Add failed');
    });

    it('should retrieve pending operations successfully', async () => {
      const pendingOps: OfflineData[] = [
        {
          id: 1,
          table: 'test_table',
          operation: 'insert',
          data: { name: 'Test' },
          timestamp: Date.now(),
          synced: false
        }
      ];

      const getAllRequest = { ...mockIDBRequest, result: pendingOps };
      mockIDBObjectStore.getAll.mockReturnValue(getAllRequest);

      // Simulate successful getAll operation
      setTimeout(() => {
        if (getAllRequest.onsuccess) {
          getAllRequest.onsuccess({ target: { result: pendingOps } } as any);
        }
      }, 0);

      const result = await offlineStorage.getPendingOperations();

      expect(result).toEqual(pendingOps);
      expect(mockIDBDatabase.transaction).toHaveBeenCalledWith(['pendingOperations'], 'readonly');
    });

    it('should filter out synced operations', async () => {
      const allOps: OfflineData[] = [
        {
          id: 1,
          table: 'test_table',
          operation: 'insert',
          data: { name: 'Test1' },
          timestamp: Date.now(),
          synced: false
        },
        {
          id: 2,
          table: 'test_table',
          operation: 'insert',
          data: { name: 'Test2' },
          timestamp: Date.now(),
          synced: true
        }
      ];

      const getAllRequest = { ...mockIDBRequest, result: allOps };
      mockIDBObjectStore.getAll.mockReturnValue(getAllRequest);

      // Simulate successful getAll operation
      setTimeout(() => {
        if (getAllRequest.onsuccess) {
          getAllRequest.onsuccess({ target: { result: allOps } } as any);
        }
      }, 0);

      const result = await offlineStorage.getPendingOperations();

      expect(result).toHaveLength(1);
      expect(result[0].synced).toBe(false);
    });

    it('should mark operation as synced', async () => {
      const getRequest = { 
        ...mockIDBRequest, 
        result: {
          id: 1,
          table: 'test_table',
          operation: 'insert',
          data: { name: 'Test' },
          timestamp: Date.now(),
          synced: false
        }
      };
      const putRequest = { ...mockIDBRequest, result: 'success' };
      
      mockIDBObjectStore.get.mockReturnValue(getRequest);
      mockIDBObjectStore.put.mockReturnValue(putRequest);

      // Simulate successful operations
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: { result: getRequest.result } } as any);
        }
      }, 0);
      
      setTimeout(() => {
        if (putRequest.onsuccess) {
          putRequest.onsuccess({ target: { result: 'success' } } as any);
        }
      }, 10);

      await offlineStorage.markOperationSynced(1);

      expect(mockIDBObjectStore.get).toHaveBeenCalledWith(1);
      expect(mockIDBObjectStore.put).toHaveBeenCalledWith({
        ...getRequest.result,
        synced: true
      });
    });

    it('should handle marking non-existent operation', async () => {
      const getRequest = { ...mockIDBRequest, result: undefined };
      mockIDBObjectStore.get.mockReturnValue(getRequest);

      // Simulate get operation with no result
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: { result: undefined } } as any);
        }
      }, 0);

      // Should not throw when operation doesn't exist
      await expect(offlineStorage.markOperationSynced(999)).resolves.toBeUndefined();
    });

    it('should cleanup synced operations', async () => {
      const syncedOps = [
        { id: 1, synced: true },
        { id: 2, synced: true }
      ];

      const getAllRequest = { ...mockIDBRequest, result: syncedOps };
      const deleteRequest = { ...mockIDBRequest, result: undefined };
      
      mockIDBObjectStore.getAll.mockReturnValue(getAllRequest);
      mockIDBObjectStore.delete.mockReturnValue(deleteRequest);

      // Simulate successful operations
      setTimeout(() => {
        if (getAllRequest.onsuccess) {
          getAllRequest.onsuccess({ target: { result: syncedOps } } as any);
        }
      }, 0);
      
      setTimeout(() => {
        if (deleteRequest.onsuccess) {
          deleteRequest.onsuccess({ target: { result: undefined } } as any);
        }
      }, 10);

      await offlineStorage.cleanupSyncedOperations();

      expect(mockIDBObjectStore.delete).toHaveBeenCalledWith(1);
      expect(mockIDBObjectStore.delete).toHaveBeenCalledWith(2);
    });
  });

  describe('Metadata Operations', () => {
    beforeEach(() => {
      // Mock successful database initialization
      const openRequest = mockIDBOpenRequest;
      openRequest.result = mockIDBDatabase;
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: { result: mockIDBDatabase } } as any);
        }
      }, 0);
    });

    it('should set metadata successfully', async () => {
      const putRequest = { ...mockIDBRequest, result: 'success' };
      mockIDBObjectStore.put.mockReturnValue(putRequest);

      // Simulate successful put operation
      setTimeout(() => {
        if (putRequest.onsuccess) {
          putRequest.onsuccess({ target: { result: 'success' } } as any);
        }
      }, 0);

      await offlineStorage.setSyncMetadata('test_key', 'test_value');

      expect(mockIDBDatabase.transaction).toHaveBeenCalledWith(['metadata'], 'readwrite');
      expect(mockIDBObjectStore.put).toHaveBeenCalledWith({
        key: 'test_key',
        value: 'test_value',
        timestamp: expect.any(Number)
      });
    });

    it('should get metadata successfully', async () => {
      const metadata = {
        key: 'test_key',
        value: 'test_value',
        timestamp: Date.now()
      };
      
      const getRequest = { ...mockIDBRequest, result: metadata };
      mockIDBObjectStore.get.mockReturnValue(getRequest);

      // Simulate successful get operation
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: { result: metadata } } as any);
        }
      }, 0);

      const result = await offlineStorage.getSyncMetadata('test_key');

      expect(result).toBe('test_value');
      expect(mockIDBDatabase.transaction).toHaveBeenCalledWith(['metadata'], 'readonly');
      expect(mockIDBObjectStore.get).toHaveBeenCalledWith('test_key');
    });

    it('should return null for non-existent metadata', async () => {
      const getRequest = { ...mockIDBRequest, result: undefined };
      mockIDBObjectStore.get.mockReturnValue(getRequest);

      // Simulate get operation with no result
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: { result: undefined } } as any);
        }
      }, 0);

      const result = await offlineStorage.getSyncMetadata('nonexistent_key');

      expect(result).toBeNull();
    });

    it('should handle metadata errors', async () => {
      const getRequest = { ...mockIDBRequest, error: new Error('Metadata failed') };
      mockIDBObjectStore.get.mockReturnValue(getRequest);

      // Simulate get operation error
      setTimeout(() => {
        if (getRequest.onerror) {
          getRequest.onerror({ target: { error: new Error('Metadata failed') } } as any);
        }
      }, 0);

      await expect(offlineStorage.getSyncMetadata('test_key'))
        .rejects.toThrow('Metadata failed');
    });
  });

  describe('Database Management', () => {
    it('should clear all data successfully', async () => {
      const clearRequest = { ...mockIDBRequest, result: undefined };
      mockIDBObjectStore.clear.mockReturnValue(clearRequest);

      // Simulate successful clear operations
      setTimeout(() => {
        if (clearRequest.onsuccess) {
          clearRequest.onsuccess({ target: { result: undefined } } as any);
        }
      }, 0);

      await offlineStorage.clearAllData();

      // Should clear all three stores
      expect(mockIDBObjectStore.clear).toHaveBeenCalledTimes(3);
    });

    it('should handle clear all data errors', async () => {
      const clearRequest = { ...mockIDBRequest, error: new Error('Clear failed') };
      mockIDBObjectStore.clear.mockReturnValue(clearRequest);

      // Simulate clear operation error
      setTimeout(() => {
        if (clearRequest.onerror) {
          clearRequest.onerror({ target: { error: new Error('Clear failed') } } as any);
        }
      }, 0);

      await expect(offlineStorage.clearAllData()).rejects.toThrow('Clear failed');
    });

    it('should get storage info successfully', async () => {
      const cacheData = [
        { table: 'table1', data: [1, 2, 3], timestamp: Date.now() },
        { table: 'table2', data: [4, 5], timestamp: Date.now() }
      ];
      
      const pendingOps = [
        { id: 1, synced: false },
        { id: 2, synced: false }
      ];

      const getAllRequest1 = { ...mockIDBRequest, result: cacheData };
      const getAllRequest2 = { ...mockIDBRequest, result: pendingOps };
      
      mockIDBObjectStore.getAll
        .mockReturnValueOnce(getAllRequest1)
        .mockReturnValueOnce(getAllRequest2);

      // Simulate successful operations
      setTimeout(() => {
        if (getAllRequest1.onsuccess) {
          getAllRequest1.onsuccess({ target: { result: cacheData } } as any);
        }
      }, 0);
      
      setTimeout(() => {
        if (getAllRequest2.onsuccess) {
          getAllRequest2.onsuccess({ target: { result: pendingOps } } as any);
        }
      }, 10);

      const info = await offlineStorage.getStorageInfo();

      expect(info.cachedTables).toBe(2);
      expect(info.totalCachedItems).toBe(5);
      expect(info.pendingOperations).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection failures gracefully', async () => {
      const openRequest = mockIDBOpenRequest;
      
      // Simulate database connection failure
      setTimeout(() => {
        if (openRequest.onerror) {
          openRequest.onerror({ target: { error: new Error('Connection failed') } } as any);
        }
      }, 0);

      await expect(offlineStorage.initDB()).rejects.toThrow('Connection failed');
    });

    it('should handle transaction failures', async () => {
      const openRequest = mockIDBOpenRequest;
      openRequest.result = mockIDBDatabase;
      
      // Mock transaction failure
      mockIDBDatabase.transaction.mockImplementation(() => {
        throw new Error('Transaction failed');
      });

      // Initialize database first
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: { result: mockIDBDatabase } } as any);
        }
      }, 0);

      await offlineStorage.initDB();

      await expect(offlineStorage.cacheData('test', [])).rejects.toThrow('Transaction failed');
    });

    it('should handle quota exceeded errors', async () => {
      const openRequest = mockIDBOpenRequest;
      openRequest.result = mockIDBDatabase;
      
      const putRequest = { 
        ...mockIDBRequest, 
        error: { name: 'QuotaExceededError', message: 'Quota exceeded' }
      };
      mockIDBObjectStore.put.mockReturnValue(putRequest);

      // Initialize database
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: { result: mockIDBDatabase } } as any);
        }
      }, 0);

      await offlineStorage.initDB();

      // Simulate quota exceeded error
      setTimeout(() => {
        if (putRequest.onerror) {
          putRequest.onerror({ 
            target: { 
              error: { name: 'QuotaExceededError', message: 'Quota exceeded' }
            } 
          } as any);
        }
      }, 10);

      await expect(offlineStorage.cacheData('test', [])).rejects.toThrow('Quota exceeded');
    });
  });
});