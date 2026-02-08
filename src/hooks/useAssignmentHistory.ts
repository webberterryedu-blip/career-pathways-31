import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AssignmentHistory = Database['public']['Tables']['assignment_history']['Row'];

export interface AssignmentHistoryFilters {
  week?: string;
  meetingDate?: string;
  status?: string;
}

export function useAssignmentHistory(filters?: AssignmentHistoryFilters) {
  const [assignments, setAssignments] = useState<AssignmentHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('assignment_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.week) {
        query = query.eq('week', filters.week);
      }
      if (filters?.meetingDate) {
        query = query.eq('meeting_date', filters.meetingDate);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(`Erro ao buscar designações: ${queryError.message}`);
      }

      setAssignments(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar designações:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.week, filters?.meetingDate, filters?.status]);

  // Load assignments on mount
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    loading,
    error,
    fetchAssignments
  };
}
