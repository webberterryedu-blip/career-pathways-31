import React, { useState, useEffect } from 'react';
import { offlineSyncManager, SyncStatus } from '../../services/offlineSync';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const OfflineIndicator: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    pendingOperations: 0,
    hasConflicts: false
  });

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateStatus = async () => {
      const status = await offlineSyncManager.getSyncStatus();
      setSyncStatus(status);
    };

    updateStatus();

    const unsubscribe = offlineSyncManager.addSyncListener(setSyncStatus);
    return unsubscribe;
  }, []);

  const handleSync = async () => {
    await offlineSyncManager.syncPendingOperations();
  };

  const getStatusIcon = () => {
    if (syncStatus.isSyncing) {
      return <RefreshCw className="h-3 w-3 animate-spin" />;
    }
    if (!syncStatus.isOnline) {
      return <WifiOff className="h-3 w-3" />;
    }
    if (syncStatus.pendingOperations > 0) {
      return <Clock className="h-3 w-3" />;
    }
    return <Wifi className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (syncStatus.isSyncing) return 'Syncing...';
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.pendingOperations > 0) return `${syncStatus.pendingOperations} pending`;
    return 'Online';
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (!syncStatus.isOnline) return 'destructive';
    if (syncStatus.pendingOperations > 0) return 'secondary';
    return 'default';
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative">
      <Badge
        variant={getStatusVariant()}
        className={cn(
          "cursor-pointer transition-all duration-200",
          showDetails && "bg-opacity-80"
        )}
        onClick={() => setShowDetails(!showDetails)}
      >
        {getStatusIcon()}
        <span className="ml-1 text-xs">{getStatusText()}</span>
      </Badge>

      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 z-50">
          <Alert className="bg-white border shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {syncStatus.isOnline ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">
                  {syncStatus.isOnline ? 'Connected' : 'Offline Mode'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>

            <AlertDescription className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="font-medium">
                    {syncStatus.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Sync:</span>
                  <div className="font-medium">
                    {formatLastSync(syncStatus.lastSync)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Pending:</span>
                  <div className="font-medium">
                    {syncStatus.pendingOperations} operations
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Conflicts:</span>
                  <div className="font-medium">
                    {syncStatus.hasConflicts ? 'Yes' : 'None'}
                  </div>
                </div>
              </div>

              {!syncStatus.isOnline && (
                <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
                  <p className="text-yellow-800">
                    You're working offline. Changes will be saved locally and synced when you're back online.
                  </p>
                </div>
              )}

              {syncStatus.pendingOperations > 0 && syncStatus.isOnline && (
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSync}
                    disabled={syncStatus.isSyncing}
                    className="text-xs"
                  >
                    {syncStatus.isSyncing ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sync Now
                      </>
                    )}
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};