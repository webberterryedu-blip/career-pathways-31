-- =====================================================
-- FINAL FIX FOR vw_estudantes_grid VIEW
-- =====================================================

-- 1. First, let's check if the view exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'vw_estudantes_grid';

-- 2. Drop the existing view if it exists
DROP VIEW IF EXISTS public.vw_estudantes_grid;

-- 3. Create the correct view with proper column references
-- Note: We're using the actual column names from the tables
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
  p.cargo,
  p.role,
  e.created_at,
  e.updated_at
FROM public.estudantes e
LEFT JOIN public.profiles p ON p.id = e.profile_id OR p.user_id = e.user_id;

-- 4. Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- 5. Verify the view was created correctly
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'vw_estudantes_grid';

-- 6. Test the view with a simple query
SELECT COUNT(*) as record_count FROM public.vw_estudantes_grid;

-- 7. Show sample data from the view
SELECT * FROM public.vw_estudantes_grid LIMIT 3;