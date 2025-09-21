// Script para listar estudantes
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Listando estudantes...\n');

// Listar estudantes
supabase
  .from('estudantes')
  .select('id, nome, cargo, genero, ativo')
  .order('nome')
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Erro ao listar estudantes:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ Total de estudantes encontrados: ${data.length}`);
    
    if (data.length > 0) {
      console.log('\nLista de estudantes:');
      console.table(data);
    } else {
      console.log('Nenhum estudante encontrado.');
    }
    
    process.exit(0);
  });