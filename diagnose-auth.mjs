import { createClient } from '@supabase/supabase-js';

// Use the same configuration as your app
const supabaseUrl = 'https://jbapewpuvfijrkhlbsid.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseAuth() {
  console.log('🔍 Diagnosing Supabase Authentication...\n');
  
  // Check current session
  console.log('1. Checking current session...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.log('   ❌ Session error:', sessionError.message);
  } else if (session) {
    console.log('   ✅ Active session found for user:', session.user.email);
  } else {
    console.log('   ℹ️  No active session');
  }
  
  // Try to get current user
  console.log('\n2. Checking current user...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.log('   ❌ User error:', userError.message);
  } else if (user) {
    console.log('   ✅ Current user:', user.email);
  } else {
    console.log('   ℹ️  No authenticated user');
  }
  
  // Check if we can access the profiles table (to verify RLS settings)
  console.log('\n3. Checking profiles table access...');
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);
      
    if (profilesError) {
      console.log('   ℹ️  Profiles access error (expected without auth):', profilesError.message);
    } else {
      console.log('   ✅ Profiles table accessible');
      if (profiles && profiles.length > 0) {
        console.log('   ℹ️  Sample profile:', profiles[0].email);
      }
    }
  } catch (e) {
    console.log('   ℹ️  Profiles check error:', e.message);
  }
  
  console.log('\n📋 Diagnostic Summary:');
  console.log('   Supabase URL:', supabaseUrl);
  console.log('   ANON Key configured:', !!supabaseAnonKey);
  console.log('   ANON Key length:', supabaseAnonKey?.length || 0);
  
  console.log('\n💡 Solutions if login fails:');
  console.log('   1. Create a new user via the signup form');
  console.log('   2. Check your email for confirmation link');
  console.log('   3. Verify credentials in Supabase Dashboard');
  console.log('   4. Temporarily disable email confirmation in Supabase settings (for dev)');
}

diagnoseAuth().catch(console.error);