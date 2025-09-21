// Script para verificar se a service role key está correta
require('dotenv').config({ path: __dirname + '/.env' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Verificando configuração da Service Role Key...\n');

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Variáveis encontradas:');
console.log('  SUPABASE_URL:', supabaseUrl || '❌ NÃO ENCONTRADA');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ DEFINIDA' : '❌ NÃO ENCONTRADA');

if (!supabaseUrl) {
  console.error('\n❌ ERRO: SUPABASE_URL não está definida no arquivo .env');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('\n❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não está definida no arquivo .env');
  process.exit(1);
}

// Verificar se a chave é válida (não é o placeholder)
if (supabaseServiceKey.includes('YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE') || 
    supabaseServiceKey.includes('YourActualServiceRoleKeyHere')) {
  console.error('\n❌ ERRO: A SUPABASE_SERVICE_ROLE_KEY ainda contém o placeholder.');
  console.error('   Você precisa substituir "YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE" pela chave real.');
  console.error('\n💡 Instruções:');
  console.error('   1. Acesse: https://app.supabase.com/project/jbapewpuvfijrkhlbsid/settings/api');
  console.error('   2. Copie a "Service Role Secret"');
  console.error('   3. Cole no arquivo .env na variável SUPABASE_SERVICE_ROLE_KEY');
  console.error('   4. Veja SUPABASE_SETUP_INSTRUCTIONS.md para mais detalhes.');
  process.exit(1);
}

// Tentar conectar com a service role key
console.log('\n🧪 Testando conexão com a Service Role Key...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Testar uma operação simples
supabase
  .from('estudantes')
  .select('id')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      console.log('\n💡 Possíveis soluções:');
      console.log('   1. Verifique se a chave está correta');
      console.log('   2. Verifique se o projeto Supabase está ativo');
      console.log('   3. Verifique se não há problemas de rede');
      process.exit(1);
    } else {
      console.log('✅ Conexão bem-sucedida!');
      console.log('   Verificação da tabela estudantes: OK');
      console.log('\n🎉 Agora você pode executar o script de inserção de dados:');
      console.log('   node run-insert-student-data.js');
      process.exit(0);
    }
  })
  .catch(err => {
    console.log('❌ Erro na conexão:', err.message);
    process.exit(1);
  });