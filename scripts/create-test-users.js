import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dlvojolvdsqrfczjjjuw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing Supabase URL in environment variables');
  console.error('Please set VITE_SUPABASE_URL or SUPABASE_URL');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('Missing Supabase Service Role Key in environment variables');
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY in your backend/.env file');
  console.error('You can find this key in your Supabase project settings under Project Settings > API');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUsers() {
  console.log('Creating test users...');
  
  // Create instructor user
  const instructorEmail = 'frankwebber33@hotmail.com';
  const instructorPassword = '13a21r15';
  
  const { data: instructorData, error: instructorError } = await supabase.auth.signUp({
    email: instructorEmail,
    password: instructorPassword,
    options: {
      data: {
        nome: 'Frank Webber',
        role: 'instrutor'
      }
    }
  });
  
  if (instructorError) {
    console.error('Error creating instructor user:', instructorError.message);
  } else {
    console.log('Instructor user created successfully:', instructorData.user?.id);
  }
  
  // Create student user
  const studentEmail = 'franklinmarceloferreiradelima@gmail.com';
  const studentPassword = '13a21r15';
  
  const { data: studentData, error: studentError } = await supabase.auth.signUp({
    email: studentEmail,
    password: studentPassword,
    options: {
      data: {
        nome: 'Franklin Marcelo',
        role: 'estudante'
      }
    }
  });
  
  if (studentError) {
    console.error('Error creating student user:', studentError.message);
  } else {
    console.log('Student user created successfully:', studentData.user?.id);
  }
  
  console.log('Test users creation process completed.');
}

createTestUsers();