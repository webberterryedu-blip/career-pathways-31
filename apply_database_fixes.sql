-- =====================================================
-- COMPLETE DATABASE FIXES FOR CAREER PATHWAYS
-- =====================================================

-- 1. APPLY THE MISSING VIEW AND SCHEMA FIXES
-- This will create the missing view and ensure schema consistency
\ir supabase/migrations/20250921100000_fix_missing_view_and_schema.sql

-- 2. INSERT STUDENT DATA (SIMPLIFIED VERSION)
-- This will populate the estudantes table with student data
\ir estudantes_insert_simplified.sql

-- 3. VERIFY THE FIXES
-- Check that the view exists and has data
SELECT 'Database fixes applied successfully' as message;

-- Verify the view exists and has data
SELECT COUNT(*) as student_count FROM public.vw_estudantes_grid;

-- Check a few sample records
SELECT * FROM public.vw_estudantes_grid LIMIT 5;