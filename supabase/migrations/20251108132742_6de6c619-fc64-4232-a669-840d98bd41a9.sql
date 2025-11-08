-- Create enum types for better type safety
CREATE TYPE genero AS ENUM ('masculino', 'feminino');
CREATE TYPE privilegio AS ENUM ('anciao', 'servo_ministerial', 'publicador');
CREATE TYPE secao_reuniao AS ENUM ('tesouros', 'ministerio', 'vida_crista');
CREATE TYPE status_designacao AS ENUM ('designado', 'confirmado', 'cancelado');

-- Students table (Estudantes)
CREATE TABLE public.estudantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  sobrenome TEXT NOT NULL,
  genero genero NOT NULL,
  privilegio privilegio NOT NULL DEFAULT 'publicador',
  email TEXT,
  telefone TEXT,
  data_batismo DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Part types (Tipos de Parte)
CREATE TABLE public.tipos_parte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE, -- e.g., 'leitura_biblia', 'primeira_conversa', 'revisita'
  nome TEXT NOT NULL,
  secao secao_reuniao NOT NULL,
  duracao_padrao_min INTEGER NOT NULL,
  requer_assistente BOOLEAN NOT NULL DEFAULT false,
  genero_requerido genero,
  requer_anciao BOOLEAN NOT NULL DEFAULT false,
  requer_servo_ministerial BOOLEAN NOT NULL DEFAULT false,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Programs (Programas Semanais)
CREATE TABLE public.programas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_semana TEXT NOT NULL UNIQUE, -- e.g., '2025-07-01' from JSON
  data_reuniao DATE NOT NULL,
  tema TEXT NOT NULL,
  leitura_biblia TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parts (Partes da Reunião)
CREATE TABLE public.partes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id UUID NOT NULL REFERENCES public.programas(id) ON DELETE CASCADE,
  tipo_parte_id UUID NOT NULL REFERENCES public.tipos_parte(id) ON DELETE RESTRICT,
  secao secao_reuniao NOT NULL,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  duracao_min INTEGER NOT NULL,
  requer_assistente BOOLEAN NOT NULL DEFAULT false,
  genero_requerido genero,
  requer_anciao BOOLEAN NOT NULL DEFAULT false,
  requer_servo_ministerial BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(programa_id, ordem)
);

-- Assignments (Designações)
CREATE TABLE public.designacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parte_id UUID NOT NULL REFERENCES public.partes(id) ON DELETE CASCADE,
  estudante_id UUID NOT NULL REFERENCES public.estudantes(id) ON DELETE RESTRICT,
  assistente_id UUID REFERENCES public.estudantes(id) ON DELETE SET NULL,
  status status_designacao NOT NULL DEFAULT 'designado',
  data_designacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmado_em TIMESTAMPTZ,
  cancelado_em TIMESTAMPTZ,
  motivo_cancelamento TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parte_id) -- One assignment per part
);

-- Assignment history for tracking changes
CREATE TABLE public.historico_designacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designacao_id UUID NOT NULL REFERENCES public.designacoes(id) ON DELETE CASCADE,
  estudante_anterior_id UUID REFERENCES public.estudantes(id) ON DELETE SET NULL,
  estudante_novo_id UUID REFERENCES public.estudantes(id) ON DELETE SET NULL,
  assistente_anterior_id UUID REFERENCES public.estudantes(id) ON DELETE SET NULL,
  assistente_novo_id UUID REFERENCES public.estudantes(id) ON DELETE SET NULL,
  acao TEXT NOT NULL, -- 'criado', 'atualizado', 'cancelado'
  motivo TEXT,
  alterado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_estudantes_genero ON public.estudantes(genero);
CREATE INDEX idx_estudantes_privilegio ON public.estudantes(privilegio);
CREATE INDEX idx_estudantes_ativo ON public.estudantes(ativo);
CREATE INDEX idx_programas_data ON public.programas(data_reuniao);
CREATE INDEX idx_partes_programa ON public.partes(programa_id);
CREATE INDEX idx_partes_secao ON public.partes(secao);
CREATE INDEX idx_designacoes_parte ON public.designacoes(parte_id);
CREATE INDEX idx_designacoes_estudante ON public.designacoes(estudante_id);
CREATE INDEX idx_designacoes_status ON public.designacoes(status);

-- Enable Row Level Security
ALTER TABLE public.estudantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_parte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_designacoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to read all data
CREATE POLICY "Anyone can view students" ON public.estudantes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view part types" ON public.tipos_parte
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view programs" ON public.programas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view parts" ON public.partes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view assignments" ON public.designacoes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view assignment history" ON public.historico_designacoes
  FOR SELECT TO authenticated USING (true);

-- RLS Policies: Allow authenticated users to insert/update/delete
-- (Later we'll add role-based restrictions with admin roles)
CREATE POLICY "Authenticated users can insert students" ON public.estudantes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update students" ON public.estudantes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete students" ON public.estudantes
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert programs" ON public.programas
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update programs" ON public.programas
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert parts" ON public.partes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update parts" ON public.partes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert assignments" ON public.designacoes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update assignments" ON public.designacoes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete assignments" ON public.designacoes
  FOR DELETE TO authenticated USING (true);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_estudantes_updated_at
  BEFORE UPDATE ON public.estudantes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_programas_updated_at
  BEFORE UPDATE ON public.programas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_designacoes_updated_at
  BEFORE UPDATE ON public.designacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert common part types based on S-38 rules
INSERT INTO public.tipos_parte (codigo, nome, secao, duracao_padrao_min, requer_assistente, genero_requerido, requer_anciao, requer_servo_ministerial, descricao) VALUES
  ('leitura_biblia', 'Leitura da Bíblia', 'tesouros', 4, false, 'masculino', false, true, 'Leitura da Bíblia - Apenas irmãos (anciãos ou servos ministeriais)'),
  ('primeira_conversa', 'Primeira Conversa', 'ministerio', 3, true, null, false, false, 'Primeira Conversa - Estudante e assistente'),
  ('revisita', 'Revisita', 'ministerio', 4, true, null, false, false, 'Revisita - Estudante e assistente'),
  ('estudo_biblico', 'Estudo Bíblico', 'ministerio', 5, true, null, false, false, 'Estudo Bíblico - Estudante e assistente'),
  ('discurso', 'Discurso', 'ministerio', 5, false, null, false, false, 'Discurso do ministério'),
  ('estudo_biblico_congregacao', 'Estudo Bíblico de Congregação', 'vida_crista', 30, false, 'masculino', true, false, 'Estudo Bíblico de Congregação - Apenas anciãos'),
  ('necessidades_congregacao', 'Necessidades da Congregação', 'vida_crista', 15, false, 'masculino', true, false, 'Necessidades da Congregação - Apenas anciãos'),
  ('parte_vida_crista', 'Parte da Vida Cristã', 'vida_crista', 15, false, null, false, false, 'Parte da seção Vida Cristã');

-- Add comment to tables
COMMENT ON TABLE public.estudantes IS 'Stores student information including gender, privileges, and availability';
COMMENT ON TABLE public.tipos_parte IS 'Defines part types and their S-38 rule restrictions';
COMMENT ON TABLE public.programas IS 'Weekly meeting programs';
COMMENT ON TABLE public.partes IS 'Individual parts within each program';
COMMENT ON TABLE public.designacoes IS 'Student assignments to specific parts';
COMMENT ON TABLE public.historico_designacoes IS 'Audit trail for assignment changes';