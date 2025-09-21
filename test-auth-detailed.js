// Test authentication with direct API call - detailed version
const SUPABASE_URL = 'https://jbapewpuvfijrkhlbsid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg';

async function testAuth() {
  console.log('Testing authentication with direct API call (detailed)...\n');
  
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
    
    // Try to get response text first to see if it's JSON
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    console.log('Response text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('Response is not JSON:', responseText);
      data = { message: responseText };
    }
    
    if (response.ok) {
      console.log('\n✅ AUTHENTICATION SUCCESSFUL!');
      console.log('Access token received:', data.access_token ? 'Yes' : 'No');
      console.log('User ID:', data.user?.id || 'N/A');
    } else {
      console.log('\n❌ AUTHENTICATION FAILED');
      console.log('Status:', response.status);
      console.log('Error message:', data.message || data.error || 'Unknown error');
      
      // Common error messages and solutions
      if (data.message) {
        if (data.message.includes('Invalid login credentials')) {
          console.log('\n🔧 SOLUTIONS:');
          console.log('1. Password is definitely incorrect');
          console.log('2. Reset the password in Supabase Dashboard:');
          console.log('   - Go to Authentication → Users');
          console.log('   - Find frankwebber33@hotmail.com');
          console.log('   - Click on the user and select "Reset Password"');
          console.log('3. Or create a new test user with known credentials');
        } else {
          console.log('\n🔧 GENERAL TROUBLESHOOTING:');
          console.log('1. Check if email confirmation is required in Supabase settings');
          console.log('2. Verify the user exists and is confirmed');
          console.log('3. Try with a new test user');
        }
      }
    }
  } catch (error) {
    console.log('❌ REQUEST FAILED');
    console.log('Error:', error.message);
  }
  
  console.log('\n--- RECOMMENDED NEXT STEPS ---');
  console.log('1. Create a new test user in Supabase Dashboard:');
  console.log('   - Go to Authentication → Users → New User');
  console.log('   - Email: test@example.com');
  console.log('   - Password: Test123456!');
  console.log('   - Check "Email confirmed"');
  console.log('   - Click "Save"');
  console.log('\n2. Try logging in with these new credentials');
  console.log('\n3. If that works, the issue is definitely with the password for frankwebber33@hotmail.com');
}

testAuth();