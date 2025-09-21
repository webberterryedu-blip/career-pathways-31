// Test if environment variables are properly loaded
console.log('Testing environment variables...');

// Try to access Vite environment variables
console.log('import.meta.env.VITE_SUPABASE_URL:', import.meta.env?.VITE_SUPABASE_URL);
console.log('import.meta.env.VITE_SUPABASE_ANON_KEY:', import.meta.env?.VITE_SUPABASE_ANON_KEY ? '[HIDDEN]' : 'undefined');

// Try to access process.env variables
console.log('process.env.VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('process.env.VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '[HIDDEN]' : 'undefined');