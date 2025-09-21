-- =====================================================
-- FIX DATABASE STRUCTURE FOR MINISTERIAL SYSTEM
-- =====================================================

-- 1. CREATE CONGREGACOES TABLE
CREATE TABLE IF NOT EXISTS public.congregacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security for congregacoes
ALTER TABLE public.congregacoes ENABLE ROW LEVEL SECURITY;

-- Insert sample congregations
INSERT INTO public.congregacoes (id, nome, cidade) VALUES
  ('78814c76-75b0-42ae-bb7c-9a8f0a3e5919', 'Congregação Almeida', 'São Paulo'),
  ('11c5bc9d-5476-483f-b4f0-537ed70ade51', 'Congregação Costa', 'Rio de Janeiro'),
  ('b88f6190-0194-414f-b85e-68823d68a317', 'Congregação Goes', 'Belo Horizonte'),
  ('014e0c2e-7e15-484c-bea8-fc6e72e8bc5d', 'Congregação Gomes', 'Porto Alegre')
ON CONFLICT (id) DO NOTHING;

-- 2. CREATE VW_ESTUDANTES_GRID VIEW
CREATE OR REPLACE VIEW public.vw_estudantes_grid AS
SELECT 
  e.id,
  e.nome,
  e.genero,
  e.qualificacoes,
  e.ativo,
  e.congregacao,
  e.user_id,
  e.profile_id,
  p.email,
  p.telefone,
  p.cargo,
  p.role,
  e.created_at,
  e.updated_at
FROM public.estudantes e
LEFT JOIN public.profiles p ON p.id = e.profile_id OR p.user_id = e.user_id;

-- 3. REFRESH SCHEMA CACHE
-- Run this command after creating the view:
NOTIFY pgrst, 'reload schema';

-- 4. VERIFY THE FIXES
-- After running the above commands, you can verify with these queries:

-- Check congregacoes table
SELECT 'congregacoes table' as check_name, count(*) as record_count FROM public.congregacoes;

-- Check vw_estudantes_grid view
SELECT 'vw_estudantes_grid view' as check_name, count(*) as record_count FROM public.vw_estudantes_grid;

-- Check sample data
SELECT 'Sample estudantes' as check_name, id, nome, cargo FROM public.estudantes LIMIT 5;