// Script to apply the vw_estudantes_grid view fix directly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('SUPABASE_URL exists:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyViewFix() {
  console.log('🔧 Applying vw_estudantes_grid view fix...');
  
  try {
    // Drop the incorrect view
    console.log('1. Dropping existing view...');
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql: 'DROP VIEW IF EXISTS public.vw_estudantes_grid;'
    });
    
    if (dropError) {
      console.log('   ⚠️  Warning when dropping view:', dropError.message);
    } else {
      console.log('   ✅ View dropped successfully');
    }
    
    // Create the correct view
    console.log('2. Creating correct view...');
    const viewSql = `
      CREATE OR REPLACE VIEW public.vw_estudantes_grid AS
      SELECT 
        e.id,
        e.nome,
        e.genero,
        e.qualificacoes,
        e.ativo,
        e.congregacao_id as congregacao,
        e.user_id,
        e.profile_id,
        p.email,
        p.cargo,
        p.role,
        e.created_at,
        e.updated_at
      FROM public.estudantes e
      LEFT JOIN public.profiles p ON p.id = e.profile_id OR p.user_id = e.user_id;
    `;
    
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql: viewSql
    });
    
    if (createError) {
      console.log('   ⚠️  Warning when creating view:', createError.message);
    } else {
      console.log('   ✅ View created successfully');
    }
    
    // Refresh schema cache
    console.log('3. Refreshing schema cache...');
    const { error: refreshError } = await supabase.rpc('execute_sql', {
      sql: "NOTIFY pgrst, 'reload schema';"
    });
    
    if (refreshError) {
      console.log('   ⚠️  Warning when refreshing schema:', refreshError.message);
    } else {
      console.log('   ✅ Schema cache refreshed');
    }
    
    // Verify the view was created
    console.log('4. Verifying view...');
    const { count: viewCount, error: verifyError } = await supabase
      .from('vw_estudantes_grid')
      .select('*', { count: 'exact', head: true });
    
    if (verifyError) {
      console.log('   ⚠️  Warning when verifying view:', verifyError.message);
    } else {
      console.log(`   ✅ View verified with ${viewCount} records`);
    }
    
    console.log('\n🎉 View fix applied successfully!');
    console.log('🔄 Please restart your development server to see the changes.');
    
  } catch (error) {
    console.error('❌ Unexpected error applying view fix:', error.message);
    process.exit(1);
  }
}

applyViewFix();