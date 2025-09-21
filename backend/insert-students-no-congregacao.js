// Script para inserir estudantes sem dependência de congregações
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Inserindo estudantes sem congregação...\n');

// Criar estudantes com todos os campos obrigatórios
const students = [
  {
    id: '384e1bd0-1a82-46cf-b301-18cae9889984',
    nome: 'Fernanda Almeida',
    genero: 'feminino',
    qualificacoes: {
      chairman: false,
      pray: false,
      tresures: false,
      gems: false,
      reading: false,
      starting: false,
      following: true,
      making: true,
      explaining: true,
      talk: true
    },
    ativo: true,
    menor: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'da834686-e4d1-405e-9f72-e65b3ba094cd',
    nome: 'Eduardo Almeida',
    genero: 'masculino',
    qualificacoes: {
      chairman: false,
      pray: false,
      tresures: false,
      gems: false,
      reading: false,
      starting: true,
      following: true,
      making: true,
      explaining: true,
      talk: true
    },
    ativo: true,
    menor: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '30187638-c022-495f-a962-dd8feb520bf8',
    nome: 'Thiago Almeida',
    genero: 'masculino',
    qualificacoes: {
      chairman: false,
      pray: false,
      tresures: false,
      gems: false,
      reading: true,
      starting: true,
      following: true,
      making: true,
      explaining: true,
      talk: true
    },
    ativo: true,
    menor: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

console.log('Inserindo estudantes...');
supabase
  .from('estudantes')
  .insert(students)
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Erro ao inserir estudantes:', error.message);
      console.log('Detalhes do erro:', JSON.stringify(error, null, 2));
      process.exit(1);
    }
    
    console.log('✅ Estudantes inseridos com sucesso!');
    console.log('Total de registros inseridos:', students.length);
    
    // Verificar os dados inseridos
    supabase
      .from('estudantes')
      .select('id, nome, genero, ativo')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data: verificationData, error: verificationError }) => {
        if (verificationError) {
          console.log('❌ Erro ao verificar dados:', verificationError.message);
        } else {
          console.log('\nÚltimos registros inseridos:');
          console.table(verificationData);
        }
        process.exit(0);
      });
  });