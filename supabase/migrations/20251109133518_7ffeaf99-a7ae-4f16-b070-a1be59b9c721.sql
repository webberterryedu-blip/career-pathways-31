-- Add new privilegio enum values for all cargo types
ALTER TYPE public.privilegio ADD VALUE IF NOT EXISTS 'pioneiro_regular';
ALTER TYPE public.privilegio ADD VALUE IF NOT EXISTS 'publicador_batizado';
ALTER TYPE public.privilegio ADD VALUE IF NOT EXISTS 'publicador_nao_batizado';
ALTER TYPE public.privilegio ADD VALUE IF NOT EXISTS 'estudante_novo';