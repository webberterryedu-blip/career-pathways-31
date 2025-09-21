// Test Supabase login
import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the app
const supabaseUrl = 'https://jbapewpuvfijrkhlbsid.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('Testing Supabase login...');
  
  // Try to log in with the test user
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test.user@organization.com',
    password: 'testpassword123'
  });
  
  if (error) {
    console.log('Login error:', error.message);
    console.log('Error details:', error);
  } else {
    console.log('Login successful!');
    console.log('Session data:', data);
  }
}

testLogin().catch(console.error);