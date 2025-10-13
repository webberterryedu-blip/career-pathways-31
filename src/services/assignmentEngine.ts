/**
 * Assignment Generation Engine
 * 
 * This module implements the core assignment generation algorithm following S-38 rules
 * for Christian Life and Ministry Meeting assignments. It handles:
 * - S-38 rule enforcement (gender requirements, qualifications)
 * - Assistant assignment logic (same gender or family members)
 * - Balanced distribution considering student experience and availability
 * - Conflict detection and resolution
 */

import type { 
  DesignacaoGerada,
  ParteProgramaS38T,
  OpcoesDegeracao,
  ResultadoGeracao,
  EstatisticasDesignacao,
  ConflitosDesignacao,
  HistoricoDesignacao,
  TipoParteS38T
} from '@/types/designacoes';

import type { 
  EstudanteRow,
  StudentQualifications,
  Genero,
  Cargo
} from '@/types/estudantes';

// S-38 Rule Constants
const S38_RULES = {
  // Part 3 (Bible Reading) - Men only
  BIBLE_READING_MEN_ONLY: 'bible_reading_men_only',
  
  // Parts 4-7 - Gender and qualification requirements
  TALKS_QUALIFIED_MEN_ONLY: 'talks_qualified_men_only',
  DEMONSTRATIONS_BOTH_GENDERS: 'demonstrations_both_genders',
  
  // Assistant requirements
  SAME_GENDER_ASSISTANTS: 'same_gender_assistants',
  FAMILY_MEMBER_DIFFERENT_GENDER: 'family_member_different_gender',
  MINORS_SAME_GENDER_ONLY: 'minors_same_gender_only',
  
  // Distribution rules
  BALANCED_8_WEEK_DISTRIBUTION: 'balanced_8_week_distribution',
  ACTIVE_STUDENTS_ONLY: 'active_students_only',
  NO_CONSECUTIVE_WEEKS: 'no_consecutive_weeks'
} as const;

// Qualified positions for talks
const QUALIFIED_POSITIONS: Cargo[] = [
  'anciao',
  'servo_ministerial', 
  'publicador_batizado'
];

interface StudentCandidate {
  student: EstudanteRow;
  qualifications: StudentQualifications;
  assignmentHistory: HistoricoDesignacao;
  priority: number;
  availableAsAssistant: boolean;
  familyMembers: string[]; // IDs of family members
}

interface AssignmentCandidate {
  student: StudentCandidate;
  assistant?: StudentCandidate;
  part: ParteProgramaS38T;
  score: number;
  conflicts: string[];
  warnings: string[];
}

/**
 * Core Assignment Generation Engine
 */
export class AssignmentEngine {
  private students: StudentCandidate[] = [];
  private familyRelationships: Map<string, string[]> = new Map();
  private weekDate: string = '';
  private excludedStudentIds: Set<string> = new Set();

  /**
   * Initialize the engine with student data and options
   */
  async initialize(
    students: EstudanteRow[],
    studentQualifications: Map<string, StudentQualifications>,
    assignmentHistories: Map<string, HistoricoDesignacao>,
    familyRelationships: Map<string, string[]>,
    options: OpcoesDegeracao
  ): Promise<void> {
    this.weekDate = options.data_inicio_semana;
    this.excludedStudentIds = new Set(options.excluir_estudante_ids || []);
    this.familyRelationships = familyRelationships;

    // Build student candidates
    this.students = students
      .filter(student => student.ativo && !this.excludedStudentIds.has(student.id))
      .map(student => {
        const qualifications = studentQualifications.get(student.id) || this.getDefaultQualifications(student);
        const history = assignmentHistories.get(student.id) || this.getEmptyHistory(student.id);
        const priority = this.calculateStudentPriority(history, student);
        const familyMembers = familyRelationships.get(student.id) || [];

        return {
          student,
          qualifications,
          assignmentHistory: history,
          priority,
          availableAsAssistant: this.canBeAssistant(student, qualifications),
          familyMembers
        };
      });
  }

  /**
   * Generate assignments for all parts in the program
   */
  async generateAssignments(parts: ParteProgramaS38T[]): Promise<ResultadoGeracao> {
    const designacoes: DesignacaoGerada[] = [];
    const erros: string[] = [];
    const avisos: string[] = [];
    const conflitos: ConflitosDesignacao[] = [];

    // Sort parts by difficulty/priority (Bible reading first, then talks, then demonstrations)
    const sortedParts = this.sortPartsByPriority(parts);

    for (const part of sortedParts) {
      try {
        const assignment = await this.generateSingleAssignment(part, designacoes);
        
        if (assignment) {
          designacoes.push(assignment);
          
          // Mark students as assigned for this week to avoid overloading
          this.markStudentAsAssigned(assignment.id_estudante);
          if (assignment.id_ajudante) {
            this.markStudentAsAssigned(assignment.id_ajudante);
          }
        } else {
          erros.push(`Não foi possível gerar designação para a parte ${part.numero_parte}: ${part.titulo_parte}`);
        }
      } catch (error) {
        erros.push(`Erro ao gerar designação para a parte ${part.numero_parte}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    // Detect conflicts in generated assignments
    const detectedConflicts = this.detectAssignmentConflicts(designacoes);
    conflitos.push(...detectedConflicts);

    // Generate statistics
    const estatisticas = this.generateStatistics(designacoes);

    return {
      sucesso: erros.length === 0,
      designacoes,
      erros,
      avisos,
      estatisticas
    };
  }

  /**
   * Generate a single assignment for a specific part
   */
  private async generateSingleAssignment(
    part: ParteProgramaS38T,
    existingAssignments: DesignacaoGerada[]
  ): Promise<DesignacaoGerada | null> {
    // Get eligible candidates for this part
    const candidates = this.getEligibleCandidates(part, existingAssignments);
    
    if (candidates.length === 0) {
      return null;
    }

    // Score and rank candidates
    const scoredCandidates = candidates.map(candidate => 
      this.scoreCandidate(candidate, part, existingAssignments)
    );

    // Sort by score (highest first)
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Try to assign the best candidate
    for (const candidate of scoredCandidates) {
      if (candidate.conflicts.length === 0) {
        return this.createAssignment(candidate, part);
      }
    }

    // If no conflict-free candidate, try the best one with warnings only
    const bestCandidateWithWarnings = scoredCandidates.find(c => 
      c.conflicts.length === 0 && c.warnings.length > 0
    );

    if (bestCandidateWithWarnings) {
      return this.createAssignment(bestCandidateWithWarnings, part);
    }

    return null;
  }

  /**
   * Get eligible candidates for a specific part type
   */
  private getEligibleCandidates(
    part: ParteProgramaS38T,
    existingAssignments: DesignacaoGerada[]
  ): AssignmentCandidate[] {
    const assignedStudentIds = new Set(
      existingAssignments.flatMap(a => [a.id_estudante, a.id_ajudante].filter(Boolean))
    );

    const candidates: AssignmentCandidate[] = [];

    for (const studentCandidate of this.students) {
      // Skip if already assigned this week
      if (assignedStudentIds.has(studentCandidate.student.id)) {
        continue;
      }

      // Check basic eligibility
      if (!this.isStudentEligibleForPart(studentCandidate, part)) {
        continue;
      }

      // Find assistant if needed
      let assistant: StudentCandidate | undefined;
      if (part.requer_ajudante) {
        assistant = this.findBestAssistant(studentCandidate, part, assignedStudentIds);
        if (!assistant) {
          continue; // Skip if no suitable assistant found
        }
      }

      candidates.push({
        student: studentCandidate,
        assistant,
        part,
        score: 0, // Will be calculated later
        conflicts: [],
        warnings: []
      });
    }

    return candidates;
  }

  /**
   * Check if a student is eligible for a specific part type
   */
  private isStudentEligibleForPart(candidate: StudentCandidate, part: ParteProgramaS38T): boolean {
    const { student, qualifications } = candidate;

    // Check gender restrictions
    if (part.restricao_genero && student.genero !== part.restricao_genero) {
      return false;
    }

    // Check specific part type requirements
    switch (part.tipo_parte) {
      case 'leitura_biblica':
        // Part 3 - Men only
        return student.genero === 'masculino' && qualifications.bible_reading;

      case 'discurso':
        // Talks - Qualified men only
        return student.genero === 'masculino' && 
               qualifications.talk && 
               QUALIFIED_POSITIONS.includes(student.cargo as Cargo);

      case 'demonstracao':
      case 'parte_ministerio':
        // Demonstrations - Both genders
        return qualifications.demonstration;

      default:
        return true;
    }
  }

  /**
   * Find the best assistant for a student
   */
  private findBestAssistant(
    mainStudent: StudentCandidate,
    part: ParteProgramaS38T,
    assignedStudentIds: Set<string>
  ): StudentCandidate | undefined {
    const potentialAssistants = this.students.filter(candidate => {
      // Skip if already assigned
      if (assignedStudentIds.has(candidate.student.id)) {
        return false;
      }

      // Skip self
      if (candidate.student.id === mainStudent.student.id) {
        return false;
      }

      // Must be available as assistant
      if (!candidate.availableAsAssistant) {
        return false;
      }

      return true;
    });

    // Apply S-38 assistant rules
    const eligibleAssistants = potentialAssistants.filter(assistant => 
      this.isValidAssistantPairing(mainStudent, assistant, part)
    );

    if (eligibleAssistants.length === 0) {
      return undefined;
    }

    // Prefer family members, then same gender, then by priority
    eligibleAssistants.sort((a, b) => {
      // Family members first
      const aIsFamily = mainStudent.familyMembers.includes(a.student.id);
      const bIsFamily = mainStudent.familyMembers.includes(b.student.id);
      if (aIsFamily && !bIsFamily) return -1;
      if (!aIsFamily && bIsFamily) return 1;

      // Same gender preference
      const aSameGender = a.student.genero === mainStudent.student.genero;
      const bSameGender = b.student.genero === mainStudent.student.genero;
      if (aSameGender && !bSameGender) return -1;
      if (!aSameGender && bSameGender) return 1;

      // Higher priority (fewer recent assignments)
      return b.priority - a.priority;
    });

    return eligibleAssistants[0];
  }

  /**
   * Check if an assistant pairing is valid according to S-38 rules
   */
  private isValidAssistantPairing(
    mainStudent: StudentCandidate,
    assistant: StudentCandidate,
    part: ParteProgramaS38T
  ): boolean {
    const mainGender = mainStudent.student.genero;
    const assistantGender = assistant.student.genero;
    const isMainMinor = mainStudent.student.menor;
    const isAssistantMinor = assistant.student.menor;
    const areFamilyMembers = mainStudent.familyMembers.includes(assistant.student.id);

    // Rule: Minors must have same-gender assistants
    if (isMainMinor && mainGender !== assistantGender && !areFamilyMembers) {
      return false;
    }

    // Rule: Different gender pairs must be family members
    if (mainGender !== assistantGender && !areFamilyMembers) {
      return false;
    }

    // Rule: Same gender is always allowed
    if (mainGender === assistantGender) {
      return true;
    }

    // Rule: Family members can be different genders
    if (areFamilyMembers) {
      return true;
    }

    return false;
  }

  /**
   * Score a candidate assignment
   */
  private scoreCandidate(
    candidate: AssignmentCandidate,
    part: ParteProgramaS38T,
    existingAssignments: DesignacaoGerada[]
  ): AssignmentCandidate {
    let score = candidate.student.priority; // Base score from priority
    const conflicts: string[] = [];
    const warnings: string[] = [];

    // Bonus for family member assistants
    if (candidate.assistant && candidate.student.familyMembers.includes(candidate.assistant.student.id)) {
      score += 10;
    }

    // Bonus for same gender assistants
    if (candidate.assistant && candidate.student.student.genero === candidate.assistant.student.genero) {
      score += 5;
    }

    // Check for recent assignments (warning, not conflict)
    const daysSinceLastAssignment = this.getDaysSinceLastAssignment(candidate.student);
    if (daysSinceLastAssignment < 14) { // Less than 2 weeks
      warnings.push(`Estudante teve designação recente (${daysSinceLastAssignment} dias atrás)`);
      score -= 5;
    }

    // Check assistant recent assignments
    if (candidate.assistant) {
      const assistantDaysSince = this.getDaysSinceLastAssignment(candidate.assistant);
      if (assistantDaysSince < 14) {
        warnings.push(`Ajudante teve designação recente (${assistantDaysSince} dias atrás)`);
        score -= 3;
      }
    }

    // Penalty for overloaded students (more than 2 assignments in 8 weeks)
    if (candidate.student.assignmentHistory.total_designacoes_8_semanas > 2) {
      warnings.push('Estudante tem muitas designações recentes');
      score -= 10;
    }

    return {
      ...candidate,
      score,
      conflicts,
      warnings
    };
  }

  /**
   * Create assignment object from candidate
   */
  private createAssignment(candidate: AssignmentCandidate, part: ParteProgramaS38T): DesignacaoGerada {
    return {
      id_estudante: candidate.student.student.id,
      id_ajudante: candidate.assistant?.student.id,
      numero_parte: part.numero_parte,
      titulo_parte: part.titulo_parte,
      tipo_parte: part.tipo_parte,
      cena: part.cena,
      tempo_minutos: part.tempo_minutos,
      data_inicio_semana: this.weekDate,
      confirmado: false
    };
  }

  /**
   * Sort parts by assignment priority
   */
  private sortPartsByPriority(parts: ParteProgramaS38T[]): ParteProgramaS38T[] {
    return [...parts].sort((a, b) => {
      // Bible reading first (most restrictive)
      if (a.tipo_parte === 'leitura_biblica') return -1;
      if (b.tipo_parte === 'leitura_biblica') return 1;

      // Talks second (qualified men only)
      if (a.tipo_parte === 'discurso') return -1;
      if (b.tipo_parte === 'discurso') return 1;

      // Then by part number
      return a.numero_parte - b.numero_parte;
    });
  }

  /**
   * Mark student as assigned for this week
   */
  private markStudentAsAssigned(studentId: string): void {
    const student = this.students.find(s => s.student.id === studentId);
    if (student) {
      // Update assignment history to reflect new assignment
      student.assignmentHistory.total_designacoes_8_semanas += 1;
      student.assignmentHistory.ultima_designacao = this.weekDate;
      
      // Reduce priority for future assignments this session
      student.priority -= 20;
    }
  }

  /**
   * Detect conflicts in generated assignments
   */
  private detectAssignmentConflicts(assignments: DesignacaoGerada[]): ConflitosDesignacao[] {
    const conflicts: ConflitosDesignacao[] = [];

    // Check for duplicate student assignments
    const studentAssignments = new Map<string, DesignacaoGerada[]>();
    
    assignments.forEach(assignment => {
      // Track main student assignments
      if (!studentAssignments.has(assignment.id_estudante)) {
        studentAssignments.set(assignment.id_estudante, []);
      }
      studentAssignments.get(assignment.id_estudante)!.push(assignment);

      // Track assistant assignments
      if (assignment.id_ajudante) {
        if (!studentAssignments.has(assignment.id_ajudante)) {
          studentAssignments.set(assignment.id_ajudante, []);
        }
        studentAssignments.get(assignment.id_ajudante)!.push(assignment);
      }
    });

    // Check for overloaded students
    studentAssignments.forEach((studentAssignments, studentId) => {
      if (studentAssignments.length > 1) {
        conflicts.push({
          tipo: 'sobrecarga',
          estudante_id: studentId,
          numero_parte: studentAssignments[0].numero_parte,
          descricao: `Estudante tem ${studentAssignments.length} designações na mesma semana`,
          sugestao: 'Redistribuir designações para outras semanas'
        });
      }
    });

    return conflicts;
  }

  /**
   * Generate assignment statistics
   */
  private generateStatistics(assignments: DesignacaoGerada[]): EstatisticasDesignacao {
    const stats: EstatisticasDesignacao = {
      totalDesignacoes: assignments.length,
      distribuicaoPorGenero: { masculino: 0, feminino: 0 },
      distribuicaoPorCargo: {},
      estudantesComAjudante: 0,
      paresFormados: 0,
      paresFamiliares: 0
    };

    assignments.forEach(assignment => {
      const student = this.students.find(s => s.student.id === assignment.id_estudante);
      if (student) {
        // Gender distribution
        stats.distribuicaoPorGenero[student.student.genero as Genero]++;

        // Cargo distribution
        const cargo = student.student.cargo || 'unknown';
        stats.distribuicaoPorCargo[cargo] = (stats.distribuicaoPorCargo[cargo] || 0) + 1;

        // Assistant statistics
        if (assignment.id_ajudante) {
          stats.estudantesComAjudante++;
          stats.paresFormados++;

          // Check if family pair
          if (student.familyMembers.includes(assignment.id_ajudante)) {
            stats.paresFamiliares++;
          }
        }
      }
    });

    return stats;
  }

  /**
   * Calculate student priority based on assignment history
   */
  private calculateStudentPriority(history: HistoricoDesignacao, student: EstudanteRow): number {
    let priority = 100; // Base priority

    // Reduce priority based on recent assignments
    priority -= history.total_designacoes_8_semanas * 15;

    // Bonus for students who haven't had assignments recently
    if (history.ultima_designacao) {
      const daysSince = this.getDaysSinceDate(history.ultima_designacao);
      priority += Math.min(daysSince, 56); // Max 8 weeks bonus
    } else {
      priority += 56; // Never assigned bonus
    }

    // Small bonus for active students
    if (student.ativo) {
      priority += 5;
    }

    return Math.max(0, priority);
  }

  /**
   * Get days since last assignment for a student
   */
  private getDaysSinceLastAssignment(candidate: StudentCandidate): number {
    if (!candidate.assignmentHistory.ultima_designacao) {
      return 999; // Never assigned
    }
    return this.getDaysSinceDate(candidate.assignmentHistory.ultima_designacao);
  }

  /**
   * Get days since a specific date
   */
  private getDaysSinceDate(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if student can be an assistant
   */
  private canBeAssistant(student: EstudanteRow, qualifications: StudentQualifications): boolean {
    return student.ativo && qualifications.can_be_helper;
  }

  /**
   * Get default qualifications for a student based on their profile
   */
  private getDefaultQualifications(student: EstudanteRow): StudentQualifications {
    const isMale = student.genero === 'masculino';
    const isQualified = QUALIFIED_POSITIONS.includes(student.cargo as Cargo);

    return {
      bible_reading: isMale, // Part 3 - Men only
      initial_call: true,     // Everyone can do initial calls
      return_visit: true,     // Everyone can do return visits
      bible_study: isMale && isQualified, // Qualified men only
      talk: isMale && isQualified,        // Qualified men only
      demonstration: true,    // Everyone can do demonstrations
      can_be_helper: true,    // Everyone can be helpers
      can_teach_others: isQualified // Only qualified positions
    };
  }

  /**
   * Get empty assignment history for a student
   */
  private getEmptyHistory(studentId: string): HistoricoDesignacao {
    return {
      estudante_id: studentId,
      designacoes_recentes: [],
      total_designacoes_8_semanas: 0,
      ultima_designacao: undefined
    };
  }
}

/**
 * Factory function to create and initialize assignment engine
 */
export async function createAssignmentEngine(
  students: EstudanteRow[],
  studentQualifications: Map<string, StudentQualifications>,
  assignmentHistories: Map<string, HistoricoDesignacao>,
  familyRelationships: Map<string, string[]>,
  options: OpcoesDegeracao
): Promise<AssignmentEngine> {
  const engine = new AssignmentEngine();
  await engine.initialize(
    students,
    studentQualifications,
    assignmentHistories,
    familyRelationships,
    options
  );
  return engine;
}

/**
 * Convenience function to generate assignments
 */
export async function generateAssignments(
  students: EstudanteRow[],
  studentQualifications: Map<string, StudentQualifications>,
  assignmentHistories: Map<string, HistoricoDesignacao>,
  familyRelationships: Map<string, string[]>,
  options: OpcoesDegeracao
): Promise<ResultadoGeracao> {
  const engine = await createAssignmentEngine(
    students,
    studentQualifications,
    assignmentHistories,
    familyRelationships,
    options
  );

  return engine.generateAssignments(options.partes);
}