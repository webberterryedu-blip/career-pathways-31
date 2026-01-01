import { supabase } from '@/integrations/supabase/client';

export interface ProgramaOficial {
  id: string;
  semana_inicio: string;
  semana_fim: string;
  mes_ano: string;
  tema: string | null;
  leitura_biblica: string | null;
  cantico_inicial: number | null;
  cantico_meio: number | null;
  cantico_final: number | null;
  partes: ParteProgramacao[];
  idioma: string;
  fonte_url: string | null;
  ultima_sincronizacao: string | null;
}

export interface ParteProgramacao {
  ordem: number;
  secao: 'tesouros' | 'ministerio' | 'vida_crista';
  tipo: string;
  titulo: string;
  duracao: number;
  referencia?: string;
  requer_assistente?: boolean;
}

export interface SincronizacaoLog {
  id: string;
  idioma: string;
  mes_ano: string | null;
  status: 'iniciado' | 'sucesso' | 'erro';
  programas_importados: number;
  erro_mensagem: string | null;
  created_at: string;
}

type JWOrgResponse<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

export const jworgApi = {
  // Sync programs from JW.org
  async sincronizar(idioma: string = 'pt', forceRefresh: boolean = false): Promise<JWOrgResponse> {
    const { data, error } = await supabase.functions.invoke('fetch-jworg-programs', {
      body: { idioma, forceRefresh },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Get all official programs
  async getProgramas(idioma: string = 'pt'): Promise<ProgramaOficial[]> {
    const { data, error } = await supabase
      .from('programas_oficiais')
      .select('*')
      .eq('idioma', idioma)
      .order('semana_inicio', { ascending: false });

    if (error) {
      console.error('Error fetching programs:', error);
      return [];
    }

    return (data || []).map(p => ({
      ...p,
      partes: (p.partes as unknown as ParteProgramacao[]) || []
    }));
  },

  // Get program for a specific week
  async getProgramaSemana(dataInicio: string, idioma: string = 'pt'): Promise<ProgramaOficial | null> {
    const { data, error } = await supabase
      .from('programas_oficiais')
      .select('*')
      .eq('idioma', idioma)
      .eq('semana_inicio', dataInicio)
      .maybeSingle();

    if (error) {
      console.error('Error fetching week program:', error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      partes: (data.partes as unknown as ParteProgramacao[]) || []
    };
  },

  // Get current week's program
  async getProgramaSemanaAtual(idioma: string = 'pt'): Promise<ProgramaOficial | null> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Get Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const mondayStr = monday.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('programas_oficiais')
      .select('*')
      .eq('idioma', idioma)
      .lte('semana_inicio', mondayStr)
      .gte('semana_fim', mondayStr)
      .maybeSingle();

    if (error) {
      console.error('Error fetching current week program:', error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      partes: (data.partes as unknown as ParteProgramacao[]) || []
    };
  },

  // Get sync history
  async getHistoricoSincronizacoes(limit: number = 10): Promise<SincronizacaoLog[]> {
    const { data, error } = await supabase
      .from('sincronizacoes_jworg')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching sync history:', error);
      return [];
    }

    return (data || []) as SincronizacaoLog[];
  },

  // Get upcoming weeks' programs
  async getProximasSemanas(idioma: string = 'pt', limit: number = 4): Promise<ProgramaOficial[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('programas_oficiais')
      .select('*')
      .eq('idioma', idioma)
      .gte('semana_inicio', today)
      .order('semana_inicio', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming programs:', error);
      return [];
    }

    return (data || []).map(p => ({
      ...p,
      partes: (p.partes as unknown as ParteProgramacao[]) || []
    }));
  }
};