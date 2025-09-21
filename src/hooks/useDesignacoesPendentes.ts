import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { safeQuery, logSupabaseError } from '@/utils/supabaseErrorHandler';

export interface DesignacaoPendente {
  id: string;
  parte_id: string;
  estudante_id: string | null;
  ajudante_id: string | null;
  status: 'designado' | 'realizado' | 'cancelado';
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DesignacaoStats {
  total: number;
  pendentes: number;
  designadas: number;
  realizadas: number;
  canceladas: number;
}

export const useDesignacoesPendentes = () => {
  const [designacoes, setDesignacoes] = useState<DesignacaoPendente[]>([]);
  const [stats, setStats] = useState<DesignacaoStats>({
    total: 0,
    pendentes: 0,
    designadas: 0,
    realizadas: 0,
    canceladas: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDesignacoes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      logger.debug('Fetching designações from Supabase...');

      const queryResult = await safeQuery(
        async () => {
          const { data, error } = await supabase
            .from('designacoes')
            .select(`
              id,
              parte_id,
              estudante_id,
              ajudante_id,
              status,
              observacoes,
              created_at,
              updated_at
            `)
            .order('created_at', { ascending: false });
          return { data, error };
        },
        [] // Fallback to empty array
      );

      if (queryResult.error && !queryResult.usedFallback) {
        logSupabaseError('fetchDesignacoes', queryResult.error);
        throw new Error(`Erro ao buscar designações: ${queryResult.error.message}`);
      }

      const designacoesData = (queryResult.data || []) as DesignacaoPendente[];
      setDesignacoes(designacoesData);

      // Calculate stats
      const newStats: DesignacaoStats = {
        total: designacoesData.length,
        pendentes: designacoesData.filter(d => !d.estudante_id || d.status === 'designado').length,
        designadas: designacoesData.filter(d => d.estudante_id && d.status === 'designado').length,
        realizadas: designacoesData.filter(d => d.status === 'realizado').length,
        canceladas: designacoesData.filter(d => d.status === 'cancelado').length
      };

      setStats(newStats);
      
      if (queryResult.usedFallback) {
        logger.warn('Using fallback data for designações due to schema cache issues');
      } else {
        logger.info(`Designações carregadas: ${newStats.total} total, ${newStats.pendentes} pendentes`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('Erro ao carregar designações:', errorMessage);
      setError(errorMessage);
      
      // Fallback to empty state
      setDesignacoes([]);
      setStats({
        total: 0,
        pendentes: 0,
        designadas: 0,
        realizadas: 0,
        canceladas: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to real-time changes
  useEffect(() => {
    fetchDesignacoes();

    const subscription = supabase
      .channel('designacoes_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'designacoes' 
      }, (payload) => {
        logger.debug('Designação real-time update:', payload);
        // Refetch data when changes occur
        fetchDesignacoes();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    designacoes,
    stats,
    isLoading,
    error,
    refetch: fetchDesignacoes
  };
};

export default useDesignacoesPendentes;