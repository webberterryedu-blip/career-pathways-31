-- =====================================================
-- FIX DATABASE SCHEMA ISSUES
-- =====================================================

-- First, let's check the current state of the profiles table
\d public.profiles;

-- Check the current state of the estudantes table
\d public.estudantes;

-- If the profiles table doesn't exist or is missing the user_id column, create/fix it
DO $$
BEGIN
  -- Check if profiles table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    CREATE TABLE public.profiles (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID UNIQUE REFERENCES auth.users ON DELETE CASCADE,
      nome TEXT,
      email TEXT,
      role TEXT,
      cargo TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
  ELSE
    -- Check if user_id column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
      ALTER TABLE public.profiles ADD COLUMN user_id UUID UNIQUE REFERENCES auth.users ON DELETE CASCADE;
    END IF;
    
    -- Check if role column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
      ALTER TABLE public.profiles ADD COLUMN role TEXT;
    END IF;
  END IF;
END $$;

-- Fix the estudantes table to ensure it has the correct relationship with profiles
DO $$
BEGIN
  -- Check if estudantes table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'estudantes') THEN
    -- Check if profile_id column exists (from older schema)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estudantes' AND column_name = 'profile_id') THEN
      -- Add user_id column if it doesn't exist
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estudantes' AND column_name = 'user_id') THEN
        ALTER TABLE public.estudantes ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;
      END IF;
    ELSE
      -- If profile_id doesn't exist, ensure user_id exists
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estudantes' AND column_name = 'user_id') THEN
        ALTER TABLE public.estudantes ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;
      END IF;
    END IF;
  END IF;
END $$;

-- Create or update the handle_new_user function to work with the current schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security if not already enabled
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.estudantes ENABLE ROW LEVEL SECURITY;

-- Create or update RLS policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create or update RLS policies for estudantes
DROP POLICY IF EXISTS "Users can view their own students" ON public.estudantes;
CREATE POLICY "Users can view their own students" ON public.estudantes
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('instrutor', 'admin'))
  );

DROP POLICY IF EXISTS "Instructors can manage students" ON public.estudantes;
CREATE POLICY "Instructors can manage students" ON public.estudantes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('instrutor', 'admin'))
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_estudantes_user_id ON public.estudantes(user_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Test the fix by checking the structure
\d public.profiles;
\d public.estudantes;