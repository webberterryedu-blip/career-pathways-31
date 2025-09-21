import { createClient } from '@supabase/supabase-js';

// Use your exact Supabase configuration
const supabaseUrl = 'https://jbapewpuvfijrkhlbsid.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAndFixAuth() {
  console.log('🔍 Testing and fixing Supabase authentication...\n');
  
  // Test 1: Check if we can connect to Supabase
  console.log('1. Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.message !== 'Unsupported table or view') {
      console.log('   ❌ Connection error:', error.message);
      return;
    }
    console.log('   ✅ Supabase connection successful');
  } catch (e) {
    console.log('   ❌ Connection failed:', e.message);
    return;
  }
  
  // Test 2: Try to create a test user
  console.log('\n2. Creating test user...');
  const testEmail = 'fixtest@example.com';
  const testPassword = 'FixTest123!';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome: 'Fix Test User',
          role: 'instrutor'
        }
      }
    });
    
    if (error) {
      console.log('   ❌ Signup error:', error.message);
      if (error.message.includes('email_address_invalid')) {
        console.log('   💡 This suggests email validation rules are in place');
      }
      return;
    }
    
    console.log('   ✅ User created successfully!');
    console.log('   User ID:', data.user?.id);
    console.log('   Requires confirmation:', !data.user?.email_confirmed_at);
    
  } catch (e) {
    console.log('   ❌ Signup failed:', e.message);
    return;
  }
  
  // Test 3: Try to login with the test user (will likely fail due to confirmation)
  console.log('\n3. Testing login with new user...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (error) {
      console.log('   ❌ Login error:', error.message);
      if (error.message.includes('Email not confirmed')) {
        console.log('   ℹ️  This is expected - email confirmation is required');
      }
    } else {
      console.log('   ✅ Login successful!');
    }
  } catch (e) {
    console.log('   ❌ Login test failed:', e.message);
  }
  
  console.log('\n🔧 SOLUTIONS TO FIX YOUR AUTH ISSUE:');
  console.log('=====================================');
  console.log('1. EASIEST FIX (Development):');
  console.log('   - Go to Supabase Dashboard: https://app.supabase.com');
  console.log('   - Project: jbapewpuvfijrkhlbsid');
  console.log('   - Authentication > Settings');
  console.log('   - Turn OFF "Enable email confirmations"');
  console.log('   - Save settings');
  console.log('   - Restart your development server');
  
  console.log('\n2. ALTERNATIVE FIX:');
  console.log('   - Authentication > Users');
  console.log('   - Click "New User"');
  console.log('   - Email: fixtest@example.com');
  console.log('   - Password: FixTest123!');
  console.log('   - Check "Email confirmed"');
  console.log('   - Save and test login');
  
  console.log('\n3. UPDATE SITE URL:');
  console.log('   - Authentication > URL Configuration');
  console.log('   - Site URL: http://localhost:8080');
  console.log('   - Save changes');
  
  console.log('\nAfter applying any of these fixes, try logging in with:');
  console.log('Email: fixtest@example.com');
  console.log('Password: FixTest123!');
}

testAndFixAuth().catch(console.error);