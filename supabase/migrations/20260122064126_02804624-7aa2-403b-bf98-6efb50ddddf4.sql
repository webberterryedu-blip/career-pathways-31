
-- Add missing columns to assignment_history table for S-38 algorithm
ALTER TABLE public.assignment_history 
ADD COLUMN IF NOT EXISTS selection_reason text,
ADD COLUMN IF NOT EXISTS alternatives_considered integer DEFAULT 0;
