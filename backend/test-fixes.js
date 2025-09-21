// Script para testar se as correções funcionaram
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testando correções do banco de dados...\n');

async function testFixes() {
  try {
    // 1. Testar acesso à view vw_estudantes_grid
    console.log('1. Testando acesso à view vw_estudantes_grid...');
    const { data: viewData, error: viewError } = await supabase
      .from('vw_estudantes_grid')
      .select('id, nome, genero, ativo')
      .limit(3);
    
    if (viewError) {
      console.log('   ❌ Erro ao acessar vw_estudantes_grid:', viewError.message);
      console.log('   💡 A view ainda não foi criada. Siga as instruções em FIX_DATABASE_STRUCTURE.sql');
    } else {
      console.log('   ✅ View vw_estudantes_grid acessível!');
      console.log('   Exemplos de dados:');
      viewData.forEach(row => {
        console.log(`     - ${row.nome} (${row.genero}) - ${row.ativo ? 'Ativo' : 'Inativo'}`);
      });
    }
    
    // 2. Testar acesso à tabela congregacoes
    console.log('\n2. Testando acesso à tabela congregacoes...');
    const { data: congregacoesData, error: congregacoesError } = await supabase
      .from('congregacoes')
      .select('id, nome, cidade')
      .limit(3);
    
    if (congregacoesError) {
      console.log('   ❌ Erro ao acessar congregacoes:', congregacoesError.message);
      console.log('   💡 A tabela ainda não foi criada. Siga as instruções em FIX_DATABASE_STRUCTURE.sql');
    } else {
      console.log('   ✅ Tabela congregacoes acessível!');
      console.log('   Congregações cadastradas:');
      congregacoesData.forEach(congregacao => {
        console.log(`     - ${congregacao.nome} (${congregacao.cidade})`);
      });
    }
    
    // 3. Testar acesso normal aos estudantes
    console.log('\n3. Testando acesso normal aos estudantes...');
    const { data: estudantesData, error: estudantesError } = await supabase
      .from('estudantes')
      .select('id, nome, cargo, genero')
      .limit(3);
    
    if (estudantesError) {
      console.log('   ❌ Erro ao acessar estudantes:', estudantesError.message);
    } else {
      console.log('   ✅ Tabela estudantes acessível!');
      console.log('   Exemplos de estudantes:');
      estudantesData.forEach(estudante => {
        console.log(`     - ${estudante.nome} (${estudante.cargo || 'Sem cargo'}) - ${estudante.genero}`);
      });
    }
    
    // 4. Resumo
    console.log('\n📋 Resumo do teste:');
    if (!viewError && !congregacoesError) {
      console.log('   🎉 Todas as correções foram aplicadas com sucesso!');
      console.log('   🔄 Reinicie sua aplicação frontend para verificar se os erros foram resolvidos.');
    } else {
      console.log('   ⚠️  Algumas correções ainda precisam ser aplicadas.');
      console.log('   📄 Consulte o arquivo FIX_DATABASE_STRUCTURE.sql para as instruções completas.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    process.exit(1);
  }
}

testFixes();