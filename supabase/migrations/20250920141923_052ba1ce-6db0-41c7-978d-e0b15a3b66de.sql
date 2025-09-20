-- Create missing tables and fix type issues

-- Create programas table (missing from current schema)
CREATE TABLE IF NOT EXISTS public.programas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  nome text NOT NULL,
  descricao text,
  tipo text DEFAULT 'reuniao_meio_semana',
  ativo boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create family_members table for family relationships
CREATE TABLE IF NOT EXISTS public.family_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  student_id uuid,
  family_id text,
  relationship_type text,
  name text NOT NULL,
  email text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create invitations_log table for tracking invitations
CREATE TABLE IF NOT EXISTS public.invitations_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  student_id uuid,
  family_member_id uuid,
  invitation_type text NOT NULL,
  status text DEFAULT 'pending',
  sent_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone,
  response_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add missing columns to partes_programa table
ALTER TABLE public.partes_programa 
ADD COLUMN IF NOT EXISTS tipo_designacao text,
ADD COLUMN IF NOT EXISTS genero_requerido text;

-- Enable RLS on new tables
ALTER TABLE public.programas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for programas
CREATE POLICY "Users can view their own programs" 
ON public.programas FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own programs" 
ON public.programas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs" 
ON public.programas FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs" 
ON public.programas FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for family_members
CREATE POLICY "Users can view their own family members" 
ON public.family_members FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own family members" 
ON public.family_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members" 
ON public.family_members FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members" 
ON public.family_members FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for invitations_log
CREATE POLICY "Users can view their own invitations" 
ON public.invitations_log FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invitations" 
ON public.invitations_log FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invitations" 
ON public.invitations_log FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invitations" 
ON public.invitations_log FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_programas_updated_at
  BEFORE UPDATE ON public.programas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invitations_log_updated_at
  BEFORE UPDATE ON public.invitations_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();