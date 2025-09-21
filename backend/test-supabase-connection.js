// Script para testar a conexão com o Supabase
require('dotenv').config({ path: __dirname + '/.env' });
const { createClient } = require('@supabase/supabase-js');

// Debug environment variables
console.log('🔍 DEBUG: Environment variables loaded:');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('  SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('  VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('  VITE_SUPABASE_ANON_KEY exists:', !!process.env.VITE_SUPABASE_ANON_KEY);

// Testar conexão com a anon key primeiro
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseAnonKey) {
  console.log('\n🧪 Testando conexão com ANON KEY...');
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test simple query
  supabaseAnon
    .from('estudantes')
    .select('id')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Erro com ANON KEY:', error.message);
      } else {
        console.log('✅ ANON KEY funcionando! Tabela estudantes acessível');
      }
    })
    .catch(err => {
      console.log('❌ Erro na conexão com ANON KEY:', err.message);
    });
} else {
  console.log('❌ Variáveis de ambiente para ANON KEY não encontradas');
}

// Testar conexão com a service role key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseServiceKey) {
  console.log('\n🧪 Testando conexão com SERVICE ROLE KEY...');
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  // Test simple query
  supabaseService
    .from('estudantes')
    .select('id')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Erro com SERVICE ROLE KEY:', error.message);
        console.log('💡 Dica: Verifique se a SERVICE ROLE KEY está correta no Supabase Dashboard');
        console.log('   URL: https://app.supabase.com/project/jbapewpuvfijrkhlbsid/settings/api');
        console.log('   Instruções detalhadas: Veja SUPABASE_SETUP_INSTRUCTIONS.md');
      } else {
        console.log('✅ SERVICE ROLE KEY funcionando! Tabela estudantes acessível');
      }
    })
    .catch(err => {
      console.log('❌ Erro na conexão com SERVICE ROLE KEY:', err.message);
    });
} else {
  console.log('❌ Variáveis de ambiente para SERVICE ROLE KEY não encontradas');
}