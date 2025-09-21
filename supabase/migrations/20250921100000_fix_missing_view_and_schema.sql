-- =====================================================
-- FIX MISSING VIEW AND SCHEMA ISSUES
-- =====================================================

-- 1. CREATE THE MISSING vw_estudantes_grid VIEW
-- This view combines estudantes and profiles data for the application
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

-- 2. FIX PROFILES TABLE IF NEEDED
-- Ensure profiles table has all required columns
DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
    ALTER TABLE public.profiles ADD COLUMN user_id UUID UNIQUE REFERENCES auth.users ON DELETE CASCADE;
    RAISE NOTICE 'Added user_id column to profiles table';
  END IF;
  
  -- Add role column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'estudante';
    RAISE NOTICE 'Added role column to profiles table';
  END IF;
  
  -- Add congregacao column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'congregacao') THEN
    ALTER TABLE public.profiles ADD COLUMN congregacao TEXT;
    RAISE NOTICE 'Added congregacao column to profiles table';
  END IF;
  
  -- Add telefone column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'telefone') THEN
    ALTER TABLE public.profiles ADD COLUMN telefone TEXT;
    RAISE NOTICE 'Added telefone column to profiles table';
  END IF;
END $$;

-- 3. FIX ESTUDANTES TABLE IF NEEDED
-- Ensure estudantes table has all required columns
DO $$
BEGIN
  -- Add profile_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estudantes' AND column_name = 'profile_id') THEN
    ALTER TABLE public.estudantes ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added profile_id column to estudantes table';
  END IF;
  
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estudantes' AND column_name = 'user_id') THEN
    ALTER TABLE public.estudantes ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;
    RAISE NOTICE 'Added user_id column to estudantes table';
  END IF;
  
  -- Add congregacao column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estudantes' AND column_name = 'congregacao') THEN
    ALTER TABLE public.estudantes ADD COLUMN congregacao TEXT;
    RAISE NOTICE 'Added congregacao column to estudantes table';
  END IF;
END $$;

-- 4. UPDATE EXISTING DATA TO ENSURE CONSISTENCY
-- Link existing estudantes to profiles where possible
DO $$
BEGIN
  -- Update estudantes with profile_id where missing but user_id exists
  UPDATE public.estudantes e
  SET profile_id = p.id
  FROM public.profiles p
  WHERE e.profile_id IS NULL 
  AND e.user_id IS NOT NULL 
  AND p.user_id = e.user_id;
  
  RAISE NOTICE 'Updated estudantes with profile_id where possible';
  
  -- Update profiles with user_id where missing but id exists (for backward compatibility)
  UPDATE public.profiles p
  SET user_id = p.id
  WHERE p.user_id IS NULL;
  
  RAISE NOTICE 'Updated profiles with user_id where missing';
END $$;

-- 5. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- 6. VERIFY THE FIX
SELECT 'View and schema fixes applied successfully' as message;