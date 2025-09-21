// Script para verificar a tabela de perfis
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verificando tabela de perfis...\n');

// Verificar se há perfis existentes
supabase
  .from('profiles')
  .select('id, user_id, nome')
  .limit(5)
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Erro ao acessar a tabela profiles:', error.message);
    } else {
      console.log('✅ Tabela profiles acessível');
      if (data && data.length > 0) {
        console.log(' Perfis existentes:');
        console.table(data);
      } else {
        console.log(' Nenhum perfil encontrado');
      }
    }
    
    // Verificar estrutura da tabela estudantes
    console.log('\n🔍 Verificando tabela de estudantes...');
    supabase
      .from('estudantes')
      .select('id, profile_id, genero, qualificacoes, ativo')
      .limit(1)
      .then(({ data: estudantesData, error: estudantesError }) => {
        if (estudantesError) {
          console.log('❌ Erro ao acessar a tabela estudantes:', estudantesError.message);
        } else {
          console.log('✅ Tabela estudantes acessível');
          if (estudantesData && estudantesData.length > 0) {
            console.log(' Exemplo de estudante:');
            console.log(JSON.stringify(estudantesData[0], null, 2));
          } else {
            console.log(' Nenhum estudante encontrado');
          }
        }
        process.exit(0);
      });
  });