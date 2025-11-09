-- Add missing columns to estudantes table for comprehensive student data
ALTER TABLE public.estudantes 
  ADD COLUMN IF NOT EXISTS idade integer,
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS familia text,
  ADD COLUMN IF NOT EXISTS family_id uuid,
  ADD COLUMN IF NOT EXISTS estado_civil text,
  ADD COLUMN IF NOT EXISTS papel_familiar text,
  ADD COLUMN IF NOT EXISTS id_pai uuid,
  ADD COLUMN IF NOT EXISTS id_mae uuid,
  ADD COLUMN IF NOT EXISTS id_conjuge uuid,
  ADD COLUMN IF NOT EXISTS coabitacao boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS menor boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS responsavel_primario uuid,
  ADD COLUMN IF NOT EXISTS responsavel_secundario uuid,
  ADD COLUMN IF NOT EXISTS chairman boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pray boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS treasures boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS gems boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reading boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS starting boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS following boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS making boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS explaining boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS talk boolean DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_estudantes_familia ON public.estudantes(familia);
CREATE INDEX IF NOT EXISTS idx_estudantes_family_id ON public.estudantes(family_id);
CREATE INDEX IF NOT EXISTS idx_estudantes_email ON public.estudantes(email);
CREATE INDEX IF NOT EXISTS idx_estudantes_ativo ON public.estudantes(ativo);

-- Add check constraint for idade
ALTER TABLE public.estudantes 
  ADD CONSTRAINT idade_range CHECK (idade IS NULL OR (idade > 0 AND idade <= 120));

COMMENT ON COLUMN public.estudantes.familia IS 'Family/last name grouping';
COMMENT ON COLUMN public.estudantes.family_id IS 'Family group identifier';
COMMENT ON COLUMN public.estudantes.chairman IS 'Can serve as meeting chairman';
COMMENT ON COLUMN public.estudantes.pray IS 'Can offer prayer';
COMMENT ON COLUMN public.estudantes.treasures IS 'Can present Treasures from God''s Word';
COMMENT ON COLUMN public.estudantes.gems IS 'Can present Spiritual Gems';
COMMENT ON COLUMN public.estudantes.reading IS 'Can do Bible reading';
COMMENT ON COLUMN public.estudantes.starting IS 'Can do Initial Call';
COMMENT ON COLUMN public.estudantes.following IS 'Can do Return Visit';
COMMENT ON COLUMN public.estudantes.making IS 'Can conduct Bible Study';
COMMENT ON COLUMN public.estudantes.explaining IS 'Can do Explaining Beliefs';
COMMENT ON COLUMN public.estudantes.talk IS 'Can deliver talks (men only)';