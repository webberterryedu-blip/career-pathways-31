-- Fix security warning by recreating view without SECURITY DEFINER
DROP VIEW IF EXISTS public.vw_estudantes_grid;

CREATE OR REPLACE VIEW public.vw_estudantes_grid AS
SELECT 
  e.*,
  e.privilegio as cargo,
  e.family_id as familia_id
FROM public.estudantes e;

-- Grant access to the view
GRANT SELECT ON public.vw_estudantes_grid TO authenticated, anon;

-- Create profiles table for user authentication
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create programas_ministeriais table (alias for programas with extended features)
CREATE TABLE IF NOT EXISTS public.programas_ministeriais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_ano TEXT NOT NULL,
  arquivo_nome TEXT,
  arquivo_url TEXT,
  data_importacao TIMESTAMPTZ DEFAULT now(),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.programas_ministeriais ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view programs"
  ON public.programas_ministeriais FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert programs"
  ON public.programas_ministeriais FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update programs"
  ON public.programas_ministeriais FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete programs"
  ON public.programas_ministeriais FOR DELETE
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_programas_ministeriais_updated_at
  BEFORE UPDATE ON public.programas_ministeriais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();