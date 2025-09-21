import { createClient } from '@supabase/supabase-js';

// Use the same configuration as your app
const supabaseUrl = 'https://jbapewpuvfijrkhlbsid.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  console.log('🔧 Creating test user...\n');
  
  const testEmail = 'developer@example.com';
  const testPassword = 'Developer123!';
  
  console.log('Creating user with credentials:');
  console.log('  Email:', testEmail);
  console.log('  Password:', testPassword);
  console.log('  (You can change these after testing)\n');
  
  // Sign up the user
  console.log('1. Signing up user...');
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        nome: 'Test Developer',
        role: 'instrutor'
      }
    }
  });
  
  if (error) {
    console.log('   ❌ Signup error:', error.message);
    if (error.message.includes('email_address_invalid')) {
      console.log('   💡 Try with a different email domain');
    } else if (error.message.includes('User already registered')) {
      console.log('   ℹ️  User already exists. Try logging in or use a different email.');
    }
    return;
  }
  
  console.log('   ✅ Signup successful!');
  console.log('   User ID:', data.user?.id);
  console.log('   Confirmation sent:', !!data.user?.confirmation_sent_at);
  
  console.log('\n📝 NEXT STEPS:');
  console.log('1. Check your email for a confirmation message');
  console.log('2. Click the confirmation link in the email');
  console.log('3. After confirming, you can log in with these credentials:');
  console.log('   Email:', testEmail);
  console.log('   Password:', testPassword);
  
  console.log('\n⚠️  IMPORTANT:');
  console.log('   - The email might be in your spam/junk folder');
  console.log('   - If you cannot receive the email, you can manually confirm the user in the Supabase dashboard');
  console.log('   - For development, you can disable email confirmation in Supabase settings');
}

createTestUser().catch(console.error);