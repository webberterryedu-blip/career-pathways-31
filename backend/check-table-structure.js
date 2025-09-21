// Script para verificar a estrutura da tabela estudantes
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verificando estrutura da tabela estudantes...\n');

// Verificar a estrutura da tabela
Promise.all([
  // Obter informações da estrutura da tabela
  supabase.rpc('execute_sql', { 
    sql: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'estudantes' ORDER BY ordinal_position;"
  }),
  // Obter um exemplo de registro, se existir
  supabase.from('estudantes').select('*').limit(1)
]).then(([{ data: columns, error: columnsError }, { data: sampleData, error: sampleError }]) => {
    console.log('📋 Estrutura da tabela estudantes:');
    if (columnsError) {
      console.log('❌ Erro ao obter informações da tabela:', columnsError.message);
    } else {
      console.table(columns);
    }
    
    if (!sampleError && sampleData && sampleData.length > 0) {
      console.log('\n📝 Exemplo de registro:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log('\n📝 Nenhum registro encontrado na tabela');
    }
    process.exit(0);
  });