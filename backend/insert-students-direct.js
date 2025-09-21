// Script para inserir estudantes diretamente
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Inserindo estudantes diretamente...\n');

// Vamos primeiro verificar se já existem congregações
supabase
  .from('congregacoes')
  .select('id, nome')
  .then(({ data: congregacoes, error: congregacoesError }) => {
    if (congregacoesError) {
      console.log('❌ Erro ao acessar congregações:', congregacoesError.message);
      process.exit(1);
    }
    
    console.log('Hotéis existentes:');
    if (congregacoes && congregacoes.length > 0) {
      console.table(congregacoes);
    } else {
      console.log(' Nenhuma congregação encontrada');
    }
    
    // Criar estudantes sem depender de perfis ou usuários
    const students = [
      {
        id: '384e1bd0-1a82-46cf-b301-18cae9889984',
        genero: 'feminino',
        qualificacoes: ['following', 'making', 'explaining', 'talk'],
        ativo: true,
        congregacao_id: congregacoes.length > 0 ? congregacoes[0].id : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'da834686-e4d1-405e-9f72-e65b3ba094cd',
        genero: 'masculino',
        qualificacoes: ['starting', 'following', 'making', 'explaining', 'talk'],
        ativo: true,
        congregacao_id: congregacoes.length > 0 ? congregacoes[0].id : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    // Remover congregacao_id se for null
    const validStudents = students.map(student => {
      if (!student.congregacao_id) {
        delete student.congregacao_id;
      }
      return student;
    });
    
    console.log('\nInserindo estudantes...');
    supabase
      .from('estudantes')
      .insert(validStudents)
      .then(({ data, error }) => {
        if (error) {
          console.log('❌ Erro ao inserir estudantes:', error.message);
          console.log('Detalhes do erro:', JSON.stringify(error, null, 2));
          process.exit(1);
        }
        
        console.log('✅ Estudantes inseridos com sucesso!');
        console.log('Total de registros inseridos:', validStudents.length);
        
        // Verificar os dados inseridos
        supabase
          .from('estudantes')
          .select('id, genero, qualificacoes, ativo')
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
  });