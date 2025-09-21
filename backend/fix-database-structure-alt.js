// Script alternativo para corrigir a estrutura do banco de dados
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Corrigindo estrutura do banco de dados (método alternativo)...\n');

async function fixDatabaseStructure() {
  try {
    // 1. Tentar criar a tabela congregacoes com um insert simples
    console.log('1. Verificando/criando tabela congregacoes...');
    
    // Primeiro, verificar se a tabela existe tentando acessá-la
    const { data, error } = await supabase
      .from('congregacoes')
      .select('count()', { count: 'exact' });
    
    if (error && error.message.includes('Could not find the table')) {
      console.log('   ⚠️  Tabela congregacoes não existe. Precisa ser criada manualmente via Supabase Dashboard.');
      console.log('   💡 Vá para: https://supabase.com/dashboard/project/jbapewpuvfijrkhlbsid/editor');
      console.log('   💡 E execute o seguinte SQL:');
      console.log(`
CREATE TABLE IF NOT EXISTS public.congregacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.congregacoes ENABLE ROW LEVEL SECURITY;

INSERT INTO public.congregacoes (id, nome, cidade) VALUES
  ('78814c76-75b0-42ae-bb7c-9a8f0a3e5919', 'Congregação Almeida', 'São Paulo'),
  ('11c5bc9d-5476-483f-b4f0-537ed70ade51', 'Congregação Costa', 'Rio de Janeiro'),
  ('b88f6190-0194-414f-b85e-68823d68a317', 'Congregação Goes', 'Belo Horizonte'),
  ('014e0c2e-7e15-484c-bea8-fc6e72e8bc5d', 'Congregação Gomes', 'Porto Alegre')
ON CONFLICT (id) DO NOTHING;
      `);
    } else {
      console.log('   ✅ Tabela congregacoes acessível');
      
      // Inserir congregações de exemplo se não existirem
      const { error: insertError } = await supabase
        .from('congregacoes')
        .upsert([
          { id: '78814c76-75b0-42ae-bb7c-9a8f0a3e5919', nome: 'Congregação Almeida', cidade: 'São Paulo' },
          { id: '11c5bc9d-5476-483f-b4f0-537ed70ade51', nome: 'Congregação Costa', cidade: 'Rio de Janeiro' },
          { id: 'b88f6190-0194-414f-b85e-68823d68a317', nome: 'Congregação Goes', cidade: 'Belo Horizonte' },
          { id: '014e0c2e-7e15-484c-bea8-fc6e72e8bc5d', nome: 'Congregação Gomes', cidade: 'Porto Alegre' }
        ], { onConflict: 'id' });
      
      if (insertError) {
        console.log('   ⚠️  Aviso ao inserir congregações:', insertError.message);
      } else {
        console.log('   ✅ Congregações verificadas/atualizadas');
      }
    }
    
    // 2. Criar uma view alternativa usando uma função
    console.log('\n2. Criando view alternativa vw_estudantes_grid...');
    
    // Verificar se a view existe tentando acessá-la
    const { data: viewData, error: viewError } = await supabase
      .from('vw_estudantes_grid')
      .select('count()', { count: 'exact' });
    
    if (viewError && viewError.message.includes('Could not find the table')) {
      console.log('   ⚠️  View vw_estudantes_grid não existe. Precisa ser criada manualmente via Supabase Dashboard.');
      console.log('   💡 Vá para: https://supabase.com/dashboard/project/jbapewpuvfijrkhlbsid/editor');
      console.log('   💡 E execute o seguinte SQL:');
      console.log(`
CREATE OR REPLACE VIEW public.vw_estudantes_grid AS
SELECT 
  e.id,
  e.nome,
  e.genero,
  e.qualificacoes,
  e.ativo,
  e.congregacao,
  e.user_id,
  e.profile_id,
  p.email,
  p.telefone,
  p.cargo,
  p.role,
  e.created_at,
  e.updated_at
FROM public.estudantes e
LEFT JOIN public.profiles p ON p.id = e.profile_id OR p.user_id = e.user_id;
      `);
    } else {
      console.log('   ✅ View vw_estudantes_grid acessível');
    }
    
    // 3. Verificar se os dados dos estudantes estão acessíveis
    console.log('\n3. Verificando acesso aos dados dos estudantes...');
    const { data: estudantesData, error: estudantesError } = await supabase
      .from('estudantes')
      .select('id, nome, cargo, genero, ativo')
      .limit(5);
    
    if (estudantesError) {
      console.log('   ❌ Erro ao acessar estudantes:', estudantesError.message);
    } else {
      console.log('   ✅ Acesso aos estudantes confirmado');
      console.log('   Exemplos de estudantes:');
      estudantesData.forEach(estudante => {
        console.log(`     - ${estudante.nome} (${estudante.cargo || 'Sem cargo'})`);
      });
    }
    
    // 4. Verificar se os profiles estão acessíveis
    console.log('\n4. Verificando acesso aos profiles...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, nome, email')
      .limit(5);
    
    if (profilesError) {
      console.log('   ❌ Erro ao acessar profiles:', profilesError.message);
    } else {
      console.log('   ✅ Acesso aos profiles confirmado');
      if (profilesData.length > 0) {
        console.log('   Exemplos de profiles:');
        profilesData.forEach(profile => {
          console.log(`     - ${profile.nome} (${profile.email})`);
        });
      } else {
        console.log('   Nenhum profile encontrado');
      }
    }
    
    console.log('\n📋 Resumo das correções necessárias:');
    console.log('1. Criar tabela congregacoes (se não existir)');
    console.log('2. Criar view vw_estudantes_grid (se não existir)');
    console.log('3. Ambas podem ser criadas via Supabase SQL Editor');
    
    console.log('\n🔗 Links úteis:');
    console.log('   Supabase Dashboard: https://supabase.com/dashboard/project/jbapewpuvfijrkhlbsid');
    console.log('   SQL Editor: https://supabase.com/dashboard/project/jbapewpuvfijrkhlbsid/editor');
    console.log('   Database Settings: https://supabase.com/dashboard/project/jbapewpuvfijrkhlbsid/settings/database');
    
    console.log('\n🔄 Após criar as tabelas/views, reinicie sua aplicação frontend.');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir estrutura do banco de dados:', error.message);
    process.exit(1);
  }
}

fixDatabaseStructure();