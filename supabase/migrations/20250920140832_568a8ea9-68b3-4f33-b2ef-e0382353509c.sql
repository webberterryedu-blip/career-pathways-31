-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  cargo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estudantes table
CREATE TABLE public.estudantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  nome TEXT NOT NULL,
  genero TEXT CHECK (genero IN ('masculino', 'feminino')),
  cargo TEXT,
  ativo BOOLEAN DEFAULT true,
  menor BOOLEAN DEFAULT false,
  familia_id TEXT,
  qualificacoes JSONB DEFAULT '{}',
  ultima_designacao TEXT,
  contador_designacoes INTEGER DEFAULT 0,
  data_nascimento DATE,
  responsavel_primario TEXT,
  responsavel_secundario TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create programas_ministeriais table
CREATE TABLE public.programas_ministeriais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  mes_ano TEXT NOT NULL,
  arquivo_nome TEXT,
  arquivo_url TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create designacoes table
CREATE TABLE public.designacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  estudante_id UUID REFERENCES public.estudantes(id) ON DELETE CASCADE,
  ajudante_id UUID REFERENCES public.estudantes(id) ON DELETE SET NULL,
  parte_id UUID,
  programa_id UUID REFERENCES public.programas_ministeriais(id) ON DELETE CASCADE,
  titulo_parte TEXT,
  tempo_minutos INTEGER,
  cena TEXT,
  status TEXT DEFAULT 'designado',
  data_designacao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programas_ministeriais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designacoes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for estudantes
CREATE POLICY "Users can view their own students" ON public.estudantes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own students" ON public.estudantes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students" ON public.estudantes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students" ON public.estudantes
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for programas_ministeriais
CREATE POLICY "Users can view their own programs" ON public.programas_ministeriais
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own programs" ON public.programas_ministeriais
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs" ON public.programas_ministeriais
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs" ON public.programas_ministeriais
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for designacoes
CREATE POLICY "Users can view their own assignments" ON public.designacoes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assignments" ON public.designacoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments" ON public.designacoes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments" ON public.designacoes
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estudantes_updated_at
  BEFORE UPDATE ON public.estudantes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_programas_updated_at
  BEFORE UPDATE ON public.programas_ministeriais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_designacoes_updated_at
  BEFORE UPDATE ON public.designacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();