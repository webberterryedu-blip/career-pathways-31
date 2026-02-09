-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add unique constraint for upsert if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'programas_oficiais_semana_inicio_idioma_key'
  ) THEN
    ALTER TABLE public.programas_oficiais 
    ADD CONSTRAINT programas_oficiais_semana_inicio_idioma_key 
    UNIQUE (semana_inicio, idioma);
  END IF;
END $$;

-- Schedule weekly sync every Monday at 6:00 AM UTC
SELECT cron.schedule(
  'sync-jworg-programs-weekly',
  '0 6 * * 1',  -- Every Monday at 6:00 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://dbcsygvthzkdujeugzca.supabase.co/functions/v1/fetch-jworg-programs',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiY3N5Z3Z0aHprZHVqZXVnemNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NzAwOTUsImV4cCI6MjA3ODE0NjA5NX0.cDORDUihudFD2xy1IIny4IEQ-nyH0vKTYLmMRJoIhP0"}'::jsonb,
    body := '{"idioma": "pt", "weeks_ahead": 4, "weeks_behind": 1}'::jsonb
  ) AS request_id;
  $$
);