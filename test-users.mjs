import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the app
const supabaseUrl = 'https://jbapewpuvfijrkhlbsid.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  // Try to get the current user (should be null if not logged in)
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.log('Auth error:', error.message);
  } else {
    console.log('Current user:', user);
  }
  
  // Try to list users (this might fail due to permissions)
  try {
    const { data, error: listError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
      
    if (listError) {
      console.log('Error listing profiles:', listError.message);
    } else {
      console.log('Profiles found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Sample profile:', data[0]);
      }
    }
  } catch (e) {
    console.log('Error accessing profiles table:', e.message);
  }
}

testConnection().catch(console.error);