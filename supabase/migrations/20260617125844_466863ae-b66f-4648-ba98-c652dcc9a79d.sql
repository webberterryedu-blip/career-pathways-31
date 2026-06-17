ALTER TABLE public.designacoes RENAME COLUMN assistente_id TO ajudante_id;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS cargo text;

ALTER TABLE public.estudantes
  ADD CONSTRAINT estudantes_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;