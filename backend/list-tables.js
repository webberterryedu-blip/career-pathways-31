// Script para listar tabelas disponíveis
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Listando tabelas disponíveis...\n');

// Tentar obter a lista de tabelas
supabase
  .rpc('execute_sql', { 
    sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 
  })
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Erro ao obter lista de tabelas:', error.message);
      
      // Tentar acessar tabelas conhecidas diretamente
      console.log('\n🔍 Tentando acessar tabelas conhecidas...');
      
      const tablesToCheck = ['profiles', 'estudantes', 'congregacoes', 'users'];
      
      Promise.all(
        tablesToCheck.map(table => 
          supabase
            .from(table)
            .select('count()', { count: 'exact' })
            .then(({ count, error }) => ({ table, count, error }))
        )
      ).then(results => {
        results.forEach(({ table, count, error }) => {
          if (error) {
            console.log(` ${table}: ❌ Erro - ${error.message}`);
          } else {
            console.log(` ${table}: ✅ Acessível (${count} registros)`);
          }
        });
        process.exit(0);
      });
    } else {
      console.log('✅ Tabelas encontradas:');
      console.table(data);
      process.exit(0);
    }
  });