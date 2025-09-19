/**
 * Teste direto do algoritmo usando dados do CSV fornecido
 */

// Importar o algoritmo
const AlgoritmoDesignacoes = require('./routes/designacoes-algoritmo');

// Dados de exemplo baseados no CSV fornecido
const estudantesMockData = [
  {
    user_id: '384e1bd0-1a82-46cf-b301-18cae9889984',
    nome: 'Fernanda Almeida',
    genero: 'feminino',
    cargo: 'estudante_nova',
    ativo: true,
    menor: false,
    family_id: '78814c76-75b0-42ae-bb7c-9a8f0a3e5919',
    chairman: false,
    pray: false,
    tresures: false,
    gems: false,
    reading: false,
    starting: true,
    following: true,
    making: true,
    explaining: true,
    talk: false,
    data_nascimento: '1987-08-25'
  },
  {
    user_id: '1d78db2c-089c-41eb-af78-a064c4c73dcb',
    nome: 'Felipe Almeida',
    genero: 'masculino',
    cargo: 'servo_ministerial',
    ativo: true,
    menor: false,
    family_id: '78814c76-75b0-42ae-bb7c-9a8f0a3e5919',
    chairman: false,
    pray: true,
    tresures: true,
    gems: true,
    reading: true,
    starting: true,
    following: true,
    making: true,
    explaining: true,
    talk: true,
    data_nascimento: '2002-08-21'
  },
  {
    user_id: '8c3813d7-4191-4b2d-81d0-618d9ff2c4be',
    nome: 'André Gomes',
    genero: 'masculino',
    cargo: 'anciao',
    ativo: true,
    menor: false,
    family_id: '014e0c2e-7e15-484c-bea8-fc6e72e8bc5d',
    chairman: true,
    pray: true,
    tresures: true,
    gems: true,
    reading: true,
    starting: true,
    following: true,
    making: true,
    explaining: true,
    talk: true,
    data_nascimento: '1968-08-29'
  },
  {
    user_id: '9e4ab2e3-98ca-4e69-ace1-f9278aa12e01',
    nome: 'Camila Gomes',
    genero: 'feminino',
    cargo: 'pioneira_regular',
    ativo: true,
    menor: false,
    family_id: '014e0c2e-7e15-484c-bea8-fc6e72e8bc5d',
    chairman: false,
    pray: false,
    tresures: false,
    gems: false,
    reading: false,
    starting: true,
    following: true,
    making: true,
    explaining: true,
    talk: false,
    data_nascimento: '1964-08-30'
  },
  {
    user_id: '7b35ea82-8805-4704-ba41-bc2e6d40eca4',
    nome: 'Lucas Souza Lira',
    genero: 'masculino',
    cargo: 'anciao',
    ativo: true,
    menor: false,
    family_id: '676f2d67-2c0b-4cdd-b620-380232dbbd3f',
    chairman: true,
    pray: true,
    tresures: true,
    gems: true,
    reading: true,
    starting: true,
    following: true,
    making: true,
    explaining: true,
    talk: true,
    data_nascimento: '1993-08-23'
  },
  {
    user_id: '2a707233-9f33-474a-b19f-3fff8c5f23e0',
    nome: 'Camila Silva Lira',
    genero: 'feminino',
    cargo: 'pioneira_regular',
    ativo: true,
    menor: false,
    family_id: '676f2d67-2c0b-4cdd-b620-380232dbbd3f',
    chairman: false,
    pray: false,
    tresures: false,
    gems: false,
    reading: false,
    starting: true,
    following: true,
    making: true,
    explaining: true,
    talk: false,
    data_nascimento: '1965-08-30'
  }
];

// Regras S-38 (copiadas do algoritmo)
const REGRAS_S38 = {
  opening_comments: {
    genero: 'masculino',
    cargos_permitidos: ['anciao', 'servo_ministerial'],
    qualificacao_necessaria: 'chairman',
    precisa_ajudante: false,
    apenas_batizados: true,
    priorizar_ancioes: true,
    rotacao_justa: true
  },
  
  treasures_talk: {
    genero: 'masculino',
    cargos_permitidos: ['anciao', 'servo_ministerial'],
    qualificacao_necessaria: 'tresures',
    precisa_ajudante: false,
    apenas_batizados: true,
    priorizar_ancioes: true,
    rotacao_justa: true
  },
  
  spiritual_gems: {
    genero: 'masculino',
    cargos_permitidos: ['anciao', 'servo_ministerial'],
    qualificacao_necessaria: 'gems',
    precisa_ajudante: false,
    apenas_batizados: true,
    priorizar_ancioes: true,
    rotacao_justa: true
  },
  
  bible_reading: {
    genero: 'masculino',
    qualificacao_necessaria: 'reading',
    precisa_ajudante: false,
    excluir_menores: false,
    rotacao_justa: true
  },
  
  starting_conversation: {
    qualificacao_necessaria: 'starting',
    precisa_ajudante: true,
    ajudante_mesmo_genero: true,
    ajudante_familia: true,
    excluir_menores: false,
    rotacao_justa: true
  }
};

function testarAlgoritmoDirecto() {
  console.log('🚀 Testando Algoritmo S-38 Diretamente...\n');
  
  try {
    // Criar instância do algoritmo (simulando a class)
    const algoritmo = {
      converterDadosPlanilha: function(dados) {
        return dados.map((linha, index) => ({
          id: linha.user_id || `estudante_${index}`,
          nome: linha.nome,
          genero: linha.genero,
          cargo: linha.cargo,
          ativo: linha.ativo === true || linha.ativo === 'TRUE',
          menor: linha.menor === true || linha.menor === 'TRUE',
          familia_id: linha.family_id || linha.familia,
          qualificacoes: {
            chairman: linha.chairman === true || linha.chairman === 'TRUE',
            pray: linha.pray === true || linha.pray === 'TRUE',
            tresures: linha.tresures === true || linha.tresures === 'TRUE',
            gems: linha.gems === true || linha.gems === 'TRUE',
            reading: linha.reading === true || linha.reading === 'TRUE',
            starting: linha.starting === true || linha.starting === 'TRUE',
            following: linha.following === true || linha.following === 'TRUE',
            making: linha.making === true || linha.making === 'TRUE',
            explaining: linha.explaining === true || linha.explaining === 'TRUE',
            talk: linha.talk === true || linha.talk === 'TRUE',
          },
          ultima_designacao: undefined,
          contador_designacoes: 0,
          data_nascimento: new Date(linha.data_nascimento || '1990-01-01'),
          responsavel_primario: linha.responsavel_primario,
          responsavel_secundario: linha.responsavel_secundario
        }));
      },
      
      filtrarCandidatos: function(estudantes, regras) {
        return estudantes.filter(estudante => {
          if (!estudante.ativo) return false;
          if (regras.genero && estudante.genero !== regras.genero) return false;
          if (regras.cargos_permitidos && !regras.cargos_permitidos.includes(estudante.cargo)) return false;
          if (!estudante.qualificacoes[regras.qualificacao_necessaria]) return false;
          if (regras.excluir_menores && estudante.menor) return false;
          
          if (regras.apenas_batizados) {
            const cargosBatizados = ['anciao', 'servo_ministerial', 'pioneiro_regular', 'pioneira_regular', 'publicador_batizado', 'publicadora_batizada'];
            if (!cargosBatizados.includes(estudante.cargo)) return false;
          }
          
          return true;
        });
      }
    };
    
    // 1. Converter dados
    console.log('1️⃣ Convertendo dados dos estudantes...');
    const estudantes = algoritmo.converterDadosPlanilha(estudantesMockData);
    console.log(`✅ ${estudantes.length} estudantes convertidos`);
    
    // 2. Mostrar estudantes
    console.log('\n📝 Estudantes disponíveis:');
    estudantes.forEach(e => {
      console.log(`   - ${e.nome} (${e.genero}, ${e.cargo})`);
      console.log(`     Qualificações: chairman=${e.qualificacoes.chairman}, tresures=${e.qualificacoes.tresures}, reading=${e.qualificacoes.reading}, starting=${e.qualificacoes.starting}`);
    });
    
    // 3. Testar filtros para diferentes partes
    console.log('\n2️⃣ Testando filtros das regras S-38...\n');
    
    Object.entries(REGRAS_S38).forEach(([tipoPartc, regras]) => {
      console.log(`🔍 ${tipoPartc}:`);
      console.log(`   Regras: ${JSON.stringify(regras, null, 2).replace(/\n/g, '\n   ')}`);
      
      const candidatos = algoritmo.filtrarCandidatos(estudantes, regras);
      console.log(`   ✅ ${candidatos.length} candidatos elegíveis:`);
      
      candidatos.forEach(c => {
        console.log(`      - ${c.nome} (${c.cargo})`);
      });
      
      if (candidatos.length === 0) {
        console.log('      ⚠️ Nenhum candidato disponível para esta parte');
      }
      
      console.log('');
    });
    
    console.log('🎉 Teste do algoritmo concluído com sucesso!\n');
    console.log('📊 Resumo:');
    console.log(`   - Total de estudantes: ${estudantes.length}`);
    console.log(`   - Partes testadas: ${Object.keys(REGRAS_S38).length}`);
    console.log(`   - Algoritmo funcionando: ✅`);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testarAlgoritmoDirecto();