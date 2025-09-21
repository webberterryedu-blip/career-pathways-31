-- =====================================================
-- FIX vw_estudantes_grid VIEW DEFINITION
-- =====================================================

-- Drop the incorrect view
DROP VIEW IF EXISTS public.vw_estudantes_grid;

-- Create the correct view with proper column references
CREATE OR REPLACE VIEW public.vw_estudantes_grid AS
SELECT 
  e.id,
  e.nome,
  e.genero,
  e.qualificacoes,
  e.ativo,
  e.congregacao_id as congregacao,
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

-- REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- VERIFY THE VIEW WAS CREATED CORRECTLY
SELECT COUNT(*) as record_count FROM public.vw_estudantes_grid LIMIT 1;