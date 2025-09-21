// Script para criar a tabela congregacoes
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Criando tabela congregacoes...\n');

// Criar a tabela congregacoes
const createCongregacoesSQL = `
CREATE TABLE IF NOT EXISTS public.congregacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

supabase
  .rpc('execute_sql', { sql: createCongregacoesSQL })
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Erro ao criar tabela congregacoes:', error.message);
      console.log('Detalhes:', JSON.stringify(error, null, 2));
      process.exit(1);
    }
    
    console.log('✅ Tabela congregacoes criada com sucesso!');
    
    // Inserir algumas congregações de exemplo
    const congregacoes = [
      {
        id: '78814c76-75b0-42ae-bb7c-9a8f0a3e5919',
        nome: 'Congregação Almeida',
        cidade: 'São Paulo'
      },
      {
        id: '11c5bc9d-5476-483f-b4f0-537ed70ade51',
        nome: 'Congregação Costa',
        cidade: 'Rio de Janeiro'
      },
      {
        id: 'b88f6190-0194-414f-b85e-68823d68a317',
        nome: 'Congregação Goes',
        cidade: 'Belo Horizonte'
      },
      {
        id: '014e0c2e-7e15-484c-bea8-fc6e72e8bc5d',
        nome: 'Congregação Gomes',
        cidade: 'Porto Alegre'
      }
    ];
    
    supabase
      .from('congregacoes')
      .insert(congregacoes)
      .then(({ data: insertData, error: insertError }) => {
        if (insertError) {
          console.log('❌ Erro ao inserir congregações:', insertError.message);
          process.exit(1);
        }
        
        console.log('✅ Congregações inseridas com sucesso!');
        
        // Verificar as congregações inseridas
        supabase
          .from('congregacoes')
          .select('id, nome, cidade')
          .then(({ data: verificationData, error: verificationError }) => {
            if (verificationError) {
              console.log('❌ Erro ao verificar congregações:', verificationError.message);
            } else {
              console.log('\nCongregações criadas:');
              console.table(verificationData);
            }
            process.exit(0);
          });
      });
  });