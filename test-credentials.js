// Test Credentials Script
// This will help identify if your credentials are correct

const SUPABASE_URL = 'https://jbapewpuvfijrkhlbsid.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg';

async function testCredentials() {
  console.log('🔍 Testing credentials for frankwebber33@hotmail.com...\n');
  
  // Common passwords to test
  const passwords = [
    'Test1234!',
    'password',
    'Password123',
    'frankwebber',
    'frankwebber33',
    '123456',
    'admin123'
  ];
  
  for (const password of passwords) {
    try {
      console.log(`Testing password: ${password}`);
      
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'frankwebber33@hotmail.com',
          password: password
        })
      });
      
      if (response.ok) {
        console.log(`✅ SUCCESS! Password is: ${password}\n`);
        console.log('Use this password to log in to your application.');
        return;
      } else {
        const error = await response.json();
        console.log(`❌ Failed: ${error.message}\n`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('❌ None of the common passwords worked.');
  console.log('\n🔧 SOLUTION:');
  console.log('1. Run IMMEDIATE_PASSWORD_RESET.bat');
  console.log('2. Reset your password in the Supabase dashboard');
  console.log('3. Use the new password to log in');
}

testCredentials();