// @ts-nocheck
/**
 * Assignment Validation System
 * 
 * This module provides comprehensive validation for meeting assignments according to S-38 rules.
 * It includes conflict detection, qualification validation, and warning systems for potential issues.
 */

import type { 
  DesignacaoGerada,
  ParteProgramaS38T,
  ConflitosDesignacao,
  ValidacaoS38T,
  TipoParteS38T
} from '@/types/designacoes';

import type { 
  EstudanteRow,
  StudentQualifications,
  Genero,
  Cargo
} from '@/types/estudantes';

// Validation rule types
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: 'qualification' | 'scheduling' | 'pairing' | 'distribution';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
  conflicts: ConflitosDesignacao[];
  score: number; // Overall assignment quality score (0-100)
}

export interface ValidationError {
  ruleId: string;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  studentId?: string;
  partNumber?: number;
  context?: Record<string, any>;
}

export interface ValidationContext {
  students: Map<string, EstudanteRow>;
  qualifications: Map<string, StudentQualifications>;
  familyRelationships: Map<string, string[]>;
  assignmentHistory: Map<string, any[]>; // Recent assignments
  weekDate: string;
  existingAssignments: DesignacaoGerada[];
}

// S-38 Validation Rules
const VALIDATION_RULES: ValidationRule[] = [
  // Qualification Rules
  {
    id: 'bible_reading_men_only',
    name: 'Bible Reading - Men Only',
    description: 'Part 3 (Bible Reading) can only be assigned to men',
    severity: 'error',
    category: 'qualification'
  },
  {
    id: 'talks_qualified_men_only',
    name: 'Talks - Qualified Men Only',
    description: 'Talks can only be assigned to qualified men (elders, ministerial servants, baptized publishers)',
    severity: 'error',
    category: 'qualification'
  },
  {
    id: 'student_must_be_active',
    name: 'Active Students Only',
    description: 'Only active students can receive assignments',
    severity: 'error',
    category: 'qualification'
  },
  {
    id: 'student_must_have_qualification',
    name: 'Student Must Be Qualified',
    description: 'Student must have the required qualification for the assignment type',
    severity: 'error',
    category: 'qualification'
  },

  // Pairing Rules
  {
    id: 'same_gender_assistants',
    name: 'Same Gender Assistants',
    description: 'Assistants should be the same gender as the main student',
    severity: 'warning',
    category: 'pairing'
  },
  {
    id: 'family_member_different_gender',
    name: 'Family Member Different Gender',
    description: 'Different gender pairs must be family members',
    severity: 'error',
    category: 'pairing'
  },
  {
    id: 'minors_same_gender_only',
    name: 'Minors Same Gender Only',
    description: 'Minors must have same-gender assistants unless they are family members',
    severity: 'error',
    category: 'pairing'
  },
  {
    id: 'assistant_must_be_qualified',
    name: 'Assistant Must Be Qualified',
    description: 'Assistant must be qualified to help with the assignment type',
    severity: 'error',
    category: 'pairing'
  },

  // Scheduling Rules
  {
    id: 'no_duplicate_assignments',
    name: 'No Duplicate Assignments',
    description: 'Students cannot have multiple assignments in the same week',
    severity: 'error',
    category: 'scheduling'
  },
  {
    id: 'no_consecutive_weeks',
    name: 'No Consecutive Weeks',
    description: 'Students should not have assignments in consecutive weeks',
    severity: 'warning',
    category: 'scheduling'
  },
  {
    id: 'recent_assignment_warning',
    name: 'Recent Assignment Warning',
    description: 'Student had an assignment within the last 2 weeks',
    severity: 'warning',
    category: 'scheduling'
  },

  // Distribution Rules
  {
    id: 'balanced_distribution',
    name: 'Balanced Distribution',
    description: 'Assignments should be distributed fairly among qualified students',
    severity: 'info',
    category: 'distribution'
  },
  {
    id: 'overloaded_student',
    name: 'Overloaded Student',
    description: 'Student has too many assignments in recent weeks',
    severity: 'warning',
    category: 'distribution'
  },
  {
    id: 'underutilized_student',
    name: 'Underutilized Student',
    description: 'Qualified student has not received assignments recently',
    severity: 'info',
    category: 'distribution'
  }
];

/**
 * Assignment Validation Engine
 */
export class AssignmentValidator {
  private context: ValidationContext;
  private rules: Map<string, ValidationRule>;

  constructor(context: ValidationContext) {
    this.context = context;
    this.rules = new Map(VALIDATION_RULES.map(rule => [rule.id, rule]));
  }

  /**
   * Validate a single assignment
   */
  validateAssignment(assignment: DesignacaoGerada): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const infos: ValidationError[] = [];
    const conflicts: ConflitosDesignacao[] = [];

    // Get student and assistant data
    const student = this.context.students.get(assignment.id_estudante);
    const assistant = assignment.id_ajudante ? this.context.students.get(assignment.id_ajudante) : undefined;
    const studentQualifications = this.context.qualifications.get(assignment.id_estudante);
    const assistantQualifications = assignment.id_ajudante ? this.context.qualifications.get(assignment.id_ajudante) : undefined;

    if (!student) {
      errors.push({
        ruleId: 'student_not_found',
        field: 'id_estudante',
        message: 'Student not found',
        severity: 'error',
        studentId: assignment.id_estudante,
        partNumber: assignment.numero_parte
      });
      return this.createValidationResult(errors, warnings, infos, conflicts);
    }

    if (!studentQualifications) {
      errors.push({
        ruleId: 'qualifications_not_found',
        field: 'qualifications',
        message: 'Student qualifications not found',
        severity: 'error',
        studentId: assignment.id_estudante,
        partNumber: assignment.numero_parte
      });
      return this.createValidationResult(errors, warnings, infos, conflicts);
    }

    // Validate qualification rules
    this.validateQualificationRules(assignment, student, studentQualifications, errors, warnings);

    // Validate pairing rules if assistant exists
    if (assignment.id_ajudante && assistant && assistantQualifications) {
      this.validatePairingRules(assignment, student, assistant, studentQualifications, assistantQualifications, errors, warnings);
    } else if (this.requiresAssistant(assignment.tipo_parte)) {
      errors.push({
        ruleId: 'missing_required_assistant',
        field: 'id_ajudante',
        message: 'This assignment type requires an assistant',
        severity: 'error',
        studentId: assignment.id_estudante,
        partNumber: assignment.numero_parte,
        suggestion: 'Assign a qualified assistant for this demonstration or ministry part'
      });
    }

    // Validate scheduling rules
    this.validateSchedulingRules(assignment, student, errors, warnings, infos);

    // Validate distribution rules
    this.validateDistributionRules(assignment, student, warnings, infos);

    // Generate conflicts
    const assignmentConflicts = this.generateConflicts(assignment, errors, warnings);
    conflicts.push(...assignmentConflicts);

    return this.createValidationResult(errors, warnings, infos, conflicts);
  }

  /**
   * Validate multiple assignments together
   */
  validateAssignments(assignments: DesignacaoGerada[]): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];
    const allInfos: ValidationError[] = [];
    const allConflicts: ConflitosDesignacao[] = [];

    // Validate each assignment individually
    assignments.forEach(assignment => {
      const result = this.validateAssignment(assignment);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      allInfos.push(...result.infos);
      allConflicts.push(...result.conflicts);
    });

    // Validate cross-assignment rules
    this.validateCrossAssignmentRules(assignments, allErrors, allWarnings, allInfos);

    return this.createValidationResult(allErrors, allWarnings, allInfos, allConflicts);
  }

  /**
   * Validate qualification rules
   */
  private validateQualificationRules(
    assignment: DesignacaoGerada,
    student: EstudanteRow,
    qualifications: StudentQualifications,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // Check if student is active
    if (!student.ativo) {
      errors.push({
        ruleId: 'student_must_be_active',
        field: 'ativo',
        message: 'Inactive students cannot receive assignments',
        severity: 'error',
        studentId: assignment.id_estudante,
        partNumber: assignment.numero_parte,
        suggestion: 'Activate the student or choose a different student'
      });
    }

    // Check part-specific qualifications
    switch (assignment.tipo_parte) {
      case 'leitura_biblica':
        if (student.genero !== 'masculino') {
          errors.push({
            ruleId: 'bible_reading_men_only',
            field: 'genero',
            message: 'Bible reading (Part 3) can only be assigned to men',
            severity: 'error',
            studentId: assignment.id_estudante,
            partNumber: assignment.numero_parte,
            suggestion: 'Choose a male student for this assignment'
          });
        }
        if (!qualifications.bible_reading) {
          errors.push({
            ruleId: 'student_must_have_qualification',
            field: 'qualifications',
            message: 'Student is not qualified for Bible reading',
            severity: 'error',
            studentId: assignment.id_estudante,
            partNumber: assignment.numero_parte,
            suggestion: 'Update student qualifications or choose a qualified student'
          });
        }
        break;

      case 'discurso':
        if (student.genero !== 'masculino') {
          errors.push({
            ruleId: 'talks_qualified_men_only',
            field: 'genero',
            message: 'Talks can only be assigned to men',
            severity: 'error',
            studentId: assignment.id_estudante,
            partNumber: assignment.numero_parte,
            suggestion: 'Choose a qualified male student for this talk'
          });
        }
        if (!qualifications.talk || !this.isQualifiedForTalks(student.cargo as Cargo)) {
          errors.push({
            ruleId: 'talks_qualified_men_only',
            field: 'qualifications',
            message: 'Student is not qualified to give talks',
            severity: 'error',
            studentId: assignment.id_estudante,
            partNumber: assignment.numero_parte,
            suggestion: 'Choose an elder, ministerial servant, or baptized publisher'
          });
        }
        break;

      case 'demonstracao':
      case 'parte_ministerio':
        if (!qualifications.demonstration) {
          errors.push({
            ruleId: 'student_must_have_qualification',
            field: 'qualifications',
            message: 'Student is not qualified for demonstrations',
            severity: 'error',
            studentId: assignment.id_estudante,
            partNumber: assignment.numero_parte,
            suggestion: 'Update student qualifications or choose a qualified student'
          });
        }
        break;
    }
  }

  /**
   * Validate pairing rules
   */
  private validatePairingRules(
    assignment: DesignacaoGerada,
    student: EstudanteRow,
    assistant: EstudanteRow,
    studentQualifications: StudentQualifications,
    assistantQualifications: StudentQualifications,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // Check if assistant is active
    if (!assistant.ativo) {
      errors.push({
        ruleId: 'assistant_must_be_active',
        field: 'assistant_ativo',
        message: 'Assistant must be active',
        severity: 'error',
        studentId: assignment.id_ajudante,
        partNumber: assignment.numero_parte,
        suggestion: 'Choose an active assistant'
      });
    }

    // Check if assistant can help
    if (!assistantQualifications.can_be_helper) {
      errors.push({
        ruleId: 'assistant_must_be_qualified',
        field: 'assistant_qualifications',
        message: 'Assistant is not qualified to help',
        severity: 'error',
        studentId: assignment.id_ajudante,
        partNumber: assignment.numero_parte,
        suggestion: 'Choose a qualified assistant'
      });
    }

    // Check gender pairing rules
    const studentGender = student.genero;
    const assistantGender = assistant.genero;
    const areFamilyMembers = this.areFamilyMembers(student.id, assistant.id);
    const isStudentMinor = student.menor;

    // Different gender pairs must be family members
    if (studentGender !== assistantGender && !areFamilyMembers) {
      errors.push({
        ruleId: 'family_member_different_gender',
        field: 'assistant_gender',
        message: 'Different gender pairs must be family members',
        severity: 'error',
        studentId: assignment.id_estudante,
        partNumber: assignment.numero_parte,
        suggestion: 'Choose a same-gender assistant or a family member',
        context: {
          studentGender,
          assistantGender,
          areFamilyMembers
        }
      });
    }

    // Minors must have same-gender assistants (unless family)
    if (isStudentMinor && studentGender !== assistantGender && !areFamilyMembers) {
      errors.push({
        ruleId: 'minors_same_gender_only',
        field: 'assistant_gender',
        message: 'Minors must have same-gender assistants unless they are family members',
        severity: 'error',
        studentId: assignment.id_estudante,
        partNumber: assignment.numero_parte,
        suggestion: 'Choose a same-gender assistant or a family member',
        context: {
          isStudentMinor,
          studentGender,
          assistantGender,
          areFamilyMembers
        }
      });
    }

    // Preference for same-gender assistants (warning, not error)
    if (studentGender !== assistantGender && areFamilyMembers) {
      warnings.push({
        ruleId: 'same_gender_assistants',
        field: 'assistant_gender',
        message: 'Same-gender assistants are preferred when possible',
        severity: 'warning',
        studentId: assignment.id_estudante,
        partNumber: assignment.numero_parte,
        suggestion: 'Consider a same-gender assistant if available',
        context: {
          studentGender,
          assistantGender,
          areFamilyMembers
        }
      });
    }
  }

  /**
   * Validate scheduling rules
   */
  private validateSchedulingRules(
    assignment: DesignacaoGerada,
    student: EstudanteRow,
    errors: ValidationError[],
    warnings: ValidationError[],
    infos: ValidationError[]
  ): void {
    // Check for duplicate assignments in the same week
    const duplicateAssignment = this.context.existingAssignments.find(existing => 
      existing.id_estudante === assignment.id_estudante && 
      existing.data_inicio_semana === assignment.data_inicio_semana &&
      existing.numero_parte !== assignment.numero_parte
    );

    if (duplicateAssignment) {
      errors.push({
        ruleId: 'no_duplicate_assignments',
        field: 'scheduling',
        message: 'Student already has an assignment this week',
        severity: 'error',
        studentId: assignment.id_estudante,
        partNumber: assignment.numero_parte,
        suggestion: 'Choose a different student or reschedule to another week',
        context: {
          existingPart: duplicateAssignment.numero_parte,
          weekDate: assignment.data_inicio_semana
        }
      });
    }

    // Check for recent assignments
    const recentAssignments = this.getRecentAssignments(student.id, 14); // Last 2 weeks
    if (recentAssignments.length > 0) {
      const lastAssignment = recentAssignments[0];
      const daysSince = this.getDaysBetween(lastAssignment.data_inicio_semana, assignment.data_inicio_semana);
      
      if (daysSince < 7) {
        warnings.push({
          ruleId: 'no_consecutive_weeks',
          field: 'scheduling',
          message: `Student had an assignment ${daysSince} days ago`,
          severity: 'warning',
          studentId: assignment.id_estudante,
          partNumber: assignment.numero_parte,
          suggestion: 'Consider giving other students opportunities first',
          context: {
            lastAssignmentDate: lastAssignment.data_inicio_semana,
            daysSince
          }
        });
      } else if (daysSince < 14) {
        warnings.push({
          ruleId: 'recent_assignment_warning',
          field: 'scheduling',
          message: `Student had an assignment ${daysSince} days ago`,
          severity: 'warning',
          studentId: assignment.id_estudante,
          partNumber: assignment.numero_parte,
          suggestion: 'Consider if other students need opportunities',
          context: {
            lastAssignmentDate: lastAssignment.data_inicio_semana,
            daysSince
          }
        });
      }
    }
  }

  /**
   * Validate distribution rules
   */
  private validateDistributionRules(
    assignment: DesignacaoGerada,
    student: EstudanteRow,
    warnings: ValidationError[],
    infos: ValidationError[]
  ): void {
    // Check for overloaded students (more than 3 assignments in 8 weeks)
    const recentAssignments = this.getRecentAssignments(student.id, 56); // Last 8 weeks
    if (recentAssignments.length >= 3) {
      warnings.push({
        ruleId: 'overloaded_student',
        field: 'distribution',
        message: `Student has ${recentAssignments.length} assignments in the last 8 weeks`,
        severity: 'warning',
        studentId: assignment.id_estudante,
        partNumber: assignment.numero_parte,
        suggestion: 'Consider distributing assignments more evenly',
        context: {
          recentAssignmentCount: recentAssignments.length,
          period: '8 weeks'
        }
      });
    }

    // Info about assignment distribution
    infos.push({
      ruleId: 'balanced_distribution',
      field: 'distribution',
      message: `Student has ${recentAssignments.length} assignments in the last 8 weeks`,
      severity: 'info',
      studentId: assignment.id_estudante,
      partNumber: assignment.numero_parte,
      context: {
        recentAssignmentCount: recentAssignments.length,
        period: '8 weeks'
      }
    });
  }

  /**
   * Validate rules that apply across multiple assignments
   */
  private validateCrossAssignmentRules(
    assignments: DesignacaoGerada[],
    errors: ValidationError[],
    warnings: ValidationError[],
    infos: ValidationError[]
  ): void {
    // Check for students with multiple assignments in the same week
    const studentAssignments = new Map<string, DesignacaoGerada[]>();
    
    assignments.forEach(assignment => {
      const key = `${assignment.id_estudante}-${assignment.data_inicio_semana}`;
      if (!studentAssignments.has(key)) {
        studentAssignments.set(key, []);
      }
      studentAssignments.get(key)!.push(assignment);

      // Also check assistants
      if (assignment.id_ajudante) {
        const assistantKey = `${assignment.id_ajudante}-${assignment.data_inicio_semana}`;
        if (!studentAssignments.has(assistantKey)) {
          studentAssignments.set(assistantKey, []);
        }
        studentAssignments.get(assistantKey)!.push(assignment);
      }
    });

    // Report overloaded students
    studentAssignments.forEach((studentAssignments, key) => {
      if (studentAssignments.length > 1) {
        const [studentId, weekDate] = key.split('-');
        errors.push({
          ruleId: 'no_duplicate_assignments',
          field: 'cross_assignment',
          message: `Student has ${studentAssignments.length} assignments in week ${weekDate}`,
          severity: 'error',
          studentId,
          suggestion: 'Redistribute assignments to avoid overloading students',
          context: {
            assignmentCount: studentAssignments.length,
            weekDate,
            parts: studentAssignments.map(a => a.numero_parte)
          }
        });
      }
    });

    // Check for balanced distribution across all assignments
    const assignmentCounts = new Map<string, number>();
    assignments.forEach(assignment => {
      assignmentCounts.set(
        assignment.id_estudante, 
        (assignmentCounts.get(assignment.id_estudante) || 0) + 1
      );
      if (assignment.id_ajudante) {
        assignmentCounts.set(
          assignment.id_ajudante, 
          (assignmentCounts.get(assignment.id_ajudante) || 0) + 1
        );
      }
    });

    // Report distribution statistics
    const maxAssignments = Math.max(...assignmentCounts.values());
    const minAssignments = Math.min(...assignmentCounts.values());
    
    if (maxAssignments - minAssignments > 1) {
      infos.push({
        ruleId: 'balanced_distribution',
        field: 'distribution',
        message: `Assignment distribution varies from ${minAssignments} to ${maxAssignments} per student`,
        severity: 'info',
        suggestion: 'Consider balancing assignments more evenly',
        context: {
          maxAssignments,
          minAssignments,
          totalStudents: assignmentCounts.size
        }
      });
    }
  }

  /**
   * Generate conflicts from validation errors
   */
  private generateConflicts(
    assignment: DesignacaoGerada,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): ConflitosDesignacao[] {
    const conflicts: ConflitosDesignacao[] = [];

    errors.forEach(error => {
      let conflictType: ConflitosDesignacao['tipo'] = 'inelegibilidade';
      
      if (error.ruleId.includes('duplicate') || error.ruleId.includes('overload')) {
        conflictType = 'sobrecarga';
      } else if (error.ruleId.includes('assistant') || error.ruleId.includes('pairing')) {
        conflictType = 'pareamento_invalido';
      } else if (error.ruleId.includes('missing_required_assistant')) {
        conflictType = 'falta_ajudante';
      }

      conflicts.push({
        tipo: conflictType,
        estudante_id: assignment.id_estudante,
        numero_parte: assignment.numero_parte,
        descricao: error.message,
        sugestao: error.suggestion
      });
    });

    return conflicts;
  }

  /**
   * Create validation result object
   */
  private createValidationResult(
    errors: ValidationError[],
    warnings: ValidationError[],
    infos: ValidationError[],
    conflicts: ConflitosDesignacao[]
  ): ValidationResult {
    const isValid = errors.length === 0;
    
    // Calculate quality score (0-100)
    let score = 100;
    score -= errors.length * 20; // Major penalty for errors
    score -= warnings.length * 5; // Minor penalty for warnings
    score = Math.max(0, Math.min(100, score));

    return {
      isValid,
      errors,
      warnings,
      infos,
      conflicts,
      score
    };
  }

  /**
   * Helper methods
   */
  private requiresAssistant(partType: string): boolean {
    return partType === 'demonstracao' || partType === 'parte_ministerio';
  }

  private isQualifiedForTalks(cargo: Cargo): boolean {
    return ['anciao', 'servo_ministerial', 'publicador_batizado'].includes(cargo);
  }

  private areFamilyMembers(studentId1: string, studentId2: string): boolean {
    const family1 = this.context.familyRelationships.get(studentId1) || [];
    return family1.includes(studentId2);
  }

  private getRecentAssignments(studentId: string, days: number): any[] {
    const history = this.context.assignmentHistory.get(studentId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return history.filter(assignment => 
      new Date(assignment.data_inicio_semana) >= cutoffDate
    );
  }

  private getDaysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

/**
 * Factory function to create validator
 */
export function createAssignmentValidator(context: ValidationContext): AssignmentValidator {
  return new AssignmentValidator(context);
}

/**
 * Convenience function to validate assignments
 */
export function validateAssignments(
  assignments: DesignacaoGerada[],
  context: ValidationContext
): ValidationResult {
  const validator = createAssignmentValidator(context);
  return validator.validateAssignments(assignments);
}

/**
 * Convenience function to validate a single assignment
 */
export function validateAssignment(
  assignment: DesignacaoGerada,
  context: ValidationContext
): ValidationResult {
  const validator = createAssignmentValidator(context);
  return validator.validateAssignment(assignment);
}

/**
 * Get all available validation rules
 */
export function getValidationRules(): ValidationRule[] {
  return [...VALIDATION_RULES];
}

/**
 * Get validation rules by category
 */
export function getValidationRulesByCategory(category: ValidationRule['category']): ValidationRule[] {
  return VALIDATION_RULES.filter(rule => rule.category === category);
}

/**
 * Get validation rule by ID
 */
export function getValidationRule(ruleId: string): ValidationRule | undefined {
  return VALIDATION_RULES.find(rule => rule.id === ruleId);
}