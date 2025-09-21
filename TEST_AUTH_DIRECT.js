// Test Supabase Authentication Directly
// This script tests authentication without the React app to isolate issues

import { createClient } from '@supabase/supabase-js';

// Configuration from your .env file
const SUPABASE_URL = 'https://jbapewpuvfijrkhlbsid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth() {
  console.log('🧪 Testing Supabase Authentication...\n');
  
  // Test 1: Check if we can connect to Supabase
  try {
    console.log('1. Testing connection to Supabase...');
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.log('❌ Connection test failed:', error.message);
      if (error.message.includes('406')) {
        console.log('   This is an RLS error - connection works but access is restricted');
      }
    } else {
      console.log('✅ Connection successful');
    }
  } catch (error) {
    console.log('❌ Connection test error:', error.message);
  }
  
  // Test 2: Try to sign in with your known credentials
  console.log('\n2. Testing sign in with frankwebber33@hotmail.com...');
  try {
    // Try multiple common passwords
    const testPasswords = ['Test1234!', 'password', 'Password123', 'frankwebber'];
    
    for (const password of testPasswords) {
      console.log(`   Testing password: ${password}`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'frankwebber33@hotmail.com',
        password: password,
      });
      
      if (error) {
        console.log(`   ❌ Failed with password "${password}":`, error.message);
      } else {
        console.log(`   ✅ SUCCESS! Logged in with password: ${password}`);
        console.log('   Session:', data.session?.user?.id);
        // Sign out immediately to not affect other tests
        await supabase.auth.signOut();
        break;
      }
    }
  } catch (error) {
    console.log('❌ Sign in test error:', error.message);
  }
  
  // Test 3: Try to create a new test user
  console.log('\n3. Testing user creation...');
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test-direct@system.com',
      password: 'Test1234!',
    });
    
    if (error) {
      console.log('❌ User creation failed:', error.message);
    } else {
      console.log('✅ User created successfully');
      console.log('   User ID:', data.user?.id);
      console.log('   Requires confirmation:', data.user?.email_confirmed_at ? 'No' : 'Yes');
    }
  } catch (error) {
    console.log('❌ User creation error:', error.message);
  }
  
  console.log('\n📋 SUMMARY');
  console.log('===========');
  console.log('If you see "SUCCESS!" above, you found the correct password.');
  console.log('If not, you need to reset your password in the Supabase dashboard.');
  console.log('Go to: https://app.supabase.com/project/jbapewpuvfijrkhlbsid');
  console.log('Authentication > Users > frankwebber33@hotmail.com > Reset Password');
}

// Run the test
testAuth();