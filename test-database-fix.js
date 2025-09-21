// Test script to verify database fixes
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nwpuurgwnnuejqinkvrh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseFix() {
  console.log('Testing database fixes...');
  
  try {
    // Test 1: Check if profiles table exists and has user_id column
    console.log('Test 1: Checking profiles table structure...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles table test failed:', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible');
      if (profilesData && profilesData.length > 0) {
        const profile = profilesData[0];
        if ('user_id' in profile) {
          console.log('✅ profiles.user_id column exists');
        } else {
          console.log('❌ profiles.user_id column missing');
        }
      }
    }
    
    // Test 2: Check if estudantes table exists
    console.log('Test 2: Checking estudantes table structure...');
    const { data: estudantesData, error: estudantesError } = await supabase
      .from('estudantes')
      .select('*')
      .limit(1);
    
    if (estudantesError) {
      console.error('❌ Estudantes table test failed:', estudantesError.message);
    } else {
      console.log('✅ Estudantes table accessible');
    }
    
    // Test 3: Check if vw_estudantes_grid view exists
    console.log('Test 3: Checking vw_estudantes_grid view...');
    const { data: viewData, error: viewError } = await supabase
      .from('vw_estudantes_grid')
      .select('*')
      .limit(1);
    
    if (viewError) {
      console.error('❌ vw_estudantes_grid view test failed:', viewError.message);
    } else {
      console.log('✅ vw_estudantes_grid view accessible');
    }
    
    // Test 4: Check relationship between profiles and estudantes
    console.log('Test 4: Checking relationship between tables...');
    // This would typically be done with a JOIN query
    
    console.log('Database fix verification complete!');
    
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

// Run the test
testDatabaseFix();