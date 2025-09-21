// Test authentication with direct API call
const SUPABASE_URL = 'https://jbapewpuvfijrkhlbsid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg';

async function testAuth() {
  console.log('Testing authentication with direct API call...\n');
  
  // Test credentials
  const email = 'frankwebber33@hotmail.com';
  const password = 'senha123'; // The password you mentioned
  
  console.log(`Testing with:
  Email: ${email}
  Password: ${password}
  URL: ${SUPABASE_URL}
  \n`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ AUTHENTICATION SUCCESSFUL!');
      console.log('Access token received:', data.access_token ? 'Yes' : 'No');
      console.log('User ID:', data.user?.id || 'N/A');
    } else {
      console.log('❌ AUTHENTICATION FAILED');
      console.log('Status:', response.status);
      console.log('Error:', data.message || data.error || 'Unknown error');
      
      // Common error messages and solutions
      if (data.message && data.message.includes('Invalid login credentials')) {
        console.log('\n🔧 SOLUTIONS:');
        console.log('1. Password might be incorrect');
        console.log('2. Try resetting the password in Supabase Dashboard');
        console.log('3. Create a new test user with known credentials');
      }
    }
  } catch (error) {
    console.log('❌ REQUEST FAILED');
    console.log('Error:', error.message);
  }
  
  console.log('\n--- ALTERNATIVE TEST CREDENTIALS ---');
  console.log('Try creating a new user in Supabase Dashboard:');
  console.log('Email: test@example.com');
  console.log('Password: Test123456!');
  console.log('Make sure to check "Email confirmed"');
}

testAuth();