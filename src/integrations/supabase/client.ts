import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Define a type for import.meta.env to avoid TypeScript errors
interface ImportMetaEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  DEV?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Unified Supabase client for the frontend
// Reads configuration from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Debug environment variables
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase ANON Key exists:', !!supabaseAnonKey);
  console.log('Supabase ANON Key length:', supabaseAnonKey?.length || 0);
}

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

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