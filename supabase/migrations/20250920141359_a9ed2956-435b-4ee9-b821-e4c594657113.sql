-- Add missing columns to existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS congregacao TEXT;

-- Add missing columns to designacoes
ALTER TABLE public.designacoes ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Create missing tables that the code expects
CREATE TABLE IF NOT EXISTS public.partes_programa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  programa_id UUID REFERENCES public.programas_ministeriais(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT,
  duracao_minutos INTEGER,
  ordem INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.semanas_programa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  programa_id UUID REFERENCES public.programas_ministeriais(id) ON DELETE CASCADE,
  semana INTEGER NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.partes_programa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semanas_programa ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Users can access partes_programa" ON public.partes_programa
  FOR ALL USING (true);

CREATE POLICY "Users can access semanas_programa" ON public.semanas_programa
  FOR ALL USING (true);