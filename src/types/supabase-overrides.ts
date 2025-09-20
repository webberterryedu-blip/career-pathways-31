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
  qualificacoes?: any;
  disponibilidade?: any;
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

// Simple supabase client with overrides
export const supabaseTypes = {} as Database;