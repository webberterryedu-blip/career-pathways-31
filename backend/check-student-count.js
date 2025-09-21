// Script para verificar a contagem de estudantes
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verificando contagem de estudantes...\n');

// Verificar a contagem de estudantes
supabase
  .from('estudantes')
  .select('count()', { count: 'exact' })
  .then(({ count, error }) => {
    if (error) {
      console.log('❌ Erro ao contar estudantes:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ Total de estudantes no banco: ${count}`);
    
    // Mostrar alguns exemplos
    if (count > 0) {
      supabase
        .from('estudantes')
        .select('id, nome, cargo, genero, ativo')
        .limit(10)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.log('❌ Erro ao buscar exemplos:', error.message);
          } else {
            console.log('\nExemplos de estudantes:');
            console.table(data);
          }
          process.exit(0);
        });
    } else {
      console.log('Nenhum estudante encontrado.');
      process.exit(0);
    }
  });