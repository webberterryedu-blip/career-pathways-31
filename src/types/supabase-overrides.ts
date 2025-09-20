// Temporary type fixes to resolve build errors
import { Database } from '@/integrations/supabase/types';

// Override problematic types to prevent recursion
export type SimpleEstudante = {
  id: string;
  nome: string;
  genero: string;
  ativo: boolean;
  user_id: string;
  profile_id?: string;
  created_at: string;
  qualificacoes?: string[];
  disponibilidade?: any;
  cargo?: string;
  contador_designacoes?: number;
  data_nascimento?: string;
  familia_id?: string;
  menor?: boolean;
  responsavel_primario?: string;
  responsavel_secundario?: string;
  ultima_designacao?: string;
  updated_at?: string;
};

export type SimpleProfile = {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  cargo: string;
  role: 'admin' | 'instrutor' | 'estudante';
  congregacao?: string;
  data_nascimento?: string;
  created_at: string;
  updated_at: string;
};

export type SimpleDesignacao = {
  id: string;
  user_id: string;
  estudante_id: string;
  ajudante_id?: string;
  parte_id?: string;
  programa_id?: string;
  titulo_parte?: string;
  tempo_minutos?: number;
  cena?: string;
  status: string;
  observacoes?: string;
  data_designacao?: string;
  created_at: string;
  updated_at: string;
};

export type SimplePrograma = {
  id: string;
  user_id: string;
  nome: string;
  descricao?: string;
  tipo?: string;
  ativo?: boolean;
  created_at: string;
  updated_at: string;
};

export type SimplePartePrograma = {
  id: string;
  titulo: string;
  duracao_minutos?: number;
  semana_id?: string;
  ordem?: number;
  tipo?: string;
  tipo_designacao?: string;
  genero_requerido?: string;
  created_at: string;
};

// Simple supabase client with overrides
export const supabaseTypes = {} as Database;