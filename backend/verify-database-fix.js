// Script to verify that the database fixes have been applied correctly
import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verifying database fixes...');
console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('SUPABASE_URL exists:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  try {
    console.log('\n1. Checking if estudantes table exists...');
    const { count: estudantesCount, error: estudantesError } = await supabase
      .from('estudantes')
      .select('*', { count: 'exact', head: true });

    if (estudantesError) {
      console.error('❌ Error accessing estudantes table:', estudantesError.message);
    } else {
      console.log(`✅ Estudantes table exists with ${estudantesCount} records`);
    }

    console.log('\n2. Checking if profiles table exists...');
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (profilesError) {
      console.error('❌ Error accessing profiles table:', profilesError.message);
    } else {
      console.log(`✅ Profiles table exists with ${profilesCount} records`);
    }

    console.log('\n3. Checking if vw_estudantes_grid view exists...');
    const { count: viewCount, error: viewError } = await supabase
      .from('vw_estudantes_grid')
      .select('*', { count: 'exact', head: true });

    if (viewError) {
      console.error('❌ Error accessing vw_estudantes_grid view:', viewError.message);
      console.log('💡 This is the issue that needs to be fixed!');
    } else {
      console.log(`✅ vw_estudantes_grid view exists with ${viewCount} records`);
    }

    console.log('\n4. Testing direct query to estudantes table...');
    const { data: estudantesData, error: directError } = await supabase
      .from('estudantes')
      .select(`
        *,
        profiles!left (id, nome, email, telefone, cargo, role)
      `)
      .limit(3);

    if (directError) {
      console.error('❌ Error querying estudantes table:', directError.message);
    } else {
      console.log(`✅ Direct query successful, got ${estudantesData.length} sample records`);
      console.log('Sample data:', JSON.stringify(estudantesData[0], null, 2));
    }

    console.log('\n📋 Verification complete!');
    
    if (viewError) {
      console.log('\n🔧 TO FIX THE ISSUE:');
      console.log('   1. Go to your Supabase dashboard SQL Editor');
      console.log('   2. Run the CREATE VIEW command from FIX_DATABASE_ISSUE.md');
      console.log('   3. Run: NOTIFY pgrst, \'reload schema\';');
      console.log('   4. Restart your development server');
    } else {
      console.log('\n🎉 Database is properly configured!');
    }

  } catch (error) {
    console.error('❌ Unexpected error during verification:', error.message);
    process.exit(1);
  }
}

verifyDatabase();