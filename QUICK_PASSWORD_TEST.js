// Quick Password Test Script
// Run this to test common passwords for frankwebber33@hotmail.com

const testPasswords = [
  'Test1234!',
  'password',
  'Password123',
  'frankwebber',
  'frankwebber33',
  'Test123',
  '123456',
  'admin123',
  'Ministerial123',
  'Sistema123'
];

console.log('Testing common passwords for frankwebber33@hotmail.com...\n');

async function testPassword(password) {
  try {
    // Simulate the fetch request that's failing
    const response = await fetch('https://jbapewpuvfijrkhlbsid.supabase.co/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg'
      },
      body: JSON.stringify({
        email: 'frankwebber33@hotmail.com',
        password: password
      })
    });
    
    if (response.ok) {
      console.log(`✅ SUCCESS! Password is: ${password}`);
      return true;
    } else {
      const errorData = await response.json();
      console.log(`❌ Failed with "${password}": ${errorData.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error testing "${password}": ${error.message}`);
    return false;
  }
}

async function testAllPasswords() {
  for (const password of testPasswords) {
    const success = await testPassword(password);
    if (success) {
      console.log('\n🎉 FOUND WORKING PASSWORD!');
      console.log('Use this password to log in to your application.');
      return;
    }
  }
  
  console.log('\n❌ None of the common passwords worked.');
  console.log('You need to reset your password in the Supabase dashboard:');
  console.log('1. Go to https://app.supabase.com/project/jbapewpuvfijrkhlbsid');
  console.log('2. Authentication > Users');
  console.log('3. Find frankwebber33@hotmail.com');
  console.log('4. Click three dots > Reset Password');
  console.log('5. Set a new password and use it to log in');
}

// Run the tests
testAllPasswords();