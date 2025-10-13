import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineSyncManager, offlineSyncManager } from '../offlineSync';
import { offlineStorage } from '../../utils/offlineStorage';

// Mock dependencies
vi.mock('../../utils/offlineStorage', () => ({
  offlineStorage: {
    getPendingOperations: vi.fn(),
    storePendingOperation: vi.fn(),
    markOperationSynced: vi.fn(),
    cleanupSyncedOperations: vi.fn(),
    setSyncMetadata: vi.fn(),
    getSyncMetadata: vi.fn(),
    cacheData: vi.fn(),
    getCachedData: vi.fn()
  }
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock window event listeners
const mockAddEventListener = vi.spyOn(window, 'addEventListener');
const mockRemoveEventListener = vi.spyOn(window, 'removeEventListener');
const mockSetInterval = vi.spyOn(global, 'setInterval');
const mockClearInterval = vi.spyOn(global, 'clearInterval');

describe('OfflineSyncManager', () => {
  let syncManager: OfflineSyncManager;
  const mockOfflineStorage = offlineStorage as any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    // Reset mocks
    mockOfflineStorage.getPendingOperations.mockResolvedValue([]);
    mockOfflineStorage.getSyncMetadata.mockResolvedValue(null);
    mockOfflineStorage.getCachedData.mockResolvedValue([]);
    
    syncManager = OfflineSyncManager.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    syncManager.destroy();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = OfflineSyncManager.getInstance();
      const instance2 = OfflineSyncManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should use global instance', () => {
      expect(offlineSyncManager).toBe(syncManager);
    });
  });

  describe('Network Event Listeners', () => {
    it('should set up network event listeners', () => {
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('enable-offline-mode', expect.any(Function));
    });

    it('should start auto-sync interval', () => {
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
    });

    it('should handle online event', async () => {
      const syncSpy = vi.spyOn(syncManager, 'syncPendingOperations').mockResolvedValue({
        success: true,
        syncedOperations: 0,
        failedOperations: 0,
        errors: []
      });

      // Simulate going offline then online
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      // Trigger online event
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1] as Function;
      
      if (onlineHandler) {
        onlineHandler();
        
        // Wait for sync to be called
        await new Promise(resolve => setTimeout(resolve, 1100));
        expect(syncSpy).toHaveBeenCalled();
      }
    });

    it('should handle offline event', () => {
      const status = syncManager.getSyncStatus();
      
      // Trigger offline event
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1] as Function;
      
      if (offlineHandler) {
        offlineHandler();
        // Status should reflect offline state
      }
    });

    it('should handle custom offline mode event', () => {
      // Trigger custom offline event
      const customOfflineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'enable-offline-mode'
      )?.[1] as Function;
      
      if (customOfflineHandler) {
        customOfflineHandler();
        // Should set offline mode
      }
    });
  });

  describe('Sync Status Management', () => {
    it('should return correct sync status when online', async () => {
      mockOfflineStorage.getPendingOperations.mockResolvedValue([]);
      mockOfflineStorage.getSyncMetadata.mockResolvedValue('2024-01-01T00:00:00Z');

      const status = await syncManager.getSyncStatus();

      expect(status.isOnline).toBe(true);
      expect(status.isSyncing).toBe(false);
      expect(status.pendingOperations).toBe(0);
      expect(status.lastSync).toEqual(new Date('2024-01-01T00:00:00Z'));
    });

    it('should return correct sync status when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      mockOfflineStorage.getPendingOperations.mockResolvedValue([
        { id: '1', table: 'test', operation: 'insert', data: {} }
      ]);

      const status = await syncManager.getSyncStatus();

      expect(status.isOnline).toBe(false);
      expect(status.pendingOperations).toBe(1);
    });

    it('should handle null last sync timestamp', async () => {
      mockOfflineStorage.getSyncMetadata.mockResolvedValue(null);

      const status = await syncManager.getSyncStatus();

      expect(status.lastSync).toBeNull();
    });
  });

  describe('Sync Listeners', () => {
    it('should add and remove sync listeners', async () => {
      const listener = vi.fn();
      
      const unsubscribe = syncManager.addSyncListener(listener);
      
      // Trigger status change
      await syncManager.getSyncStatus();
      
      expect(typeof unsubscribe).toBe('function');
      
      // Unsubscribe
      unsubscribe();
    });

    it('should notify listeners on status change', async () => {
      const listener = vi.fn();
      syncManager.addSyncListener(listener);
      
      // Trigger status change by going offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1] as Function;
      
      if (offlineHandler) {
        await offlineHandler();
        expect(listener).toHaveBeenCalled();
      }
    });
  });

  describe('Data Caching', () => {
    it('should cache table data successfully', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      
      // Mock successful Supabase response
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockData, error: null })
      });

      await syncManager.cacheTableData('test_table');

      expect(mockOfflineStorage.cacheData).toHaveBeenCalledWith('test_table', mockData);
    });

    it('should handle caching errors', async () => {
      const mockError = new Error('Database error');
      
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: mockError })
      });

      await expect(syncManager.cacheTableData('test_table')).rejects.toThrow('Database error');
    });
  });

  describe('Data Retrieval', () => {
    it('should get data from server when online', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const result = await syncManager.getData('test_table');

      expect(result).toEqual(mockData);
      expect(mockOfflineStorage.cacheData).toHaveBeenCalledWith('test_table', mockData);
    });

    it('should fallback to cache when server fails', async () => {
      const mockCachedData = [{ id: '1', name: 'Cached' }];
      
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error('Network error'))
      });
      
      mockOfflineStorage.getCachedData.mockResolvedValue(mockCachedData);

      const result = await syncManager.getData('test_table');

      expect(result).toEqual(mockCachedData);
    });

    it('should return cached data when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const mockCachedData = [{ id: '1', name: 'Cached' }];
      mockOfflineStorage.getCachedData.mockResolvedValue(mockCachedData);

      const result = await syncManager.getData('test_table');

      expect(result).toEqual(mockCachedData);
    });

    it('should force online request when specified', async () => {
      const mockData = [{ id: '1', name: 'Online' }];
      
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const result = await syncManager.getData('test_table', true);

      expect(result).toEqual(mockData);
    });
  });

  describe('Data Insertion', () => {
    it('should insert data online successfully', async () => {
      const mockData = { name: 'Test' };
      const mockInsertedData = { id: '1', name: 'Test' };
      
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockInsertedData, error: null })
          })
        })
      });
      
      mockOfflineStorage.getCachedData.mockResolvedValue([]);

      const result = await syncManager.insertData('test_table', mockData);

      expect(result.data).toEqual(mockInsertedData);
      expect(result.error).toBeUndefined();
      expect(mockOfflineStorage.cacheData).toHaveBeenCalled();
    });

    it('should queue data for sync when online insert fails', async () => {
      const mockData = { name: 'Test' };
      const mockError = new Error('Insert failed');
      
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(mockError)
          })
        })
      });

      const result = await syncManager.insertData('test_table', mockData);

      expect(result.error).toEqual(mockError);
      expect(mockOfflineStorage.storePendingOperation).toHaveBeenCalledWith(
        'test_table', 'insert', mockData
      );
    });

    it('should queue data when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const mockData = { name: 'Test' };
      mockOfflineStorage.getCachedData.mockResolvedValue([]);

      const result = await syncManager.insertData('test_table', mockData);

      expect(result.data).toBeDefined();
      expect(result.data?.id).toMatch(/^temp_/);
      expect(result.data?._temp).toBe(true);
      expect(mockOfflineStorage.storePendingOperation).toHaveBeenCalledWith(
        'test_table', 'insert', mockData
      );
    });
  });

  describe('Data Updates', () => {
    it('should update data online successfully', async () => {
      const mockData = { name: 'Updated' };
      const mockUpdatedData = { id: '1', name: 'Updated' };
      
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockUpdatedData, error: null })
            })
          })
        })
      });
      
      mockOfflineStorage.getCachedData.mockResolvedValue([{ id: '1', name: 'Original' }]);

      const result = await syncManager.updateData('test_table', '1', mockData);

      expect(result.data).toEqual(mockUpdatedData);
      expect(result.error).toBeUndefined();
    });

    it('should queue update when online fails', async () => {
      const mockData = { name: 'Updated' };
      const mockError = new Error('Update failed');
      
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue(mockError)
            })
          })
        })
      });

      const result = await syncManager.updateData('test_table', '1', mockData);

      expect(result.error).toEqual(mockError);
      expect(mockOfflineStorage.storePendingOperation).toHaveBeenCalledWith(
        'test_table', 'update', { id: '1', ...mockData }
      );
    });

    it('should update cache when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const mockData = { name: 'Updated' };
      const originalData = [{ id: '1', name: 'Original' }];
      mockOfflineStorage.getCachedData.mockResolvedValue(originalData);

      const result = await syncManager.updateData('test_table', '1', mockData);

      expect(result.data).toBeDefined();
      expect(result.data?._modified).toBe(true);
      expect(mockOfflineStorage.storePendingOperation).toHaveBeenCalled();
    });
  });

  describe('Data Deletion', () => {
    it('should delete data online successfully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });
      
      mockOfflineStorage.getCachedData.mockResolvedValue([
        { id: '1', name: 'Test' },
        { id: '2', name: 'Other' }
      ]);

      const result = await syncManager.deleteData('test_table', '1');

      expect(result.error).toBeUndefined();
      expect(mockOfflineStorage.cacheData).toHaveBeenCalled();
    });

    it('should queue deletion when online fails', async () => {
      const mockError = new Error('Delete failed');
      
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockRejectedValue(mockError)
        })
      });

      const result = await syncManager.deleteData('test_table', '1');

      expect(result.error).toEqual(mockError);
      expect(mockOfflineStorage.storePendingOperation).toHaveBeenCalledWith(
        'test_table', 'delete', { id: '1' }
      );
    });

    it('should mark as deleted when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const originalData = [{ id: '1', name: 'Test' }];
      mockOfflineStorage.getCachedData.mockResolvedValue(originalData);

      const result = await syncManager.deleteData('test_table', '1');

      expect(result.error).toBeUndefined();
      expect(mockOfflineStorage.storePendingOperation).toHaveBeenCalled();
    });
  });

  describe('Pending Operations Sync', () => {
    it('should sync pending operations successfully', async () => {
      const mockOperations = [
        { id: '1', table: 'test', operation: 'insert', data: { name: 'Test' } },
        { id: '2', table: 'test', operation: 'update', data: { id: '1', name: 'Updated' } }
      ];
      
      mockOfflineStorage.getPendingOperations.mockResolvedValue(mockOperations);
      
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });

      const result = await syncManager.syncPendingOperations();

      expect(result.success).toBe(true);
      expect(result.syncedOperations).toBe(2);
      expect(result.failedOperations).toBe(0);
      expect(mockOfflineStorage.markOperationSynced).toHaveBeenCalledTimes(2);
      expect(mockOfflineStorage.cleanupSyncedOperations).toHaveBeenCalled();
      expect(mockOfflineStorage.setSyncMetadata).toHaveBeenCalledWith(
        'last_sync_timestamp', expect.any(Number)
      );
    });

    it('should handle sync failures', async () => {
      const mockOperations = [
        { id: '1', table: 'test', operation: 'insert', data: { name: 'Test' } }
      ];
      
      mockOfflineStorage.getPendingOperations.mockResolvedValue(mockOperations);
      
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        insert: vi.fn().mockRejectedValue(new Error('Sync failed'))
      });

      const result = await syncManager.syncPendingOperations();

      expect(result.success).toBe(false);
      expect(result.syncedOperations).toBe(0);
      expect(result.failedOperations).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      const result = await syncManager.syncPendingOperations();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Not online or already syncing');
    });

    it('should not sync when already syncing', async () => {
      // Start a sync operation
      const syncPromise = syncManager.syncPendingOperations();
      
      // Try to start another sync
      const result = await syncManager.syncPendingOperations();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Not online or already syncing');
      
      // Wait for first sync to complete
      await syncPromise;
    });

    it('should handle different operation types', async () => {
      const mockOperations = [
        { id: '1', table: 'test', operation: 'insert', data: { name: 'Test' } },
        { id: '2', table: 'test', operation: 'update', data: { id: '1', name: 'Updated' } },
        { id: '3', table: 'test', operation: 'delete', data: { id: '2' } }
      ];
      
      mockOfflineStorage.getPendingOperations.mockResolvedValue(mockOperations);
      
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });

      const result = await syncManager.syncPendingOperations();

      expect(result.success).toBe(true);
      expect(result.syncedOperations).toBe(3);
    });
  });

  describe('Preload Offline Data', () => {
    it('should preload essential tables', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockData, error: null })
      });

      await syncManager.preloadOfflineData();

      expect(mockOfflineStorage.cacheData).toHaveBeenCalledWith('estudantes', mockData);
      expect(mockOfflineStorage.cacheData).toHaveBeenCalledWith('congregacoes', mockData);
      expect(mockOfflineStorage.cacheData).toHaveBeenCalledWith('programas', mockData);
      expect(mockOfflineStorage.cacheData).toHaveBeenCalledWith('designacoes', mockData);
    });

    it('should handle preload failures gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error('Preload failed'))
      });

      // Should not throw
      await expect(syncManager.preloadOfflineData()).resolves.toBeUndefined();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      syncManager.destroy();

      expect(mockClearInterval).toHaveBeenCalled();
      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Auto-sync', () => {
    it('should auto-sync when online and not syncing', async () => {
      const syncSpy = vi.spyOn(syncManager, 'syncPendingOperations').mockResolvedValue({
        success: true,
        syncedOperations: 0,
        failedOperations: 0,
        errors: []
      });

      // Simulate auto-sync interval
      const intervalCallback = mockSetInterval.mock.calls[0]?.[0] as Function;
      if (intervalCallback) {
        intervalCallback();
        expect(syncSpy).toHaveBeenCalled();
      }
    });

    it('should not auto-sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const syncSpy = vi.spyOn(syncManager, 'syncPendingOperations');

      // Simulate auto-sync interval
      const intervalCallback = mockSetInterval.mock.calls[0]?.[0] as Function;
      if (intervalCallback) {
        intervalCallback();
        expect(syncSpy).not.toHaveBeenCalled();
      }
    });
  });
});
