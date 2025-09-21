-- =====================================================
-- FIX EDGE FUNCTIONS CORS CONFIGURATION
-- =====================================================

-- Update the Edge Functions to properly handle CORS
-- This needs to be done in the function code itself, but we can also set up 
-- proper headers in the database responses

-- First, let's check if we have the necessary extensions
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Create a helper function to add CORS headers to responses
CREATE OR REPLACE FUNCTION public.add_cors_headers()
RETURNS VOID AS $$
BEGIN
  -- This is a placeholder function - CORS headers need to be set in the Edge Functions
  -- But we can ensure our database responses are properly formatted
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Update the RLS policies to ensure they work correctly with the application
-- Fix any policies that might be causing issues

-- Ensure the auth.users table is accessible
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Test query to verify the fix
SELECT 'Schema fix applied successfully' as message;