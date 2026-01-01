-- Tabela para armazenar programas oficiais extraídos do JW.org
CREATE TABLE IF NOT EXISTS public.programas_oficiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semana_inicio DATE NOT NULL,
  semana_fim DATE NOT NULL,
  mes_ano TEXT NOT NULL,
  tema TEXT,
  leitura_biblica TEXT,
  cantico_inicial INTEGER,
  cantico_meio INTEGER,
  cantico_final INTEGER,
  partes JSONB NOT NULL DEFAULT '[]'::jsonb,
  idioma TEXT NOT NULL DEFAULT 'pt',
  fonte_url TEXT,
  ultima_sincronizacao TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_programas_oficiais_semana ON public.programas_oficiais (semana_inicio, semana_fim);
CREATE INDEX IF NOT EXISTS idx_programas_oficiais_mes_ano ON public.programas_oficiais (mes_ano);
CREATE INDEX IF NOT EXISTS idx_programas_oficiais_idioma ON public.programas_oficiais (idioma);

-- Constraint para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS uq_programas_oficiais_semana_idioma 
  ON public.programas_oficiais (semana_inicio, semana_fim, idioma);

-- Habilitar RLS
ALTER TABLE public.programas_oficiais ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso - todos podem ler
CREATE POLICY "Programas oficiais são visíveis para todos" 
ON public.programas_oficiais 
FOR SELECT 
USING (true);

-- Apenas usuários autenticados podem inserir/atualizar
CREATE POLICY "Usuários autenticados podem inserir programas" 
ON public.programas_oficiais 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar programas" 
ON public.programas_oficiais 
FOR UPDATE 
USING (true);

CREATE POLICY "Usuários autenticados podem deletar programas" 
ON public.programas_oficiais 
FOR DELETE 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_programas_oficiais_updated_at
BEFORE UPDATE ON public.programas_oficiais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para log de sincronizações
CREATE TABLE IF NOT EXISTS public.sincronizacoes_jworg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idioma TEXT NOT NULL,
  mes_ano TEXT,
  status TEXT NOT NULL CHECK (status IN ('iniciado', 'sucesso', 'erro')),
  programas_importados INTEGER DEFAULT 0,
  erro_mensagem TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para logs
ALTER TABLE public.sincronizacoes_jworg ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logs são visíveis para todos" 
ON public.sincronizacoes_jworg 
FOR SELECT 
USING (true);

CREATE POLICY "Sistema pode inserir logs" 
ON public.sincronizacoes_jworg 
FOR INSERT 
WITH CHECK (true);