// deno-lint-ignore-file
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare Deno namespace for TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// S-38 Assignment Rules (Official JW Organization Rules)
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
    qualificacao_necessaria: 'treasures',
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
  
  explaining_beliefs_talk: {
    genero: 'masculino',
    qualificacao_necessaria: 'explaining',
    precisa_ajudante: false,
    excluir_menores: false,
    rotacao_justa: true
  },
  
  explaining_beliefs_demo: {
    qualificacao_necessaria: 'explaining',
    precisa_ajudante: true,
    ajudante_mesmo_genero: true,
    ajudante_familia: true,
    excluir_menores: false,
    rotacao_justa: true
  },
  
  congregation_study: {
    genero: 'masculino',
    cargos_permitidos: ['anciao'],
    qualificacao_necessaria: 'talk',
    precisa_ajudante: false,
    apenas_batizados: true,
    priorizar_ancioes: true,
    rotacao_justa: true
  }
};

/**
 * Assignment Algorithm Class - Implements S-38 Rules
 */
class AlgoritmoDesignacoes {
  
  /**
   * Convert spreadsheet data to algorithm format
   */
  converterDadosPlanilha(dadosPlanilha) {
    return dadosPlanilha.map((linha) => ({
      id: linha.id, // Use the actual database ID
      nome: `${linha.nome} ${linha.sobrenome || ''}`.trim(),
      genero: linha.genero,
      cargo: linha.privilegio || linha.cargo,
      ativo: linha.ativo === true || linha.ativo === 'TRUE',
      menor: linha.menor === true || linha.menor === 'TRUE',
      familia_id: linha.family_id || linha.familia_id || linha.familia,
      qualificacoes: {
        chairman: linha.chairman === true,
        pray: linha.pray === true,
        treasures: linha.treasures === true,
        gems: linha.gems === true,
        reading: linha.reading === true,
        starting: linha.starting === true,
        following: linha.following === true,
        making: linha.making === true,
        explaining: linha.explaining === true,
        talk: linha.talk === true,
      },
      ultima_designacao: undefined,
      contador_designacoes: 0,
      designacoes_recentes: 0,
      data_nascimento: linha.data_nascimento ? new Date(linha.data_nascimento) : new Date('1990-01-01'),
      responsavel_primario: linha.responsavel_primario,
      responsavel_secundario: linha.responsavel_secundario
    }));
  }

  /**
   * Filter eligible candidates based on part rules
   */
  filtrarCandidatos(estudantes, regras) {
    return estudantes.filter(estudante => {
      // 1. Must be active
      if (!estudante.ativo) return false;

      // 2. Gender filter
      if (regras.genero && estudante.genero !== regras.genero) return false;

      // 3. Role filter
      if (regras.cargos_permitidos && !regras.cargos_permitidos.includes(estudante.cargo)) return false;

      // 4. Check required qualification
      const qualificacao = regras.qualificacao_necessaria;
      if (!estudante.qualificacoes[qualificacao]) return false;

      // 5. Age filter - exclude minors if necessary
      if (regras.excluir_menores && estudante.menor) return false;

      // 6. Baptism filter
      if (regras.apenas_batizados) {
        const cargosBatizados = [
          'anciao', 'servo_ministerial', 'pioneiro_regular', 
          'pioneira_regular', 'publicador_batizado', 'publicadora_batizada'
        ];
        if (!cargosBatizados.includes(estudante.cargo)) return false;
      }

      return true;
    });
  }

  /**
   * Select best candidate based on priorities and fair rotation
   */
  selecionarMelhorCandidato(candidatos, regras) {
    if (candidatos.length === 0) return null;

    // Apply role priorities
    let candidatosPriorizados = [...candidatos];

    if (regras.priorizar_ancioes) {
      const ancioes = candidatos.filter(c => c.cargo === 'anciao');
      if (ancioes.length > 0) candidatosPriorizados = ancioes;
    }

    if (regras.priorizar_servos && candidatosPriorizados.length === candidatos.length) {
      const servos = candidatos.filter(c => c.cargo === 'servo_ministerial');
      if (servos.length > 0) candidatosPriorizados = servos;
    }

    // Apply fair rotation - who has fewer assignments goes first
    if (regras.rotacao_justa) {
      candidatosPriorizados.sort((a, b) => {
        // Primary sort: fewer total assignments first
        if (a.contador_designacoes !== b.contador_designacoes) {
          return a.contador_designacoes - b.contador_designacoes;
        }
        
        // Secondary sort: fewer recent assignments first
        if (a.designacoes_recentes !== b.designacoes_recentes) {
          return a.designacoes_recentes - b.designacoes_recentes;
        }
        
        // Tertiary sort: older last assignment first
        if (a.ultima_designacao && b.ultima_designacao) {
          return a.ultima_designacao.localeCompare(b.ultima_designacao);
        }
        
        if (!a.ultima_designacao && b.ultima_designacao) return -1;
        if (a.ultima_designacao && !b.ultima_designacao) return 1;
        
        return 0;
      });
    }

    return candidatosPriorizados[0];
  }

  /**
   * Find suitable assistant for the part
   */
  encontrarAjudante(estudantePrincipal, candidatos, regras) {
    if (!regras.precisa_ajudante) return null;

    // Filter valid assistants
    let ajudantesValidos = candidatos.filter(candidato => {
      if (candidato.id === estudantePrincipal.id) return false;

      if (regras.ajudante_mesmo_genero && candidato.genero !== estudantePrincipal.genero) return false;

      if (regras.ajudante_familia) {
        const mesmoGenero = candidato.genero === estudantePrincipal.genero;
        const mesmaFamilia = candidato.familia_id === estudantePrincipal.familia_id;
        
        if (!mesmoGenero && !mesmaFamilia) return false;
      }

      return true;
    });

    // Prioritize family if available
    if (regras.ajudante_familia) {
      const familiares = ajudantesValidos.filter(a => a.familia_id === estudantePrincipal.familia_id);
      if (familiares.length > 0) ajudantesValidos = familiares;
    }

    // Apply fair rotation for assistants too
    ajudantesValidos.sort((a, b) => a.contador_designacoes - b.contador_designacoes);

    return ajudantesValidos[0] || null;
  }

  /**
   * Generate assignments for a complete week
   */
  gerarDesignacoes(estudantes: any[], partes: any[]) {
    const resultados: any[] = [];
    const conflitos: string[] = [];
    const estudantesUsados = new Set<string>();
    
    // Clone students to avoid modifying original array
    const estudantesClone = estudantes.map(e => ({ ...e }));

    for (const parte of partes) {
      // Filter eligible candidates
      const candidatos = this.filtrarCandidatos(estudantesClone, parte.regras);
      const candidatosDisponiveis = candidatos.filter(c => !estudantesUsados.has(c.id));
      
      if (candidatosDisponiveis.length === 0) {
        conflitos.push(`No available candidate for ${parte.titulo}`);
        continue;
      }

      // Select main student
      const estudantePrincipal = this.selecionarMelhorCandidato(candidatosDisponiveis, parte.regras);
      
      if (!estudantePrincipal) {
        conflitos.push(`Failed to select candidate for ${parte.titulo}`);
        continue;
      }

      // Find assistant if needed
      let ajudante: any = null;
      if (parte.regras.precisa_ajudante) {
        const candidatosAjudante = candidatos.filter(c => 
          !estudantesUsados.has(c.id) && c.id !== estudantePrincipal.id
        );
        ajudante = this.encontrarAjudante(estudantePrincipal, candidatosAjudante, parte.regras);
        
        if (!ajudante) {
          conflitos.push(`No assistant available for ${parte.titulo}`);
        }
      }

      // Update counters and markers
      estudantePrincipal.contador_designacoes = (estudantePrincipal.contador_designacoes || 0) + 1;
      estudantePrincipal.ultima_designacao = parte.titulo;
      estudantesUsados.add(estudantePrincipal.id);
      
      if (ajudante) {
        ajudante.contador_designacoes = (ajudante.contador_designacoes || 0) + 1;
        ajudante.ultima_designacao = `${parte.titulo} (assistant)`;
        estudantesUsados.add(ajudante.id);
      }

      // Record result
      resultados.push({
        parte,
        estudante_principal: estudantePrincipal,
        ajudante: ajudante || undefined,
        motivo_escolha: this.gerarMotivoEscolha(estudantePrincipal, parte.regras),
        alternativas_consideradas: candidatosDisponiveis.length
      });
    }

    // Generate statistics
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
   * Generate explanation for selection reason
   */
  gerarMotivoEscolha(estudante: any, regras: any) {
    const motivos: string[] = [];
    
    if (regras.priorizar_ancioes && estudante.cargo === 'anciao') {
      motivos.push('Priority for elders');
    }
    
    if (regras.priorizar_servos && estudante.cargo === 'servo_ministerial') {
      motivos.push('Priority for ministerial servants');
    }
    
    if (estudante.contador_designacoes === 0 || (estudante.contador_designacoes === 1 && !estudante.ultima_designacao)) {
      motivos.push('First assignment');
    } else {
      motivos.push(`Fair rotation (${estudante.contador_designacoes || 0} previous assignments)`);
    }
    
    // Add recent assignment info if available
    if (estudante.designacoes_recentes > 0) {
      motivos.push(`${estudante.designacoes_recentes} recent assignments`);
    }
    
    return motivos.join(', ') || 'Selection based on qualifications';
  }

  /**
   * Calculate assignment distribution by role
   */
  calcularDistribuicaoPorCargo(resultados: any[]) {
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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { semana, data_reuniao, partes_customizadas } = await req.json();
    
    console.log(`🔄 Starting assignment generation for week ${semana}...`);
    
    // 1. Fetch all active students
    const { data: estudantesData, error: estudantesError } = await supabase
      .from('vw_estudantes_grid')
      .select('*')
      .eq('ativo', true);
    
    if (estudantesError) {
      console.error('Student fetch error:', estudantesError);
      throw estudantesError;
    }
    
    // 2. Fetch assignment history for fairness calculations (last 90 days)
    const { data: historicoData, error: historicoError } = await supabase
      .from('assignment_history')
      .select('student_id, assistant_id, created_at, assignment_type')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
    
    if (historicoError) {
      console.warn('History fetch warning:', historicoError);
    }
    
    // 3. Convert data to algorithm format
    const algoritmo = new AlgoritmoDesignacoes();
    const estudantes = algoritmo.converterDadosPlanilha(estudantesData);
    
    // 4. Enhance student data with assignment history for fairness
    if (historicoData) {
      estudantes.forEach(estudante => {
        // Count total assignments
        const totalAssignments = historicoData.filter(a => 
          a.student_id === estudante.id || a.assistant_id === estudante.id
        ).length;
        
        // Count recent assignments (last 30 days)
        const recentAssignments = historicoData.filter(a => {
          const assignmentDate = new Date(a.created_at);
          const daysSince = Math.floor((Date.now() - assignmentDate.getTime()) / (1000 * 60 * 60 * 24));
          return (a.student_id === estudante.id || a.assistant_id === estudante.id) && daysSince < 30;
        }).length;
        
        // Add history data to student object
        estudante.contador_designacoes = totalAssignments;
        estudante.designacoes_recentes = recentAssignments;
      });
    }
    
    // 5. Define meeting parts (default or custom)
    const partesReuniao = partes_customizadas || [
      {
        id: '1',
        tipo: 'opening_comments',
        titulo: 'Opening Comments',
        minutos: 1,
        regras: REGRAS_S38.opening_comments,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '2',
        tipo: 'treasures_talk',
        titulo: 'Treasures From God\'s Word',
        minutos: 10,
        regras: REGRAS_S38.treasures_talk,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '3',
        tipo: 'spiritual_gems',
        titulo: 'Spiritual Gems',
        minutos: 10,
        regras: REGRAS_S38.spiritual_gems,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '4',
        tipo: 'bible_reading',
        titulo: 'Bible Reading',
        minutos: 4,
        regras: REGRAS_S38.bible_reading,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '5',
        tipo: 'starting_conversation',
        titulo: 'Initial Call',
        minutos: 3,
        regras: REGRAS_S38.starting_conversation,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '6',
        tipo: 'following_up',
        titulo: 'Return Visit',
        minutos: 4,
        regras: REGRAS_S38.following_up,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '7',
        tipo: 'making_disciples',
        titulo: 'Bible Study',
        minutos: 5,
        regras: REGRAS_S38.making_disciples,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '8',
        tipo: 'explaining_beliefs_demo',
        titulo: 'Talk',
        minutos: 5,
        regras: REGRAS_S38.explaining_beliefs_demo,
        semana,
        data: new Date(data_reuniao)
      },
      {
        id: '9',
        tipo: 'congregation_study',
        titulo: 'Congregation Bible Study',
        minutos: 30,
        regras: REGRAS_S38.congregation_study,
        semana,
        data: new Date(data_reuniao)
      }
    ];
    
    // 6. Execute assignment algorithm
    console.log(`📊 ${estudantes.length} students available`);
    console.log(`📋 ${partesReuniao.length} parts to assign`);
    
    const { resultados, estatisticas } = algoritmo.gerarDesignacoes(estudantes, partesReuniao);
    
    // 7. Save results to database
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
    
    if (salvarError) {
      console.error('Save error:', salvarError);
      throw salvarError;
    }
    
    // 8. Log statistics
    console.log('✅ Assignments generated successfully!');
    console.log(`📊 Statistics:`);
    console.log(`   - Total parts assigned: ${estatisticas.total_partes_designadas}`);
    console.log(`   - Students without assignment: ${estatisticas.estudantes_sem_designacao.length}`);
    console.log(`   - Conflicts found: ${estatisticas.conflitos_encontrados.length}`);
    
    if (estatisticas.conflitos_encontrados.length > 0) {
      console.log('⚠️ Conflicts found:');
      estatisticas.conflitos_encontrados.forEach(conflito => {
        console.log(`   - ${conflito}`);
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Assignments generated successfully',
        data: {
          designacoes: designacoesSalvas,
          estatisticas,
          resultados_completos: resultados
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Error generating assignments',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});