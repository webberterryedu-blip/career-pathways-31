-- Create app_role enum if not exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'instrutor', 'estudante');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure profiles has required columns and relaxed constraints
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.app_role DEFAULT 'instrutor';
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;
-- Add columns if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS congregacao TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- estudantes: align to code expectations
ALTER TABLE public.estudantes ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.estudantes ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.estudantes ADD COLUMN IF NOT EXISTS disponibilidade JSONB;

-- designacoes: add observacoes if missing
ALTER TABLE public.designacoes ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Create semanas_programa as expected by code
CREATE TABLE IF NOT EXISTS public.semanas_programa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  programa_id UUID REFERENCES public.programas_ministeriais(id) ON DELETE CASCADE,
  semana_numero INTEGER NOT NULL,
  data_inicio DATE,
  tema_semana TEXT,
  leitura_biblica TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partes_programa referencing semanas_programa for nested selection
CREATE TABLE IF NOT EXISTS public.partes_programa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  semana_id UUID REFERENCES public.semanas_programa(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT,
  duracao_minutos INTEGER,
  ordem INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS and permissive policies for new tables
ALTER TABLE public.semanas_programa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partes_programa ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "semanas_programa all" ON public.semanas_programa FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "partes_programa all" ON public.partes_programa FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;