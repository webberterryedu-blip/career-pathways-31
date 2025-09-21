// Direct API test for Supabase authentication
const SUPABASE_URL = 'https://jbapewpuvfijrkhlbsid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg';

async function testAuth() {
  console.log('🔐 DIRECT AUTHENTICATION TEST 🔐\n');
  
  // Test with the user you're having issues with
  const testCredentials = [
    {
      email: 'frankwebber33@hotmail.com',
      password: '13a21r15'  // Based on previous information
    },
    {
      email: 'frankwebber33@hotmail.com',
      password: 'senha123'  // Based on previous information
    }
  ];
  
  console.log('Testing known user credentials...\n');
  
  for (const creds of testCredentials) {
    console.log(`Testing: ${creds.email} with password: ${creds.password}`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: creds.email,
          password: creds.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ SUCCESS!');
        console.log('Access token:', data.access_token ? 'RECEIVED' : 'NOT RECEIVED');
        console.log('User ID:', data.user?.id || 'N/A');
        console.log('---\n');
      } else {
        console.log('❌ FAILED');
        console.log('Status:', response.status);
        console.log('Error:', data.message || data.error || 'Unknown error');
        console.log('---\n');
      }
    } catch (error) {
      console.log('❌ REQUEST ERROR');
      console.log('Error:', error.message);
      console.log('---\n');
    }
  }
  
  console.log('🔧 SOLUTIONS IF AUTH FAILS:\n');
  console.log('1. EMAIL CONFIRMATION ISSUE:');
  console.log('   - Go to Supabase Dashboard → Authentication → Settings');
  console.log('   - Turn OFF "Enable email confirmations"');
  console.log('   - Click "Save"\n');
  
  console.log('2. WRONG PASSWORD:');
  console.log('   - Go to Supabase Dashboard → Authentication → Users');
  console.log('   - Find frankwebber33@hotmail.com');
  console.log('   - Click "Reset Password"\n');
  
  console.log('3. CREATE NEW TEST USER:');
  console.log('   - Go to Supabase Dashboard → Authentication → Users');
  console.log('   - Click "New User"');
  console.log('   - Email: test@example.com');
  console.log('   - Password: Test123456!');
  console.log('   - Check "Email confirmed"');
  console.log('   - Click "Save"\n');
  
  console.log('4. TEST WITH NEW USER:');
  console.log('   - Email: test@example.com');
  console.log('   - Password: Test123456!');
}

testAuth();