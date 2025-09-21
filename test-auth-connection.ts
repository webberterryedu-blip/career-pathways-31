import { supabase } from './src/integrations/supabase/client';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection by getting session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Connection error:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    console.log('   Current session:', data.session ? 'Active' : 'None');
    
    // Test database access
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Database access error:', profilesError.message);
    } else {
      console.log('✅ Database access successful');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Connection exception:', error);
    return false;
  }
}

// Run the test
testSupabaseConnection().then(success => {
  if (success) {
    console.log('\n🎉 All tests passed! Supabase is properly configured.');
  } else {
    console.log('\n💥 Some tests failed. Please check the errors above.');
  }
});