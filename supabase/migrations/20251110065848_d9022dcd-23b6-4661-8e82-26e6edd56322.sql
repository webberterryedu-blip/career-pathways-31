-- Create missing assignment_history table for tracking
CREATE TABLE IF NOT EXISTS public.assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  assignment_type TEXT NOT NULL,
  assignment_title TEXT NOT NULL,
  student_id UUID NOT NULL REFERENCES public.estudantes(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  assistant_id UUID REFERENCES public.estudantes(id) ON DELETE SET NULL,
  assistant_name TEXT,
  assignment_duration INTEGER DEFAULT 5,
  observations TEXT,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_assignment_history_week ON public.assignment_history(week);
CREATE INDEX IF NOT EXISTS idx_assignment_history_student ON public.assignment_history(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_date ON public.assignment_history(meeting_date);

-- Enable RLS
ALTER TABLE public.assignment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view assignment history"
  ON public.assignment_history FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert assignment history"
  ON public.assignment_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update assignment history"
  ON public.assignment_history FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete assignment history"
  ON public.assignment_history FOR DELETE
  USING (true);

-- Create view for student grid with all needed fields
CREATE OR REPLACE VIEW public.vw_estudantes_grid AS
SELECT 
  e.*,
  e.privilegio as cargo,
  e.family_id as familia_id
FROM public.estudantes e;

-- Grant access to the view
GRANT SELECT ON public.vw_estudantes_grid TO authenticated, anon;