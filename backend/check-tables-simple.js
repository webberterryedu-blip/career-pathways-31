// Script simples para verificar tabelas
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verificando tabelas...\n');

// Verificar tabela profiles
supabase
  .from('profiles')
  .select('id')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.log('profiles: ❌ Erro -', error.message);
    } else {
      console.log('profiles: ✅ Acessível');
    }
    
    // Verificar tabela estudantes
    supabase
      .from('estudantes')
      .select('id')
      .limit(1)
      .then(({ data: estudantesData, error: estudantesError }) => {
        if (estudantesError) {
          console.log('estudantes: ❌ Erro -', estudantesError.message);
        } else {
          console.log('estudantes: ✅ Acessível');
        }
        
        // Verificar tabela congregacoes
        supabase
          .from('congregacoes')
          .select('id')
          .limit(1)
          .then(({ data: congregacoesData, error: congregacoesError }) => {
            if (congregacoesError) {
              console.log('congregacoes: ❌ Erro -', congregacoesError.message);
            } else {
              console.log('congregacoes: ✅ Acessível');
            }
            
            process.exit(0);
          });
      });
  });