import { 
  Estudante, 
  ParteReuniao, 
  RegrasDesignacao, 
  ResultadoDesignacao, 
  EstatisticasDesignacao,
  REGRAS_S38 
} from '../types/designacao';

/**
 * Algoritmo Central de Designações - Sistema Ministerial
 * 
 * Este algoritmo implementa as regras oficiais S-38 da organização
 * para distribuir as partes da reunião de forma justa e conforme as diretrizes.
 */
export class AlgoritmoDesignacoes {

  /**
   * Filtra candidatos elegíveis baseado nas regras da parte
   */
  private filtrarCandidatos(estudantes: Estudante[], regras: RegrasDesignacao): Estudante[] {
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
      const qualificacao = regras.qualificacao_necessaria as keyof typeof estudante.qualificacoes;
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
  private selecionarMelhorCandidato(candidatos: Estudante[], regras: RegrasDesignacao): Estudante | null {
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
  private encontrarAjudante(
    estudantePrincipal: Estudante, 
    candidatos: Estudante[], 
    regras: RegrasDesignacao
  ): Estudante | null {
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
  private calcularIdade(dataNascimento: Date): number {
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
  public gerarDesignacoes(
    estudantes: Estudante[], 
    partes: ParteReuniao[]
  ): { resultados: ResultadoDesignacao[], estatisticas: EstatisticasDesignacao } {
    
    const resultados: ResultadoDesignacao[] = [];
    const conflitos: string[] = [];
    const estudantesUsados = new Set<string>();
    
    // Clonar estudantes para não modificar o array original
    const estudantesClone = estudantes.map(e => ({ ...e }));

    for (const parte of partes) {
      // Obter regras para este tipo de parte
      const regras = REGRAS_S38[parte.tipo] || parte.regras;
      
      // Filtrar candidatos elegíveis
      const candidatos = this.filtrarCandidatos(estudantesClone, regras);
      const candidatosDisponiveis = candidatos.filter(c => !estudantesUsados.has(c.id));
      
      if (candidatosDisponiveis.length === 0) {
        conflitos.push(`Nenhum candidato disponível para ${parte.titulo}`);
        continue;
      }

      // Selecionar estudante principal
      const estudantePrincipal = this.selecionarMelhorCandidato(candidatosDisponiveis, regras);
      
      if (!estudantePrincipal) {
        conflitos.push(`Falha ao selecionar candidato para ${parte.titulo}`);
        continue;
      }

      // Buscar ajudante se necessário
      let ajudante: Estudante | null = null;
      if (regras.precisa_ajudante) {
        const candidatosAjudante = candidatos.filter(c => 
          !estudantesUsados.has(c.id) && c.id !== estudantePrincipal.id
        );
        ajudante = this.encontrarAjudante(estudantePrincipal, candidatosAjudante, regras);
        
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
        motivo_escolha: this.gerarMotivoEscolha(estudantePrincipal, regras),
        alternativas_consideradas: candidatosDisponiveis.length
      });
    }

    // Gerar estatísticas
    const estatisticas: EstatisticasDesignacao = {
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
  private gerarMotivoEscolha(estudante: Estudante, regras: RegrasDesignacao): string {
    const motivos: string[] = [];
    
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
  private calcularDistribuicaoPorCargo(resultados: ResultadoDesignacao[]): Record<string, number> {
    const distribuicao: Record<string, number> = {};
    
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

  /**
   * Converte dados da planilha para o formato do algoritmo
   */
  public converterDadosPlanilha(dadosPlanilha: any[]): Estudante[] {
    return dadosPlanilha.map((linha, index) => ({
      id: linha.user_id || `estudante_${index}`,
      nome: linha.nome,
      genero: linha.genero as 'masculino' | 'feminino',
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
}

export default AlgoritmoDesignacoes;