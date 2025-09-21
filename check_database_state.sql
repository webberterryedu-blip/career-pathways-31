-- Check current state of the database

-- 1. Check if the vw_estudantes_grid view exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'vw_estudantes_grid'
) as view_exists;

-- 2. Check if the estudantes table exists and has data
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'estudantes'
) as table_exists;

-- 3. Count records in estudantes table
SELECT COUNT(*) as estudantes_count FROM public.estudantes;

-- 4. Count records in profiles table
SELECT COUNT(*) as profiles_count FROM public.profiles;

-- 5. Check columns in estudantes table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'estudantes'
ORDER BY ordinal_position;

-- 6. Check columns in profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 7. Check if the view can be queried (this will show the error if it doesn't exist)
SELECT COUNT(*) as view_count FROM public.vw_estudantes_grid;