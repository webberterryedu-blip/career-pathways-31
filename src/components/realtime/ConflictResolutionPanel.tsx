import { useState } from 'react';
import { AlertTriangle, Check, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAssignments } from '@/contexts/AssignmentContext';

/**
 * ConflictResolutionPanel - Handles conflicts between optimistic updates and server state
 * Shows pending updates and allows users to resolve conflicts
 */
export default function ConflictResolutionPanel() {
  const { optimisticUpdates, resolveConflict, retryFailedUpdates } = useAssignments();
  const [resolvingConflicts, setResolvingConflicts] = useState<Set<string>>(new Set());

  // Filter for updates that might have conflicts (older than 5 seconds)
  const potentialConflicts = optimisticUpdates.filter(update => 
    Date.now() - update.timestamp > 5000
  );

  const handleResolveConflict = async (updateId: string, resolution: 'accept' | 'reject') => {
    setResolvingConflicts(prev => new Set(prev).add(updateId));
    
    try {
      await resolveConflict(updateId, resolution);
    } catch (error) {
      console.error('Error resolving conflict:', error);
    } finally {
      setResolvingConflicts(prev => {
        const newSet = new Set(prev);
        newSet.delete(updateId);
        return newSet;
      });
    }
  };

  const handleRetryAll = async () => {
    try {
      await retryFailedUpdates();
    } catch (error) {
      console.error('Error retrying updates:', error);
    }
  };

  if (potentialConflicts.length === 0) {
    return null;
  }

  const formatTimestamp = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s atrás`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h atrás`;
  };

  const getUpdateTypeLabel = (type: string) => {
    switch (type) {
      case 'create': return 'Criação';
      case 'update': return 'Atualização';
      case 'delete': return 'Exclusão';
      default: return type;
    }
  };

  const getUpdateDescription = (update: any) => {
    switch (update.type) {
      case 'create':
        return `Nova designação: ${update.assignment?.partType || 'Desconhecida'}`;
      case 'update':
        return `Alteração em: ${update.assignment?.partType || 'Designação'}`;
      case 'delete':
        return `Exclusão de: ${update.originalAssignment?.partType || 'Designação'}`;
      default:
        return 'Operação desconhecida';
    }
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <CardTitle className="text-yellow-800">
            Conflitos Detectados
          </CardTitle>
        </div>
        <CardDescription className="text-yellow-700">
          Algumas alterações não foram sincronizadas com o servidor. 
          Resolva os conflitos abaixo.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {potentialConflicts.map((update) => (
          <div
            key={update.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {getUpdateTypeLabel(update.type)}
                </Badge>
                <span className="text-sm text-gray-600">
                  {formatTimestamp(update.timestamp)}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {getUpdateDescription(update)}
              </p>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResolveConflict(update.id, 'accept')}
                disabled={resolvingConflicts.has(update.id)}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <Check className="h-3 w-3 mr-1" />
                Manter
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResolveConflict(update.id, 'reject')}
                disabled={resolvingConflicts.has(update.id)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                Descartar
              </Button>
            </div>
          </div>
        ))}
        
        <div className="flex justify-between items-center pt-2 border-t border-yellow-200">
          <p className="text-sm text-yellow-700">
            {potentialConflicts.length} conflito(s) pendente(s)
          </p>
          
          <Button
            size="sm"
            onClick={handleRetryAll}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Tentar Novamente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}