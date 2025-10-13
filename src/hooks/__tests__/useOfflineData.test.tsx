import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineData } from '../useOfflineData';
import { offlineSyncManager } from '../../services/offlineSync';

// Mock offline sync manager
vi.mock('../../services/offlineSync', () => ({
  offlineSyncManager: {
    getData: vi.fn(),
    insertData: vi.fn(),
    updateData: vi.fn(),
    deleteData: vi.fn(),
    getSyncStatus: vi.fn(),
    addSyncListener: vi.fn(),
    syncPendingOperations: vi.fn(),
    preloadOfflineData: vi.fn()
  }
}));

const mockOfflineSyncManager = offlineSyncManager as any;

describe('useOfflineData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockOfflineSyncManager.getData.mockResolvedValue([]);
    mockOfflineSyncManager.insertData.mockResolvedValue({ data: { id: '1' } });
    mockOfflineSyncManager.updateData.mockResolvedValue({ data: { id: '1' } });
    mockOfflineSyncManager.deleteData.mockResolvedValue({});
    mockOfflineSyncManager.getSyncStatus.mockResolvedValue({
      isOnline: true,
      isSyncing: false,
      lastSync: null,
      pendingOperations: 0,
      hasConflicts: false
    });
    mockOfflineSyncManager.addSyncListener.mockReturnValue(() => {});
    mockOfflineSyncManager.syncPendingOperations.mockResolvedValue({
      success: true,
      syncedOperations: 0,
      failedOperations: 0,
      errors: []
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with default state', async () => {
      const { result } = renderHook(() => useOfflineData('test_table'));
      
      expect(result.current.data).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.syncStatus.isOnline).toBe(true);
      expect(result.current.syncStatus.isSyncing).toBe(false);
      expect(typeof result.current.insert).toBe('function');
      expect(typeof result.current.update).toBe('function');
      expect(typeof result.current.remove).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
      expect(typeof result.current.sync).toBe('function');
    });

    it('should load data on initialization', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      mockOfflineSyncManager.getData.mockResolvedValue(mockData);

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockOfflineSyncManager.getData).toHaveBeenCalledWith('test_table', false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
    });

    it('should handle initialization errors', async () => {
      const mockError = new Error('Failed to load data');
      mockOfflineSyncManager.getData.mockRejectedValue(mockError);

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe(mockError);
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual([]);
    });

    it('should set up sync status listener', async () => {
      const mockUnsubscribe = vi.fn();
      mockOfflineSyncManager.addSyncListener.mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useOfflineData('test_table'));
      
      expect(mockOfflineSyncManager.addSyncListener).toHaveBeenCalled();
      
      // Cleanup should call unsubscribe
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Data Operations', () => {
    it('should insert data successfully', async () => {
      const mockInsertedData = { id: '1', name: 'New Item' };
      mockOfflineSyncManager.insertData.mockResolvedValue({ data: mockInsertedData });

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initialization
      });

      let insertResult;
      await act(async () => {
        insertResult = await result.current.insert({ name: 'New Item' });
      });

      expect(mockOfflineSyncManager.insertData).toHaveBeenCalledWith('test_table', { name: 'New Item' });
      expect(insertResult).toEqual(mockInsertedData);
      expect(result.current.data).toContain(mockInsertedData);
    });

    it('should handle insert errors', async () => {
      const mockError = new Error('Insert failed');
      mockOfflineSyncManager.insertData.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        const insertResult = await result.current.insert({ name: 'New Item' });
        expect(insertResult).toBeNull();
      });

      expect(result.current.error).toBe(mockError);
    });

    it('should update data successfully', async () => {
      const initialData = [{ id: '1', name: 'Original' }];
      const updatedData = { id: '1', name: 'Updated' };
      
      mockOfflineSyncManager.getData.mockResolvedValue(initialData);
      mockOfflineSyncManager.updateData.mockResolvedValue({ data: updatedData });

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.update('1', { name: 'Updated' });
      });

      expect(mockOfflineSyncManager.updateData).toHaveBeenCalledWith('test_table', '1', { name: 'Updated' });
      expect(updateResult).toEqual(updatedData);
      expect(result.current.data[0]).toEqual(updatedData);
    });

    it('should handle update errors', async () => {
      const mockError = new Error('Update failed');
      mockOfflineSyncManager.updateData.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        const updateResult = await result.current.update('1', { name: 'Updated' });
        expect(updateResult).toBeNull();
      });

      expect(result.current.error).toBe(mockError);
    });

    it('should remove data successfully', async () => {
      const initialData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];
      
      mockOfflineSyncManager.getData.mockResolvedValue(initialData);
      mockOfflineSyncManager.deleteData.mockResolvedValue({});

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let removeResult;
      await act(async () => {
        removeResult = await result.current.remove('1');
      });

      expect(mockOfflineSyncManager.deleteData).toHaveBeenCalledWith('test_table', '1');
      expect(removeResult).toBe(true);
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].id).toBe('2');
    });

    it('should handle remove errors', async () => {
      const mockError = new Error('Delete failed');
      mockOfflineSyncManager.deleteData.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        const removeResult = await result.current.remove('1');
        expect(removeResult).toBe(false);
      });

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data successfully', async () => {
      const initialData = [{ id: '1', name: 'Initial' }];
      const refreshedData = [
        { id: '1', name: 'Initial' },
        { id: '2', name: 'New' }
      ];
      
      mockOfflineSyncManager.getData
        .mockResolvedValueOnce(initialData)
        .mockResolvedValueOnce(refreshedData);

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.data).toEqual(initialData);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.data).toEqual(refreshedData);
      expect(mockOfflineSyncManager.getData).toHaveBeenCalledTimes(2);
    });

    it('should handle refresh errors', async () => {
      const initialData = [{ id: '1', name: 'Initial' }];
      const mockError = new Error('Refresh failed');
      
      mockOfflineSyncManager.getData
        .mockResolvedValueOnce(initialData)
        .mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBe(mockError);
      expect(result.current.data).toEqual(initialData); // Should keep previous data
    });

    it('should force online refresh when specified', async () => {
      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.refresh(true);
      });

      expect(mockOfflineSyncManager.getData).toHaveBeenCalledWith('test_table', true);
    });
  });

  describe('Sync Operations', () => {
    it('should sync pending operations successfully', async () => {
      const mockSyncResult = {
        success: true,
        syncedOperations: 3,
        failedOperations: 0,
        errors: []
      };
      
      mockOfflineSyncManager.syncPendingOperations.mockResolvedValue(mockSyncResult);

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let syncResult;
      await act(async () => {
        syncResult = await result.current.sync();
      });

      expect(mockOfflineSyncManager.syncPendingOperations).toHaveBeenCalled();
      expect(syncResult).toEqual(mockSyncResult);
    });

    it('should handle sync errors', async () => {
      const mockSyncResult = {
        success: false,
        syncedOperations: 1,
        failedOperations: 2,
        errors: ['Error 1', 'Error 2']
      };
      
      mockOfflineSyncManager.syncPendingOperations.mockResolvedValue(mockSyncResult);

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let syncResult;
      await act(async () => {
        syncResult = await result.current.sync();
      });

      expect(syncResult).toEqual(mockSyncResult);
    });

    it('should refresh data after successful sync', async () => {
      const mockSyncResult = {
        success: true,
        syncedOperations: 1,
        failedOperations: 0,
        errors: []
      };
      
      const refreshedData = [{ id: '1', name: 'Synced' }];
      
      mockOfflineSyncManager.syncPendingOperations.mockResolvedValue(mockSyncResult);
      mockOfflineSyncManager.getData
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(refreshedData);

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.sync();
      });

      expect(result.current.data).toEqual(refreshedData);
      expect(mockOfflineSyncManager.getData).toHaveBeenCalledTimes(2);
    });
  });

  describe('Sync Status Updates', () => {
    it('should update sync status when listener is called', async () => {
      let statusListener: (status: any) => void;
      
      mockOfflineSyncManager.addSyncListener.mockImplementation((listener) => {
        statusListener = listener;
        return () => {};
      });

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const newStatus = {
        isOnline: false,
        isSyncing: true,
        lastSync: new Date(),
        pendingOperations: 5,
        hasConflicts: true
      };

      act(() => {
        statusListener!(newStatus);
      });

      expect(result.current.syncStatus).toEqual(newStatus);
    });

    it('should handle sync status listener errors', async () => {
      let statusListener: (status: any) => void;
      
      mockOfflineSyncManager.addSyncListener.mockImplementation((listener) => {
        statusListener = listener;
        return () => {};
      });

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should not throw when listener receives invalid data
      expect(() => {
        act(() => {
          statusListener!(null);
        });
      }).not.toThrow();
    });
  });

  describe('Loading States', () => {
    it('should show loading during operations', async () => {
      let resolveGetData: (value: any) => void;
      const getDataPromise = new Promise(resolve => {
        resolveGetData = resolve;
      });
      
      mockOfflineSyncManager.getData.mockReturnValue(getDataPromise);

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      expect(result.current.loading).toBe(true);
      
      await act(async () => {
        resolveGetData!([]);
        await getDataPromise;
      });
      
      expect(result.current.loading).toBe(false);
    });

    it('should show loading during refresh', async () => {
      mockOfflineSyncManager.getData.mockResolvedValue([]);

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      let resolveRefresh: (value: any) => void;
      const refreshPromise = new Promise(resolve => {
        resolveRefresh = resolve;
      });
      
      mockOfflineSyncManager.getData.mockReturnValue(refreshPromise);

      act(() => {
        result.current.refresh();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveRefresh!([]);
        await refreshPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should clear errors on successful operations', async () => {
      const mockError = new Error('Initial error');
      mockOfflineSyncManager.getData
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce([]);

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe(mockError);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBeNull();
    });

    it('should preserve data on operation errors', async () => {
      const initialData = [{ id: '1', name: 'Test' }];
      const mockError = new Error('Operation failed');
      
      mockOfflineSyncManager.getData.mockResolvedValue(initialData);
      mockOfflineSyncManager.insertData.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.data).toEqual(initialData);

      await act(async () => {
        await result.current.insert({ name: 'New' });
      });

      expect(result.current.error).toBe(mockError);
      expect(result.current.data).toEqual(initialData); // Should preserve original data
    });
  });

  describe('Optimistic Updates', () => {
    it('should add item optimistically on insert', async () => {
      const mockInsertedData = { id: '1', name: 'New Item' };
      
      let resolveInsert: (value: any) => void;
      const insertPromise = new Promise(resolve => {
        resolveInsert = resolve;
      });
      
      mockOfflineSyncManager.insertData.mockReturnValue(insertPromise);

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.insert({ name: 'New Item' });
      });

      // Should show optimistic update immediately
      expect(result.current.data).toHaveLength(1);

      await act(async () => {
        resolveInsert!({ data: mockInsertedData });
        await insertPromise;
      });

      expect(result.current.data[0]).toEqual(mockInsertedData);
    });

    it('should update item optimistically', async () => {
      const initialData = [{ id: '1', name: 'Original' }];
      const updatedData = { id: '1', name: 'Updated' };
      
      mockOfflineSyncManager.getData.mockResolvedValue(initialData);
      
      let resolveUpdate: (value: any) => void;
      const updatePromise = new Promise(resolve => {
        resolveUpdate = resolve;
      });
      
      mockOfflineSyncManager.updateData.mockReturnValue(updatePromise);

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.update('1', { name: 'Updated' });
      });

      // Should show optimistic update
      expect(result.current.data[0].name).toBe('Updated');

      await act(async () => {
        resolveUpdate!({ data: updatedData });
        await updatePromise;
      });

      expect(result.current.data[0]).toEqual(updatedData);
    });

    it('should remove item optimistically', async () => {
      const initialData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];
      
      mockOfflineSyncManager.getData.mockResolvedValue(initialData);
      
      let resolveDelete: (value: any) => void;
      const deletePromise = new Promise(resolve => {
        resolveDelete = resolve;
      });
      
      mockOfflineSyncManager.deleteData.mockReturnValue(deletePromise);

      const { result } = renderHook(() => useOfflineData('test_table'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.remove('1');
      });

      // Should show optimistic removal
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].id).toBe('2');

      await act(async () => {
        resolveDelete!({});
        await deletePromise;
      });

      expect(result.current.data).toHaveLength(1);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup sync listener on unmount', () => {
      const mockUnsubscribe = vi.fn();
      mockOfflineSyncManager.addSyncListener.mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useOfflineData('test_table'));
      
      expect(mockOfflineSyncManager.addSyncListener).toHaveBeenCalled();
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle cleanup when unsubscribe function is not available', () => {
      mockOfflineSyncManager.addSyncListener.mockReturnValue(undefined);

      const { unmount } = renderHook(() => useOfflineData('test_table'));
      
      // Should not throw when unsubscribe is not available
      expect(() => unmount()).not.toThrow();
    });
  });
});