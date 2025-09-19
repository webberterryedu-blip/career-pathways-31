const express = require('express');
const { supabase } = require('../config/supabase');

// =====================================================
// ALGORITMO CENTRAL DE DESIGNAÇÕES - SISTEMA MINISTERIAL  
// =====================================================

/**
 * Algoritmo que implementa as regras oficiais S-38 da organização
 * para distribuir as partes da reunião de forma justa e conforme as diretrizes.
 */
class AlgoritmoDesignacoes {

  /**
   * Converte dados da planilha para o formato do algoritmo
   */
  converterDadosPlanilha(dadosPlanilha) {
    return dadosPlanilha.map((linha, index) => ({
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
  }

  /**
   * Filtra candidatos elegíveis baseado nas regras da parte
   */
  filtrarCandidatos(estudantes, regras) {
    return estudantes.filter(estudante => {
      // 1. Deve estar ativo
      if (!estudante.ativo) {
        return false;
      }

      // 2. Filtro por gênero
      if (regras.genero && estudante.genero !== regras.genero) {
        return false;
      }

      // 3. Filtro por cargo
      if (regras.cargos_permitidos && !regras.cargos_permitidos.includes(estudante.cargo)) {
        return false;
      }

      // 4. Verificar qualificação necessária
      const qualificacao = regras.qualificacao_necessaria;
      if (!estudante.qualificacoes[qualificacao]) {
        return false;
      }

      // 5. Filtro de idade - excluir menores se necessário
      if (regras.excluir_menores && estudante.menor) {
        return false;
      }

      // 6. Filtro por batismo
      if (regras.apenas_batizados) {
        const cargosBatizados = [
          'anciao', 'servo_ministerial', 'pioneiro_regular', 
          'pioneira_regular', 'publicador_batizado', 'publicadora_batizada'
        ];
        if (!cargosBatizados.includes(estudante.cargo)) {
          return false;
        }
      }

      // 7. Verificar idade mínima/máxima
      if (regras.idade_minima || regras.idade_maxima) {
        const idade = this.calcularIdade(estudante.data_nascimento);
        if (regras.idade_minima && idade < regras.idade_minima) {
          return false;
        }
        if (regras.idade_maxima && idade > regras.idade_maxima) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Seleciona o melhor candidato baseado em prioridades e rotação justa
   */
  selecionarMelhorCandidato(candidatos, regras) {
    if (candidatos.length === 0) {
      return null;
    }

    // Aplicar prioridades por cargo
    let candidatosPriorizados = [...candidatos];

    if (regras.priorizar_ancioes) {
      const ancioes = candidatos.filter(c => c.cargo === 'anciao');
      if (ancioes.length > 0) {
        candidatosPriorizados = ancioes;
      }
    }

    if (regras.priorizar_servos && candidatosPriorizados.length === candidatos.length) {
      const servos = candidatos.filter(c => c.cargo === 'servo_ministerial');
      if (servos.length > 0) {
        candidatosPriorizados = servos;
      }
    }

    // Aplicar rotação justa - quem tem menos designações vai primeiro
    if (regras.rotacao_justa) {
      candidatosPriorizados.sort((a, b) => {
        // Primeiro critério: menos designações
        if (a.contador_designacoes !== b.contador_designacoes) {
          return a.contador_designacoes - b.contador_designacoes;
        }
        
        // Segundo critério: última designação mais antiga
        if (a.ultima_designacao && b.ultima_designacao) {
          return a.ultima_designacao.localeCompare(b.ultima_designacao);
        }
        
        // Terceiro critério: quem nunca teve designação vai primeiro
        if (!a.ultima_designacao && b.ultima_designacao) return -1;
        if (a.ultima_designacao && !b.ultima_designacao) return 1;
        
        return 0;
      });
    }

    return candidatosPriorizados[0];
  }

  /**
   * Encontra um ajudante adequado para a parte
   */
  encontrarAjudante(estudantePrincipal, candidatos, regras) {
    if (!regras.precisa_ajudante) {
      return null;
    }

    // Filtrar ajudantes válidos
    let ajudantesValidos = candidatos.filter(candidato => {
      // Não pode ser o mesmo estudante
      if (candidato.id === estudantePrincipal.id) {
        return false;
      }

      // Verificar regra de mesmo gênero
      if (regras.ajudante_mesmo_genero && candidato.genero !== estudantePrincipal.genero) {
        return false;
      }

      // Verificar regra de família (para demonstrações com parentes)
      if (regras.ajudante_familia) {
        // Permite mesmo gênero OU família
        const mesmoGenero = candidato.genero === estudantePrincipal.genero;
        const mesmaFamilia = candidato.familia_id === estudantePrincipal.familia_id;
        
        if (!mesmoGenero && !mesmaFamilia) {
          return false;
        }
      }

      return true;
    });

    // Priorizar família se disponível
    if (regras.ajudante_familia) {
      const familiares = ajudantesValidos.filter(a => a.familia_id === estudantePrincipal.familia_id);
      if (familiares.length > 0) {
        ajudantesValidos = familiares;
      }
    }

    // Aplicar rotação justa para ajudantes também
    ajudantesValidos.sort((a, b) => a.contador_designacoes - b.contador_designacoes);

    return ajudantesValidos[0] || null;
  }

  /**
   * Calcula a idade baseada na data de nascimento
   */
  calcularIdade(dataNascimento) {
    const hoje = new Date();
    const idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const mesAniversario = hoje.getMonth() - dataNascimento.getMonth();
    
    if (mesAniversario < 0 || (mesAniversario === 0 && hoje.getDate() < dataNascimento.getDate())) {
      return idade - 1;
    }
    
    return idade;
  }

  /**
   * Gera as designações para uma semana completa
   */
  gerarDesignacoes(estudantes, partes) {
    const resultados = [];
    const conflitos = [];
    const estudantesUsados = new Set();
    
    // Clonar estudantes para não modificar o array original
    const estudantesClone = estudantes.map(e => ({ ...e }));

    for (const parte of partes) {
      // Filtrar candidatos elegíveis
      const candidatos = this.filtrarCandidatos(estudantesClone, parte.regras);
      const candidatosDisponiveis = candidatos.filter(c => !estudantesUsados.has(c.id));
      
      if (candidatosDisponiveis.length === 0) {
        conflitos.push(`Nenhum candidato disponível para ${parte.titulo}`);
        continue;
      }

      // Selecionar estudante principal
      const estudantePrincipal = this.selecionarMelhorCandidato(candidatosDisponiveis, parte.regras);
      
      if (!estudantePrincipal) {
        conflitos.push(`Falha ao selecionar candidato para ${parte.titulo}`);
        continue;
      }

      // Buscar ajudante se necessário
      let ajudante = null;
      if (parte.regras.precisa_ajudante) {
        const candidatosAjudante = candidatos.filter(c => 
          !estudantesUsados.has(c.id) && c.id !== estudantePrincipal.id
        );
        ajudante = this.encontrarAjudante(estudantePrincipal, candidatosAjudante, parte.regras);
        
        if (!ajudante) {
          conflitos.push(`Nenhum ajudante disponível para ${parte.titulo}`);
        }
      }

      // Atualizar contadores e marcadores
      estudantePrincipal.contador_designacoes++;
      estudantePrincipal.ultima_designacao = parte.titulo;
      estudantesUsados.add(estudantePrincipal.id);
      
      if (ajudante) {
        ajudante.contador_designacoes++;
        ajudante.ultima_designacao = `${parte.titulo} (ajudante)`;
        estudantesUsados.add(ajudante.id);
      }

      // Registrar resultado
      resultados.push({
        parte,
        estudante_principal: estudantePrincipal,
        ajudante: ajudante || undefined,
        motivo_escolha: this.gerarMotivoEscolha(estudantePrincipal, parte.regras),
        alternativas_consideradas: candidatosDisponiveis.length
      });
    }

    // Gerar estatísticas
    const estatisticas = {
      total_estudantes_disponiveis: estudantes.length,
      total_partes_designadas: resultados.length,
      distribuicao_por_cargo: this.calcularDistribuicaoPorCargo(resultados),
      estudantes_sem_designacao: estudantes.filter(e => !estudantesUsados.has(e.id)),
      conflitos_encontrados: conflitos
    };

    return { resultados, estatisticas };
  }

  /**
   * Gera explicação do motivo da escolha
   */
  gerarMotivoEscolha(estudante, regras) {
    const motivos = [];
    
    if (regras.priorizar_ancioes && estudante.cargo === 'anciao') {
      motivos.push('Prioridade para anciãos');
    }
    
    if (regras.priorizar_servos && estudante.cargo === 'servo_ministerial') {
      motivos.push('Prioridade para servos ministeriais');
    }
    
    if (estudante.contador_designacoes === 0) {
      motivos.push('Primeira designação');
    } else {
      motivos.push(`Rotação justa (${estudante.contador_designacoes} designações anteriores)`);
    }
    
    return motivos.join(', ') || 'Seleção baseada em qualificações';
  }

  /**
   * Calcula distribuição de designações por cargo
   */
  calcularDistribuicaoPorCargo(resultados) {
    const distribuicao = {};
    
    resultados.forEach(resultado => {
      const cargo = resultado.estudante_principal.cargo;
      distribuicao[cargo] = (distribuicao[cargo] || 0) + 1;
      
      if (resultado.ajudante) {
        const cargoAjudante = resultado.ajudante.cargo;
        distribuicao[cargoAjudante] = (distribuicao[cargoAjudante] || 0) + 1;
      }
    });
    
    return distribuicao;
  }
}

// Constantes das regras S-38
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
  },
  
  following_up: {
    qualificacao_necessaria: 'following',
    precisa_ajudante: true,
    ajudante_mesmo_genero: true,
    excluir_menores: false,
    rotacao_justa: true
  },
  
  making_disciples: {
    qualificacao_necessaria: 'making',
    precisa_ajudante: true,
    ajudante_mesmo_genero: true,
    excluir_menores: false,
    rotacao_justa: true
  },
  
  explaining_beliefs: {
    qualificacao_necessaria: 'explaining',
    precisa_ajudante: true,
    ajudante_mesmo_genero: true,
    ajudante_familia: true,
    excluir_menores: false,
    rotacao_justa: true
  },
  
  talk: {
    genero: 'masculino',
    qualificacao_necessaria: 'talk',
    precisa_ajudante: false,
    excluir_menores: false,
    rotacao_justa: true
  }
};

// =====================================================
// ROTAS DA API DE DESIGNAÇÕES
// =====================================================

const router = express.Router();
const algoritmo = new AlgoritmoDesignacoes();

// GET /api/designacoes - Listar designações existentes
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('assignment_history')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar designações:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// POST /api/designacoes/generate - Gerar novas designações
router.post('/generate', async (req, res) => {
  try {
    const { semana, data_reuniao, partes_customizadas } = req.body;
    
    console.log(`🔄 Iniciando geração de designações para a semana ${semana}...`);
    
    // 1. Buscar todos os estudantes ativos
    const { data: estudantesData, error: estudantesError } = await supabase
      .from('vw_estudantes_grid')
      .select('*')
      .eq('ativo', true);
    
    if (estudantesError) throw estudantesError;
    
    // 2. Converter dados para o formato do algoritmo
    const estudantes = algoritmo.converterDadosPlanilha(estudantesData);
    
    // 3. Definir partes da reunião (padrão ou customizadas)
    const partesReuniao = partes_customizadas || [
      {
        id: '1',
        tipo: 'opening_comments',
        titulo: 'Comentários Iniciais',
        minutos: 1,
        regras: REGRAS_S38.opening_comments,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '2',
        tipo: 'treasures_talk',
        titulo: 'Tesouros da Palavra de Deus',
        minutos: 10,
        regras: REGRAS_S38.treasures_talk,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '3',
        tipo: 'spiritual_gems',
        titulo: 'Joias Espirituais',
        minutos: 10,
        regras: REGRAS_S38.spiritual_gems,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '4',
        tipo: 'bible_reading',
        titulo: 'Leitura da Bíblia',
        minutos: 4,
        regras: REGRAS_S38.bible_reading,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '5',
        tipo: 'starting_conversation',
        titulo: 'Iniciando Conversas',
        minutos: 3,
        regras: REGRAS_S38.starting_conversation,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '6',
        tipo: 'following_up',
        titulo: 'Revisitas',
        minutos: 4,
        regras: REGRAS_S38.following_up,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '7',
        tipo: 'making_disciples',
        titulo: 'Fazendo Discípulos',
        minutos: 5,
        regras: REGRAS_S38.making_disciples,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '8',
        tipo: 'explaining_beliefs',
        titulo: 'Explicando Suas Crenças',
        minutos: 5,
        regras: REGRAS_S38.explaining_beliefs,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '9',
        tipo: 'talk',
        titulo: 'Discurso',
        minutos: 5,
        regras: REGRAS_S38.talk,
        semana,
        data: new Date(data_reuniao)
      }
    ];
    
    // 4. Executar algoritmo de designação
    console.log(`📊 ${estudantes.length} estudantes disponíveis`);
    console.log(`📋 ${partesReuniao.length} partes para designar`);
    
    const { resultados, estatisticas } = algoritmo.gerarDesignacoes(estudantes, partesReuniao);
    
    // 5. Salvar resultados no banco de dados
    const designacoesSalvar = resultados.map(resultado => ({
      week: semana,
      meeting_date: data_reuniao,
      assignment_type: resultado.parte.tipo,
      assignment_title: resultado.parte.titulo,
      student_id: resultado.estudante_principal.id,
      student_name: resultado.estudante_principal.nome,
      assistant_id: resultado.ajudante?.id || null,
      assistant_name: resultado.ajudante?.nome || null,
      assignment_duration: resultado.parte.minutos,
      selection_reason: resultado.motivo_escolha,
      alternatives_considered: resultado.alternativas_consideradas,
      created_at: new Date().toISOString()
    }));
    
    const { data: designacoesSalvas, error: salvarError } = await supabase
      .from('assignment_history')
      .insert(designacoesSalvar)
      .select();
    
    if (salvarError) throw salvarError;
    
    // 6. Log de estatísticas
    console.log('✅ Designações geradas com sucesso!');
    console.log(`📊 Estatísticas:`);
    console.log(`   - Total de partes designadas: ${estatisticas.total_partes_designadas}`);
    console.log(`   - Estudantes sem designação: ${estatisticas.estudantes_sem_designacao.length}`);
    console.log(`   - Conflitos encontrados: ${estatisticas.conflitos_encontrados.length}`);
    
    if (estatisticas.conflitos_encontrados.length > 0) {
      console.log('⚠️ Conflitos encontrados:');
      estatisticas.conflitos_encontrados.forEach(conflito => {
        console.log(`   - ${conflito}`);
      });
    }
    
    res.json({
      success: true,
      message: 'Designações geradas com sucesso',
      data: {
        designacoes: designacoesSalvas,
        estatisticas,
        resultados_completos: resultados
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao gerar designações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar designações',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/designacoes/week/:semana - Buscar designações de uma semana específica
router.get('/week/:semana', async (req, res) => {
  try {
    const { semana } = req.params;
    
    const { data, error } = await supabase
      .from('assignment_history')
      .select('*')
      .eq('week', semana)
      .order('assignment_type');
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar designações da semana:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// POST /api/designacoes/validate - Validar regras S-38 sem salvar
router.post('/validate', async (req, res) => {
  try {
    const { estudante_id, parte_tipo, ajudante_id } = req.body;
    
    // Buscar dados do estudante
    const { data: estudanteData, error: estudanteError } = await supabase
      .from('vw_estudantes_grid')
      .select('*')
      .eq('user_id', estudante_id)
      .single();
    
    if (estudanteError) throw estudanteError;
    
    const estudante = algoritmo.converterDadosPlanilha([estudanteData])[0];
    const regras = REGRAS_S38[parte_tipo];
    
    if (!regras) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de parte não reconhecido'
      });
    }
    
    // Validar elegibilidade
    const elegivel = algoritmo.filtrarCandidatos([estudante], regras).length > 0;
    
    // Validar ajudante se fornecido
    let ajudanteValido = true;
    if (ajudante_id && regras.precisa_ajudante) {
      const { data: ajudanteData, error: ajudanteError } = await supabase
        .from('vw_estudantes_grid')
        .select('*')
        .eq('user_id', ajudante_id)
        .single();
      
      if (!ajudanteError) {
        const ajudante = algoritmo.converterDadosPlanilha([ajudanteData])[0];
        const ajudanteElegivel = algoritmo.encontrarAjudante(estudante, [ajudante], regras);
        ajudanteValido = ajudanteElegivel !== null;
      }
    }
    
    res.json({
      success: true,
      valido: elegivel && ajudanteValido,
      motivos: {
        estudante_elegivel: elegivel,
        ajudante_valido: ajudanteValido,
        regras_aplicadas: Object.keys(regras)
      }
    });
    
  } catch (error) {
    console.error('Erro ao validar designação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// DELETE /api/designacoes/:id - Cancelar designação
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('assignment_history')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: 'Designação cancelada com sucesso',
      data 
    });
  } catch (error) {
    console.error('Erro ao cancelar designação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

module.exports = router;