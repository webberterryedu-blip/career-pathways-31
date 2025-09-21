// Script para corrigir a estrutura do banco de dados
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Corrigindo estrutura do banco de dados...\n');

async function fixDatabaseStructure() {
  try {
    // 1. Criar a tabela congregacoes se não existir
    console.log('1. Criando tabela congregacoes...');
    const { error: congregacoesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.congregacoes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nome TEXT NOT NULL,
          cidade TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now()
        );
        
        ALTER TABLE public.congregacoes ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (congregacoesError) {
      console.log('   ⚠️  Aviso ao criar congregacoes:', congregacoesError.message);
    } else {
      console.log('   ✅ Tabela congregacoes criada ou já existente');
      
      // Inserir algumas congregações de exemplo
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
        console.log('   ✅ Congregações de exemplo inseridas');
      }
    }
    
    // 2. Adicionar colunas faltando nas tabelas existentes
    console.log('\n2. Adicionando colunas faltando...');
    
    // Adicionar colunas na tabela profiles
    const profileColumns = [
      { name: 'user_id', type: 'UUID UNIQUE REFERENCES auth.users ON DELETE CASCADE' },
      { name: 'role', type: 'TEXT DEFAULT \'estudante\'' },
      { name: 'congregacao', type: 'TEXT' },
      { name: 'telefone', type: 'TEXT' }
    ];
    
    for (const column of profileColumns) {
      try {
        const { error } = await supabase.rpc('execute_sql', {
          sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`
        });
        
        if (error) {
          console.log(`   ⚠️  Aviso ao adicionar ${column.name} em profiles:`, error.message);
        } else {
          console.log(`   ✅ Coluna ${column.name} adicionada à tabela profiles`);
        }
      } catch (e) {
        console.log(`   ⚠️  Erro ao adicionar ${column.name} em profiles:`, e.message);
      }
    }
    
    // Adicionar colunas na tabela estudantes
    const estudanteColumns = [
      { name: 'profile_id', type: 'UUID REFERENCES public.profiles(id) ON DELETE CASCADE' },
      { name: 'user_id', type: 'UUID REFERENCES auth.users ON DELETE CASCADE' },
      { name: 'congregacao', type: 'TEXT' },
      { name: 'email', type: 'TEXT' },
      { name: 'telefone', type: 'TEXT' },
      { name: 'role', type: 'TEXT' }
    ];
    
    for (const column of estudanteColumns) {
      try {
        const { error } = await supabase.rpc('execute_sql', {
          sql: `ALTER TABLE public.estudantes ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`
        });
        
        if (error) {
          console.log(`   ⚠️  Aviso ao adicionar ${column.name} em estudantes:`, error.message);
        } else {
          console.log(`   ✅ Coluna ${column.name} adicionada à tabela estudantes`);
        }
      } catch (e) {
        console.log(`   ⚠️  Erro ao adicionar ${column.name} em estudantes:`, e.message);
      }
    }
    
    // 3. Criar a view vw_estudantes_grid
    console.log('\n3. Criando view vw_estudantes_grid...');
    const { error: viewError } = await supabase.rpc('execute_sql', {
      sql: `
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
      `
    });
    
    if (viewError) {
      console.log('   ⚠️  Aviso ao criar view:', viewError.message);
    } else {
      console.log('   ✅ View vw_estudantes_grid criada com sucesso');
    }
    
    // 4. Atualizar dados para consistência
    console.log('\n4. Atualizando dados para consistência...');
    
    // Atualizar estudantes com profile_id onde possível
    try {
      const { error: updateError } = await supabase.rpc('execute_sql', {
        sql: `
          UPDATE public.estudantes e
          SET profile_id = p.id
          FROM public.profiles p
          WHERE e.profile_id IS NULL 
          AND e.user_id IS NOT NULL 
          AND p.user_id = e.user_id;
        `
      });
      
      if (updateError) {
        console.log('   ⚠️  Aviso ao atualizar estudantes:', updateError.message);
      } else {
        console.log('   ✅ Estudantes atualizados com profile_id onde possível');
      }
    } catch (e) {
      console.log('   ⚠️  Erro ao atualizar estudantes:', e.message);
    }
    
    console.log('\n🎉 Correção da estrutura do banco de dados concluída!');
    console.log('\nPróximos passos:');
    console.log('1. Reinicie sua aplicação frontend');
    console.log('2. Verifique se os dados dos estudantes estão sendo carregados corretamente');
    console.log('3. Teste as funções Edge novamente');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir estrutura do banco de dados:', error.message);
    process.exit(1);
  }
}

fixDatabaseStructure();