-- Comprehensive Database Fix Script
-- This script fixes all identified issues in the career-pathways-31 system

-- 1. First, let's check the current schema to understand what's missing
\echo '🔍 Checking current database schema...'

-- Check if designacoes table exists and its columns
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'designacoes'
ORDER BY ordinal_position;

-- Check if ajudante_id column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'designacoes' 
AND column_name = 'ajudante_id';

-- 2. Fix the designacoes table structure
\echo '🔧 Fixing designacoes table structure...'

-- Add missing ajudante_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'designacoes' 
        AND column_name = 'ajudante_id'
    ) THEN
        ALTER TABLE public.designacoes 
        ADD COLUMN ajudante_id UUID REFERENCES public.estudantes(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added ajudante_id column to designacoes table';
    ELSE
        RAISE NOTICE 'ajudante_id column already exists';
    END IF;
END $$;

-- Ensure all required columns exist
DO $$
BEGIN
    -- Add parte_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'designacoes' 
        AND column_name = 'parte_id'
    ) THEN
        ALTER TABLE public.designacoes 
        ADD COLUMN parte_id UUID;
        RAISE NOTICE 'Added parte_id column to designacoes table';
    END IF;
    
    -- Add programa_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'designacoes' 
        AND column_name = 'programa_id'
    ) THEN
        ALTER TABLE public.designacoes 
        ADD COLUMN programa_id UUID REFERENCES public.programas_ministeriais(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added programa_id column to designacoes table';
    END IF;
    
    -- Add status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'designacoes' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.designacoes 
        ADD COLUMN status TEXT DEFAULT 'designado';
        RAISE NOTICE 'Added status column to designacoes table';
    END IF;
END $$;

-- 3. Fix RLS policies for designacoes table
\echo '🛡️ Fixing RLS policies for designacoes table...'

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.designacoes;
DROP POLICY IF EXISTS "Users can create their own assignments" ON public.designacoes;
DROP POLICY IF EXISTS "Users can update their own assignments" ON public.designacoes;
DROP POLICY IF EXISTS "Users can delete their own assignments" ON public.designacoes;

-- Recreate RLS policies
CREATE POLICY "Users can view their own assignments" ON public.designacoes
  FOR SELECT USING (
    auth.uid() = user_id OR 
    estudante_id IN (SELECT id FROM public.estudantes WHERE user_id = auth.uid()) OR
    ajudante_id IN (SELECT id FROM public.estudantes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create their own assignments" ON public.designacoes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update their own assignments" ON public.designacoes
  FOR UPDATE USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete their own assignments" ON public.designacoes
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- 4. Ensure all tables have proper RLS enabled
\echo '🔒 Ensuring RLS is enabled on all tables...'

ALTER TABLE public.designacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programas_ministeriais ENABLE ROW LEVEL SECURITY;

-- 5. Create indexes for better performance
\echo '⚡ Creating indexes for better performance...'

-- Index on foreign keys
CREATE INDEX IF NOT EXISTS idx_designacoes_estudante_id ON public.designacoes(estudante_id);
CREATE INDEX IF NOT EXISTS idx_designacoes_ajudante_id ON public.designacoes(ajudante_id);
CREATE INDEX IF NOT EXISTS idx_designacoes_programa_id ON public.designacoes(programa_id);
CREATE INDEX IF NOT EXISTS idx_designacoes_user_id ON public.designacoes(user_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_designacoes_user_status ON public.designacoes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_estudantes_user_active ON public.estudantes(user_id, ativo);

-- 6. Fix any data inconsistencies
\echo '🧹 Cleaning up data inconsistencies...'

-- Set default status for existing records
UPDATE public.designacoes 
SET status = 'designado' 
WHERE status IS NULL;

-- Ensure timestamps are set
UPDATE public.designacoes 
SET created_at = NOW(), updated_at = NOW() 
WHERE created_at IS NULL;

-- 7. Verification queries
\echo '✅ Final verification...'

-- Check final schema
SELECT 'Final designacoes table structure:' as info;
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'designacoes'
ORDER BY ordinal_position;

-- Count records to ensure table is accessible
SELECT 'Total designacoes records:' as info, COUNT(*) as count FROM public.designacoes;
SELECT 'Total estudantes records:' as info, COUNT(*) as count FROM public.estudantes;

-- Test the problematic query from the error
\echo '🧪 Testing the query that was failing...';
SELECT 
    d.id,
    d.parte_id,
    d.estudante_id,
    d.ajudante_id,
    d.status,
    d.observacoes,
    d.created_at,
    d.updated_at
FROM public.designacoes d
LIMIT 1;

\echo '🎉 Database fix completed successfully!';