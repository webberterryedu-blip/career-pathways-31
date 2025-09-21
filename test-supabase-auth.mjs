import { supabase } from './src/integrations/supabase/client.js';

console.log('Testing Supabase authentication...');

// Test a simple query that requires authentication
supabase
  .from('profiles')
  .select('id')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Supabase Authentication Failed:', error.message);
      console.log('Error details:', error);
    } else {
      console.log('✅ Supabase Authentication Successful');
      console.log('Data retrieved:', data);
    }
  })
  .catch(error => {
    console.log('❌ Supabase Connection Error:', error.message);
  });