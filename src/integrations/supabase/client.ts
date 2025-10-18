import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase configuration - hardcoded for Lovable deployment
const supabaseUrl = 'https://jbapewpuvfijrkhlbsid.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'career-pathways-app',
    },
    // Removed custom fetch implementation that was overriding headers
  },
});

// Export for both ES modules and CommonJS
export { supabase };
export default supabase;
