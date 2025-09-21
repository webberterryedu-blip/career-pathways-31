const { supabase } = require('./config/supabase');
const fs = require('fs');
const path = require('path');

// Verificar se está usando a service role key
const supabaseKey = require('./config/supabase').supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (supabaseKey && supabaseKey.includes('YourActualServiceRoleKeyHere')) {
  console.error('⚠️  ATENÇÃO: Você está usando uma chave de serviço inválida!');
  console.error('   Substitua YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE pela chave real obtida em:');
  console.error('   https://app.supabase.com/project/jbapewpuvfijrkhlbsid/settings/api');
  console.error('   Veja SUPABASE_SETUP_INSTRUCTIONS.md para mais detalhes.\n');
}

async function insertStudentData() {
  try {
    console.log('Inserindo dados dos estudantes...');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, '..', 'insert-student-data.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Executar o SQL
    const { data, error } = await supabase.rpc('execute_sql', { sql: sqlContent });
    
    if (error) {
      console.error('Erro ao inserir dados:', error);
      return;
    }
    
    console.log('Dados inseridos com sucesso!');
    console.log('Resultado:', data);
    
  } catch (error) {
    console.error('Erro ao executar o script:', error);
  }
}

// Função para verificar se um estudante já existe
async function studentExists(studentId) {
  const { data, error } = await supabase
    .from('estudantes')
    .select('id')
    .eq('id', studentId)
    .single();
  
  if (error) {
    return false; // Se houver erro, assumimos que não existe
  }
  
  return !!data; // Retorna true se o estudante existir
}

// Função alternativa usando inserção direta
async function insertStudentsDirectly() {
  try {
    console.log('Inserindo dados dos estudantes diretamente...');
    
    // Dados dos estudantes - usando o schema correto
    const allStudents = [
      // Família Almeida
      {
        id: '384e1bd0-1a82-46cf-b301-18cae9889984',
        nome: 'Fernanda Almeida',
        genero: 'feminino',
        cargo: 'estudante_nova',
        ativo: true,
        menor: false,
        familia_id: '78814c76-75b0-42ae-bb7c-9a8f0a3e5919',
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
        data_nascimento: '1987-08-25',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: 'da834686-e4d1-405e-9f72-e65b3ba094cd',
        nome: 'Eduardo Almeida',
        genero: 'masculino',
        cargo: 'estudante_novo',
        ativo: true,
        menor: false,
        familia_id: '78814c76-75b0-42ae-bb7c-9a8f0a3e5919',
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
        data_nascimento: '1952-09-02',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: '30187638-c022-495f-a962-dd8feb520bf8',
        nome: 'Thiago Almeida',
        genero: 'masculino',
        cargo: 'estudante_novo',
        ativo: true,
        menor: true,
        familia_id: '78814c76-75b0-42ae-bb7c-9a8f0a3e5919',
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
        data_nascimento: '2012-08-18',
        responsavel_primario: '3f9fb7cc-4efe-43b6-82b6-063f5c59ce74',
        responsavel_secundario: '6c705a63-00b8-4cfb-867d-588dfc1aa850',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: '16875735-1068-4125-a9e2-951538aeaceb',
        nome: 'Carla Almeida',
        genero: 'feminino',
        cargo: 'estudante_novo',
        ativo: true,
        menor: false,
        familia_id: '78814c76-75b0-42ae-bb7c-9a8f0a3e5919',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1999-08-22',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: '6c705a63-00b8-4cfb-867d-588dfc1aa850',
        nome: 'Fernanda Almeida',
        genero: 'feminino',
        cargo: 'pioneira_regular',
        ativo: true,
        menor: false,
        familia_id: '78814c76-75b0-42ae-bb7c-9a8f0a3e5919',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1970-08-29',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: '3f9fb7cc-4efe-43b6-82b6-063f5c59ce74',
        nome: 'Lucas Almeida',
        genero: 'masculino',
        cargo: 'publicador_batizado',
        ativo: true,
        menor: false,
        familia_id: '78814c76-75b0-42ae-bb7c-9a8f0a3e5919',
        qualificacoes: {
          chairman: false,
          pray: true,
          tresures: false,
          gems: true,
          reading: false,
          starting: true,
          following: true,
          making: true,
          explaining: true,
          talk: true
        },
        data_nascimento: '1999-08-22',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: '3344831c-51aa-44b5-becd-cd5cf31a4a9d',
        nome: 'Larissa Almeida',
        genero: 'feminino',
        cargo: 'publicadora_batizada',
        ativo: true,
        menor: false,
        familia_id: '78814c76-75b0-42ae-bb7c-9a8f0a3e5919',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1971-08-29',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: '1d78db2c-089c-41eb-af78-a064c4c73dcb',
        nome: 'Felipe Almeida',
        genero: 'masculino',
        cargo: 'servo_ministerial',
        ativo: true,
        menor: false,
        familia_id: '78814c76-75b0-42ae-bb7c-9a8f0a3e5919',
        qualificacoes: {
          chairman: false,
          pray: true,
          tresures: true,
          gems: true,
          reading: false,
          starting: true,
          following: true,
          making: true,
          explaining: true,
          talk: true
        },
        data_nascimento: '2002-08-21',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      
      // Família Costa
      {
        id: 'e8182ff8-6777-4497-a354-8f8df68c2b19',
        nome: 'Patrícia Costa',
        genero: 'feminino',
        cargo: 'estudante_nova',
        ativo: true,
        menor: false,
        familia_id: '11c5bc9d-5476-483f-b4f0-537ed70ade51',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1991-08-24',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: 'f994e0fe-850f-42a0-bba2-2aa822d69ef5',
        nome: 'Beatriz Costa',
        genero: 'feminino',
        cargo: 'estudante_nova',
        ativo: true,
        menor: false,
        familia_id: '11c5bc9d-5476-483f-b4f0-537ed70ade51',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1973-08-28',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: 'c6f96322-452c-4d41-be43-4fe0ac24a571',
        nome: 'Rafael Costa',
        genero: 'masculino',
        cargo: 'estudante_novo',
        ativo: true,
        menor: true,
        familia_id: '11c5bc9d-5476-483f-b4f0-537ed70ade51',
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
        data_nascimento: '2011-08-19',
        responsavel_primario: 'f994e0fe-850f-42a0-bba2-2aa822d69ef5',
        responsavel_secundario: '0a0d2daa-002f-40a2-9fb9-edfa98f480c6',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: '8b91e35d-072d-4159-910b-c625a1b18733',
        nome: 'Beatriz Costa',
        genero: 'feminino',
        cargo: 'pioneira_regular',
        ativo: true,
        menor: false,
        familia_id: '11c5bc9d-5476-483f-b4f0-537ed70ade51',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1995-08-23',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: '1b09eddc-8d9d-48b4-bcf1-4e4bc24d69e6',
        nome: 'Carla Costa',
        genero: 'feminino',
        cargo: 'pioneira_regular',
        ativo: true,
        menor: false,
        familia_id: '11c5bc9d-5476-483f-b4f0-537ed70ade51',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1951-09-03',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: 'f9b641c8-84ff-44b5-91e6-13dd94083084',
        nome: 'Patrícia Costa',
        genero: 'feminino',
        cargo: 'pioneira_regular',
        ativo: true,
        menor: false,
        familia_id: '11c5bc9d-5476-483f-b4f0-537ed70ade51',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1993-08-26',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: '0a0d2daa-002f-40a2-9fb9-edfa98f480c6',
        nome: 'Gabriel Costa',
        genero: 'masculino',
        cargo: 'publicador_batizado',
        ativo: true,
        menor: false,
        familia_id: '11c5bc9d-5476-483f-b4f0-537ed70ade51',
        qualificacoes: {
          chairman: false,
          pray: true,
          tresures: false,
          gems: false,
          reading: true,
          starting: true,
          following: true,
          making: true,
          explaining: true,
          talk: true
        },
        data_nascimento: '1973-08-28',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: '31cb4d8a-3b73-4b4b-997a-69c63790a553',
        nome: 'Ana Costa',
        genero: 'feminino',
        cargo: 'publicadora_batizada',
        ativo: true,
        menor: false,
        familia_id: '11c5bc9d-5476-483f-b4f0-537ed70ade51',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1998-08-22',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: '9f0be970-27d8-40d1-898f-cceb62d7b530',
        nome: 'Juliana Costa',
        genero: 'feminino',
        cargo: 'publicadora_batizada',
        ativo: true,
        menor: false,
        familia_id: '11c5bc9d-5476-483f-b4f0-537ed70ade51',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1991-08-24',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      
      // Família Goes
      {
        id: '1ff3b546-c5a1-47f1-b907-60b0961ee8a9',
        nome: 'Juliana Oliveira Goes',
        genero: 'feminino',
        cargo: 'estudante_nova',
        ativo: true,
        menor: false,
        familia_id: 'b88f6190-0194-414f-b85e-68823d68a317',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1984-08-25',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: 'fa855c96-0124-4752-875e-7c2933cf407d',
        nome: 'Carla Oliveira Goes',
        genero: 'feminino',
        cargo: 'estudante_nova',
        ativo: true,
        menor: false,
        familia_id: 'b88f6190-0194-414f-b85e-68823d68a317',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '2007-08-20',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: 'e0536814-7c3e-4675-87a3-d6cff1f6adc3',
        nome: 'Juliana Oliveira Goes',
        genero: 'feminino',
        cargo: 'pioneira_regular',
        ativo: true,
        menor: false,
        familia_id: 'b88f6190-0194-414f-b85e-68823d68a317',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1953-09-02',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: 'c86c94d4-e119-4919-9f6b-7c7629e6d69f',
        nome: 'Carla Oliveira Goes',
        genero: 'feminino',
        cargo: 'pioneira_regular',
        ativo: true,
        menor: false,
        familia_id: 'b88f6190-0194-414f-b85e-68823d68a317',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1973-08-28',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: '211b76d9-8a2b-4bdd-b0c4-93311c351265',
        nome: 'Carla Oliveira Goes',
        genero: 'feminino',
        cargo: 'pioneira_regular',
        ativo: true,
        menor: false,
        familia_id: 'b88f6190-0194-414f-b85e-68823d68a317',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1981-08-26',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: 'e9ea98e4-5833-46fd-9aba-dfe22e8a4b12',
        nome: 'Beatriz Oliveira Goes',
        genero: 'feminino',
        cargo: 'publicadora_batizada',
        ativo: true,
        menor: false,
        familia_id: 'b88f6190-0194-414f-b85e-68823d68a317',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '2006-08-20',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      
      // Família Gomes
      {
        id: '8c3813d7-4191-4b2d-81d0-618d9ff2c4be',
        nome: 'André Gomes',
        genero: 'masculino',
        cargo: 'anciao',
        ativo: true,
        menor: false,
        familia_id: '014e0c2e-7e15-484c-bea8-fc6e72e8bc5d',
        qualificacoes: {
          chairman: true,
          pray: true,
          tresures: true,
          gems: true,
          reading: false,
          starting: true,
          following: true,
          making: true,
          explaining: true,
          talk: true
        },
        data_nascimento: '1968-08-29',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: 'ae709551-ba64-44ed-8dd1-4bf1c4d2cc06',
        nome: 'Eduardo Gomes',
        genero: 'masculino',
        cargo: 'anciao',
        ativo: true,
        menor: false,
        familia_id: '014e0c2e-7e15-484c-bea8-fc6e72e8bc5d',
        qualificacoes: {
          chairman: true,
          pray: true,
          tresures: true,
          gems: true,
          reading: false,
          starting: true,
          following: true,
          making: true,
          explaining: true,
          talk: true
        },
        data_nascimento: '1979-08-27',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: 'c27b65f7-f7d9-49fe-aa24-2c50e699581a',
        nome: 'Larissa Gomes',
        genero: 'feminino',
        cargo: 'pioneira_regular',
        ativo: true,
        menor: false,
        familia_id: '014e0c2e-7e15-484c-bea8-fc6e72e8bc5d',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1979-08-27',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      },
      {
        id: '9e4ab2e3-98ca-4e69-ace1-f9278aa12e01',
        nome: 'Camila Gomes',
        genero: 'feminino',
        cargo: 'pioneira_regular',
        ativo: true,
        menor: false,
        familia_id: '014e0c2e-7e15-484c-bea8-fc6e72e8bc5d',
        qualificacoes: {
          chairman: false,
          pray: false,
          tresures: false,
          gems: false,
          reading: false,
          starting: false,
          following: false,
          making: false,
          explaining: true,
          talk: true
        },
        data_nascimento: '1964-08-30',
        created_at: '2025-08-15 15:31:50',
        updated_at: '2025-08-15 15:31:50'
      }
    ];
    
    // Verificar quais estudantes já existem
    const studentsToInsert = [];
    const studentsToUpdate = [];
    
    for (const student of allStudents) {
      const exists = await studentExists(student.id);
      if (exists) {
        studentsToUpdate.push(student);
      } else {
        studentsToInsert.push(student);
      }
    }
    
    console.log(`Estudantes para inserir: ${studentsToInsert.length}`);
    console.log(`Estudantes para atualizar: ${studentsToUpdate.length}`);
    
    // Inserir novos estudantes
    if (studentsToInsert.length > 0) {
      console.log('Inserindo novos estudantes...');
      const { data, error } = await supabase
        .from('estudantes')
        .insert(studentsToInsert);
      
      if (error) {
        console.error('Erro ao inserir novos estudantes:', error);
      } else {
        console.log(`✅ ${studentsToInsert.length} estudantes inseridos com sucesso!`);
      }
    }
    
    // Atualizar estudantes existentes
    if (studentsToUpdate.length > 0) {
      console.log('Atualizando estudantes existentes...');
      let updatedCount = 0;
      
      for (const student of studentsToUpdate) {
        const { data, error } = await supabase
          .from('estudantes')
          .update(student)
          .eq('id', student.id);
        
        if (error) {
          console.error(`Erro ao atualizar estudante ${student.nome}:`, error);
        } else {
          updatedCount++;
        }
      }
      
      console.log(`✅ ${updatedCount} estudantes atualizados com sucesso!`);
    }
    
    console.log('Processo de inserção/atualização concluído!');
    
    // Verificar os dados inseridos
    const { data: verificationData, error: verificationError } = await supabase
      .from('estudantes')
      .select('id, nome, cargo, familia_id')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (verificationError) {
      console.error('Erro ao verificar dados:', verificationError);
    } else {
      console.log('Últimos registros:');
      console.table(verificationData);
    }
    
  } catch (error) {
    console.error('Erro ao executar o script:', error);
  }
}

// Exportar a função para uso em outros arquivos
module.exports = { insertStudentsDirectly };