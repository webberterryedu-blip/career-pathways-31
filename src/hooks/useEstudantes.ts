import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Estudante {
  id: string;
  nome: string;
  genero: 'masculino' | 'feminino';
  qualificacoes: string[];
  ativo: boolean;
  email?: string;
  telefone?: string;
  profile_id: string;
  idade?: number;
  congregacao_id?: string;
  created_at?: string;
  disponibilidade?: any;
  user_id?: string;
}

export function useEstudantes() {
  const [estudantes, setEstudantes] = useState<Estudante[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstudantes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching estudantes from Supabase...');

      // First try the view
      let { data: estudantesData, error: estudantesError } = await supabase
        .from('vw_estudantes_grid')
        .select('*')
        .eq('ativo', true);

      // If view doesn't exist, fall back to direct table query
      if (estudantesError && estudantesError.message.includes('relation "vw_estudantes_grid" does not exist')) {
        console.log('vw_estudantes_grid view not found, falling back to direct table query...');
        ({ data: estudantesData, error: estudantesError } = await supabase
          .from('estudantes')
          .select(`
            *,
            profiles (id, nome, email, telefone, cargo)
          `)
          .eq('ativo', true));
      }

      if (estudantesError) {
        console.error('Error fetching estudantes:', estudantesError);
        setError(`Erro ao carregar estudantes: ${estudantesError.message}`);
        return;
      }

      if (!estudantesData || estudantesData.length === 0) {
        console.log('No estudantes found in database');
        setEstudantes([]);
        return;
      }

      // Transform the data
      const transformedEstudantes = estudantesData.map((estudante: any) => {
        // Handle both view and direct table formats
        const profileData = estudante.profiles || {};
        
        return {
          id: estudante.id,
          nome: estudante.nome || profileData.nome || 'Nome não informado',
          genero: estudante.genero,
          qualificacoes: estudante.qualificacoes || [],
          ativo: estudante.ativo,
          email: estudante.email || profileData.email || null,
          telefone: estudante.telefone || profileData.telefone || null,
          profile_id: estudante.profile_id || profileData.id || estudante.id,
          congregacao_id: estudante.congregacao_id || null,
        } as Estudante;
      });

      console.log(`Successfully loaded ${transformedEstudantes.length} estudantes`);
      setEstudantes(transformedEstudantes);

    } catch (err) {
      console.error('Unexpected error fetching estudantes:', err);
      setError('Erro inesperado ao carregar estudantes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load estudantes on mount
  useEffect(() => {
    fetchEstudantes();
  }, [fetchEstudantes]);

  const createEstudante = useCallback(async (data: any) => {
    // Implementation needed
    console.log('Creating estudante:', data);
  }, []);

  const updateEstudante = useCallback(async (id: string, data: any) => {
    // Implementation needed
    console.log('Updating estudante:', id, data);
  }, []);

  const deleteEstudante = useCallback(async (id: string) => {
    // Implementation needed
    console.log('Deleting estudante:', id);
  }, []);

  const filterEstudantes = useCallback((filters: any) => {
    // Implementation needed
    return estudantes;
  }, [estudantes]);

  const getStatistics = useCallback(() => {
    return {
      total: estudantes.length,
      active: estudantes.filter(e => e.ativo).length,
      inactive: estudantes.filter(e => !e.ativo).length,
      ativos: estudantes.filter(e => e.ativo).length,
      inativos: estudantes.filter(e => !e.ativo).length,
      menores: estudantes.filter(e => e.idade && e.idade < 18).length
    };
  }, [estudantes]);

  return {
    estudantes,
    isLoading,
    error,
    fetchEstudantes,
    refetch: fetchEstudantes,
    createEstudante,
    updateEstudante,
    deleteEstudante,
    filterEstudantes,
    getStatistics,
  };
}