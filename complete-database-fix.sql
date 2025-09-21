-- =====================================================
-- COMPLETE DATABASE FIX FOR MINISTRY SYSTEM
-- =====================================================

-- 1. CREATE/FIX PROFILES TABLE
DO $$
BEGIN
  -- Check if profiles table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    CREATE TABLE public.profiles (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID UNIQUE REFERENCES auth.users ON DELETE CASCADE,
      nome TEXT,
      email TEXT,
      role TEXT DEFAULT 'estudante',
      cargo TEXT,
      congregacao TEXT,
      telefone TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE 'Created profiles table';
  ELSE
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
      ALTER TABLE public.profiles ADD COLUMN user_id UUID UNIQUE REFERENCES auth.users ON DELETE CASCADE;
      RAISE NOTICE 'Added user_id column to profiles';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
      ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'estudante';
      RAISE NOTICE 'Added role column to profiles';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'cargo') THEN
      ALTER TABLE public.profiles ADD COLUMN cargo TEXT;
      RAISE NOTICE 'Added cargo column to profiles';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'congregacao') THEN
      ALTER TABLE public.profiles ADD COLUMN congregacao TEXT;
      RAISE NOTICE 'Added congregacao column to profiles';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'telefone') THEN
      ALTER TABLE public.profiles ADD COLUMN telefone TEXT;
      RAISE NOTICE 'Added telefone column to profiles';
    END IF;
  END IF;
END $$;

-- 2. CREATE/FIX ESTUDANTES TABLE
DO $$
BEGIN
  -- Check if estudantes table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'estudantes') THEN
    CREATE TABLE public.estudantes (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users ON DELETE CASCADE,
      nome TEXT NOT NULL,
      genero TEXT CHECK (genero IN ('masculino', 'feminino')),
      qualificacoes TEXT[],
      ativo BOOLEAN DEFAULT true,
      congregacao TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE 'Created estudantes table';
  ELSE
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estudantes' AND column_name = 'profile_id') THEN
      ALTER TABLE public.estudantes ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added profile_id column to estudantes';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estudantes' AND column_name = 'user_id') THEN
      ALTER TABLE public.estudantes ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;
      RAISE NOTICE 'Added user_id column to estudantes';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estudantes' AND column_name = 'congregacao') THEN
      ALTER TABLE public.estudantes ADD COLUMN congregacao TEXT;
      RAISE NOTICE 'Added congregacao column to estudantes';
    END IF;
  END IF;
END $$;

-- 3. CREATE/FIX THE HANDLE_NEW_USER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update profile
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

-- 4. ENSURE THE TRIGGER EXISTS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.estudantes ENABLE ROW LEVEL SECURITY;

-- 6. CREATE/FIX RLS POLICIES FOR PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Instructors can view congregation profiles" ON public.profiles;
CREATE POLICY "Instructors can view congregation profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles instructor 
      WHERE instructor.user_id = auth.uid() 
      AND instructor.role IN ('instrutor', 'admin')
      AND instructor.congregacao = public.profiles.congregacao
    )
  );

-- 7. CREATE/FIX RLS POLICIES FOR ESTUDANTES
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

DROP POLICY IF EXISTS "Students can view active students" ON public.estudantes;
CREATE POLICY "Students can view active students" ON public.estudantes
  FOR SELECT USING (
    ativo = true AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'estudante')
  );

-- 8. CREATE INDEXES FOR BETTER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_congregacao ON public.profiles(congregacao);
CREATE INDEX IF NOT EXISTS idx_estudantes_user_id ON public.estudantes(user_id);
CREATE INDEX IF NOT EXISTS idx_estudantes_profile_id ON public.estudantes(profile_id);
CREATE INDEX IF NOT EXISTS idx_estudantes_congregacao ON public.estudantes(congregacao);

-- 9. CREATE HELPER FUNCTION TO GET USER ROLE
CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(role, 'estudante') FROM public.profiles WHERE user_id = uid LIMIT 1;
$$;

-- 10. REFRESH THE SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- 11. INSERT TEST DATA IF NEEDED
DO $$
BEGIN
  -- Insert sample profiles if none exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'frankwebber33@hotmail.com') THEN
    INSERT INTO public.profiles (user_id, nome, email, role, cargo, congregacao)
    VALUES (gen_random_uuid(), 'Mauro Frank Lima de Lima', 'frankwebber33@hotmail.com', 'instrutor', 'conselheiro_assistente', 'Congregação Central');
    RAISE NOTICE 'Inserted sample instructor profile';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'franklinmarceloferreiradelima@gmail.com') THEN
    INSERT INTO public.profiles (user_id, nome, email, role, cargo, congregacao)
    VALUES (gen_random_uuid(), 'Franklin Marcelo Ferreira de Lima', 'franklinmarceloferreiradelima@gmail.com', 'instrutor', 'publicador_nao_batizado', 'Congregação Central');
    RAISE NOTICE 'Inserted sample student profile';
  END IF;
END $$;

-- 12. VERIFY THE FIX
SELECT 'Database schema fix applied successfully' as message;
SELECT table_name, column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'estudantes')
ORDER BY table_name, ordinal_position;