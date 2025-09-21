-- =====================================================
-- VERIFY CURRENT DATABASE SCHEMA
-- =====================================================

-- Check estudantes table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'estudantes'
ORDER BY ordinal_position;

-- Check profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if view exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'vw_estudantes_grid';

-- Count records in each table
SELECT 'estudantes' as table_name, COUNT(*) as record_count FROM public.estudantes
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM public.profiles
UNION ALL
SELECT 'vw_estudantes_grid' as table_name, COUNT(*) as record_count FROM public.vw_estudantes_grid;

-- Sample data from estudantes
SELECT 'Sample estudantes data' as info, id, nome, congregacao_id FROM public.estudantes LIMIT 3;

-- Sample data from profiles
SELECT 'Sample profiles data' as info, id, nome, congregacao FROM public.profiles LIMIT 3;