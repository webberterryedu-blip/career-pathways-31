-- Create test users in auth.users table (using Supabase Auth)
-- Note: In production, users would sign up through the application
-- This is for testing purposes only

-- First create the instructor profile manually since the user needs to exist in auth.users first
-- We'll insert profile data that will be linked when users actually sign up

-- Create instructor profile for frankwebber33@hotmail.com
INSERT INTO public.profiles (id, user_id, nome, email, role, cargo, congregacao) 
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',  -- Sample UUID for instructor
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',  -- Same as id for consistency
  'Mauro Frank Lima de Lima',
  'frankwebber33@hotmail.com',
  'instrutor'::app_role,
  'conselheiro_assistente',
  'Congregação Central'
) ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  cargo = EXCLUDED.cargo,
  congregacao = EXCLUDED.congregacao;

-- Create student profile for franklinmarceloferreiradelima@gmail.com  
INSERT INTO public.profiles (id, user_id, nome, email, role, cargo, congregacao)
VALUES (
  'a47ac10b-58cc-4372-a567-0e02b2c3d480',  -- Sample UUID for student
  'a47ac10b-58cc-4372-a567-0e02b2c3d480',  -- Same as id for consistency
  'Franklin Marcelo Ferreira de Lima',
  'franklinmarceloferreiradelima@gmail.com', 
  'instrutor'::app_role,  -- Note: Setting as 'instrutor' since 'estudante' role doesn't exist in enum
  'publicador_nao_batizado',
  'Congregação Central'
) ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  cargo = EXCLUDED.cargo,
  congregacao = EXCLUDED.congregacao;

-- Update the handle_new_user function to use the correct column names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, nome, email, role)
  VALUES (
    new.id,
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    'instrutor'::app_role
  ) ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    updated_at = now();
  RETURN new;
END;
$$;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;