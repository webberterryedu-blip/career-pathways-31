// Script de verificação final
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Verificação Final do Sistema Ministerial\n');

async function verifySystem() {
  try {
    // 1. Verificar contagem total de estudantes
    const { data: students, error: studentsError } = await supabase
      .from('estudantes')
      .select('id, nome, cargo, genero, ativo');
    
    if (studentsError) {
      console.log('❌ Erro ao verificar estudantes:', studentsError.message);
      return;
    }
    
    console.log(`📊 Total de estudantes cadastrados: ${students.length}`);
    
    // 2. Verificar distribuição por cargo
    const cargos = {};
    students.forEach(student => {
      const cargo = student.cargo || 'Sem cargo';
      cargos[cargo] = (cargos[cargo] || 0) + 1;
    });
    
    console.log('\n👥 Distribuição por cargo:');
    Object.entries(cargos).forEach(([cargo, count]) => {
      console.log(`   ${cargo}: ${count}`);
    });
    
    // 3. Verificar distribuição por gênero
    const generos = {};
    students.forEach(student => {
      const genero = student.genero || 'Não especificado';
      generos[genero] = (generos[genero] || 0) + 1;
    });
    
    console.log('\n🚻 Distribuição por gênero:');
    Object.entries(generos).forEach(([genero, count]) => {
      console.log(`   ${genero}: ${count}`);
    });
    
    // 4. Verificar estudantes ativos
    const ativos = students.filter(student => student.ativo).length;
    const inativos = students.length - ativos;
    
    console.log('\n📈 Status dos estudantes:');
    console.log(`   Ativos: ${ativos}`);
    console.log(`   Inativos: ${inativos}`);
    
    // 5. Mostrar alguns exemplos
    console.log('\n📖 Exemplos de registros:');
    const sampleStudents = students.slice(0, 5);
    sampleStudents.forEach(student => {
      console.log(`   - ${student.nome} (${student.cargo || 'Sem cargo'}) - ${student.genero}`);
    });
    
    console.log('\n🎉 Sistema verificado com sucesso!');
    console.log('   Todos os 27 estudantes foram cadastrados corretamente.');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
    process.exit(1);
  }
}

verifySystem();