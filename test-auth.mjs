// Test Supabase authentication
import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the app
const supabaseUrl = 'https://jbapewpuvfijrkhlbsid.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('Testing Supabase authentication...');
  
  // Try to sign up a test user with a more realistic email
  const { data, error } = await supabase.auth.signUp({
    email: 'test.user@organization.com',
    password: 'testpassword123',
    options: {
      data: {
        nome: 'Test User',
        role: 'instrutor'
      }
    }
  });
  
  if (error) {
    console.log('Sign up error:', error.message);
    console.log('Error details:', error);
  } else {
    console.log('Sign up successful!');
    console.log('User data:', data);
  }
}

testAuth().catch(console.error);