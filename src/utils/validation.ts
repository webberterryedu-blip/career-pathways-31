import { z } from 'zod';

// Base validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
  severity: 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  value?: any;
  severity: 'warning';
}

export type ValidationIssue = ValidationError | ValidationWarning;

// Student validation schemas
export const StudentSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  telefone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format').optional().or(z.literal('')),
  genero: z.enum(['masculino', 'feminino'], { required_error: 'Gender is required' }),
  data_nascimento: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 6 && age <= 120;
  }, 'Age must be between 6 and 120 years'),
  congregacao_id: z.string().uuid('Invalid congregation ID'),
  privilegios: z.array(z.string()).default([]),
  qualificacoes: z.object({
    pode_dar_discursos: z.boolean().default(false),
    pode_fazer_demonstracoes: z.boolean().default(true),
    pode_assistir: z.boolean().default(true),
    nivel_experiencia: z.enum(['iniciante', 'intermediario', 'avancado']).default('iniciante')
  }).default({}),
  familia_id: z.string().uuid().optional(),
  ativo: z.boolean().default(true),
  observacoes: z.string().max(500, 'Notes too long').optional()
});

// Assignment validation schemas
export const AssignmentSchema = z.object({
  id: z.string().uuid().optional(),
  programa_id: z.string().uuid('Invalid program ID'),
  estudante_id: z.string().uuid('Invalid student ID'),
  assistente_id: z.string().uuid('Invalid assistant ID').optional(),
  tipo_parte: z.enum([
    'leitura_biblica',
    'iniciando_conversa',
    'fazendo_revisitas',
    'fazendo_discipulos',
    'explicando_crencas',
    'discurso'
  ], { required_error: 'Part type is required' }),
  ponto_estudo: z.string().min(1, 'Study point is required').max(200, 'Study point too long'),
  data_semana: z.string().refine((date) => {
    const assignmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    return assignmentDate >= today;
  }, 'Assignment date must be in the future'),
  status: z.enum(['pendente', 'confirmado', 'concluido', 'cancelado']).default('pendente'),
  observacoes_conselho: z.string().max(500, 'Counsel notes too long').optional(),
  tempo_apresentacao: z.number().min(0).max(30).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

// Program validation schemas
export const ProgramSchema = z.object({
  id: z.string().uuid().optional(),
  data_semana: z.string().refine((date) => {
    const programDate = new Date(date);
    return !isNaN(programDate.getTime());
  }, 'Invalid program date'),
  secao_tesouros: z.object({
    cantico_inicial: z.number().min(1).max(151),
    oracao_inicial: z.string().min(1, 'Opening prayer required'),
    joias_espirituais: z.string().min(1, 'Spiritual gems required'),
    leitura_biblica: z.object({
      estudante: z.string().uuid('Invalid student ID'),
      capitulos: z.string().min(1, 'Bible reading chapters required')
    })
  }),
  secao_ministerio: z.object({
    partes: z.array(z.object({
      titulo: z.string().min(1, 'Part title required'),
      tipo: z.enum([
        'iniciando_conversa',
        'fazendo_revisitas', 
        'fazendo_discipulos',
        'explicando_crencas'
      ]),
      tempo_alocado: z.number().min(1).max(10),
      ponto_estudo: z.string().min(1, 'Study point required'),
      requisito_genero: z.enum(['masculino', 'feminino', 'ambos']),
      assistente_obrigatorio: z.boolean()
    })).min(1, 'At least one ministry part required')
  }),
  secao_vida_crista: z.object({
    partes: z.array(z.object({
      titulo: z.string().min(1, 'Part title required'),
      tipo: z.enum(['discurso', 'video', 'estudo_congregacao']),
      tempo_alocado: z.number().min(1).max(30),
      designado: z.string().uuid('Invalid assigned person ID').optional()
    })).min(1, 'At least one Christian living part required')
  }),
  ativo: z.boolean().default(true),
  criado_por: z.string().uuid('Invalid creator ID'),
  created_at: z.string().datetime().optional()
});

// Validation class
export class ValidationEngine {
  private static instance: ValidationEngine;

  static getInstance(): ValidationEngine {
    if (!ValidationEngine.instance) {
      ValidationEngine.instance = new ValidationEngine();
    }
    return ValidationEngine.instance;
  }

  /**
   * Validate student data
   */
  validateStudent(data: any): ValidationResult {
    const result = StudentSchema.safeParse(data);
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!result.success) {
      result.error.errors.forEach(error => {
        errors.push({
          field: error.path.join('.'),
          message: error.message,
          code: error.code,
          value: error.path.reduce((obj, key) => obj?.[key], data),
          severity: 'error'
        });
      });
    }

    // Additional business logic validations
    if (result.success) {
      const student = result.data;
      
      // Check for duplicate email
      if (student.email && this.isDuplicateEmail(student.email, student.id)) {
        errors.push({
          field: 'email',
          message: 'Email already exists',
          code: 'duplicate_email',
          value: student.email,
          severity: 'error'
        });
      }

      // Age-based warnings
      const age = this.calculateAge(student.data_nascimento);
      if (age < 12 && student.qualificacoes.pode_dar_discursos) {
        warnings.push({
          field: 'qualificacoes.pode_dar_discursos',
          message: 'Student may be too young for talks',
          code: 'age_warning',
          value: age,
          severity: 'warning'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate assignment data with S-38 rules
   */
  validateAssignment(data: any, students: any[] = []): ValidationResult {
    const result = AssignmentSchema.safeParse(data);
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!result.success) {
      result.error.errors.forEach(error => {
        errors.push({
          field: error.path.join('.'),
          message: error.message,
          code: error.code,
          value: error.path.reduce((obj, key) => obj?.[key], data),
          severity: 'error'
        });
      });
    }

    // S-38 rule validations
    if (result.success) {
      const assignment = result.data;
      const student = students.find(s => s.id === assignment.estudante_id);
      const assistant = assignment.assistente_id ? 
        students.find(s => s.id === assignment.assistente_id) : null;

      if (student) {
        // Gender-based validations
        const genderErrors = this.validateGenderRequirements(assignment, student, assistant);
        errors.push(...genderErrors);

        // Qualification validations
        const qualificationErrors = this.validateQualifications(assignment, student);
        errors.push(...qualificationErrors);

        // Scheduling validations
        const schedulingWarnings = this.validateScheduling(assignment, student);
        warnings.push(...schedulingWarnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate program data
   */
  validateProgram(data: any): ValidationResult {
    const result = ProgramSchema.safeParse(data);
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!result.success) {
      result.error.errors.forEach(error => {
        errors.push({
          field: error.path.join('.'),
          message: error.message,
          code: error.code,
          value: error.path.reduce((obj, key) => obj?.[key], data),
          severity: 'error'
        });
      });
    }

    // Additional program validations
    if (result.success) {
      const program = result.data;
      
      // Check total ministry time
      const totalMinistryTime = program.secao_ministerio.partes
        .reduce((total, part) => total + part.tempo_alocado, 0);
      
      if (totalMinistryTime > 15) {
        warnings.push({
          field: 'secao_ministerio',
          message: 'Ministry section exceeds recommended 15 minutes',
          code: 'time_warning',
          value: totalMinistryTime,
          severity: 'warning'
        });
      }

      // Check for duplicate study points
      const studyPoints = program.secao_ministerio.partes.map(p => p.ponto_estudo);
      const duplicates = studyPoints.filter((point, index) => 
        studyPoints.indexOf(point) !== index
      );
      
      if (duplicates.length > 0) {
        errors.push({
          field: 'secao_ministerio.partes',
          message: 'Duplicate study points found',
          code: 'duplicate_study_points',
          value: duplicates,
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate gender requirements according to S-38 rules
   */
  private validateGenderRequirements(
    assignment: any, 
    student: any, 
    assistant: any
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (assignment.tipo_parte) {
      case 'iniciando_conversa':
      case 'fazendo_revisitas':
        // Both genders allowed, assistant must be same gender or family member
        if (assistant && student.genero !== assistant.genero && 
            student.familia_id !== assistant.familia_id) {
          errors.push({
            field: 'assistente_id',
            message: 'Assistant must be same gender or family member',
            code: 'gender_mismatch',
            severity: 'error'
          });
        }
        break;

      case 'fazendo_discipulos':
        // Both genders allowed, assistant must be same gender
        if (assistant && student.genero !== assistant.genero) {
          errors.push({
            field: 'assistente_id',
            message: 'Assistant must be same gender for Making Disciples parts',
            code: 'gender_mismatch',
            severity: 'error'
          });
        }
        break;

      case 'explicando_crencas':
        // If it's a talk, only males; if demonstration, both genders with same-gender assistant
        if (assignment.formato === 'discurso' && student.genero !== 'masculino') {
          errors.push({
            field: 'estudante_id',
            message: 'Only male students can give Explaining Beliefs talks',
            code: 'gender_restriction',
            severity: 'error'
          });
        } else if (assignment.formato === 'demonstracao' && assistant && 
                   student.genero !== assistant.genero) {
          errors.push({
            field: 'assistente_id',
            message: 'Assistant must be same gender for demonstrations',
            code: 'gender_mismatch',
            severity: 'error'
          });
        }
        break;

      case 'discurso':
        // Only male students for talks
        if (student.genero !== 'masculino') {
          errors.push({
            field: 'estudante_id',
            message: 'Only male students can give talks',
            code: 'gender_restriction',
            severity: 'error'
          });
        }
        break;
    }

    return errors;
  }

  /**
   * Validate student qualifications
   */
  private validateQualifications(assignment: any, student: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (assignment.tipo_parte === 'discurso' && !student.qualificacoes?.pode_dar_discursos) {
      errors.push({
        field: 'estudante_id',
        message: 'Student is not qualified to give talks',
        code: 'qualification_missing',
        severity: 'error'
      });
    }

    if (['iniciando_conversa', 'fazendo_revisitas', 'fazendo_discipulos', 'explicando_crencas']
        .includes(assignment.tipo_parte) && !student.qualificacoes?.pode_fazer_demonstracoes) {
      errors.push({
        field: 'estudante_id',
        message: 'Student is not qualified for demonstrations',
        code: 'qualification_missing',
        severity: 'error'
      });
    }

    return errors;
  }

  /**
   * Validate scheduling constraints
   */
  private validateScheduling(assignment: any, student: any): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check if student had recent assignment
    if (student.ultima_designacao) {
      const lastAssignment = new Date(student.ultima_designacao);
      const assignmentDate = new Date(assignment.data_semana);
      const daysDiff = Math.floor((assignmentDate.getTime() - lastAssignment.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff < 14) {
        warnings.push({
          field: 'estudante_id',
          message: `Student had assignment ${daysDiff} days ago`,
          code: 'recent_assignment',
          value: daysDiff,
          severity: 'warning'
        });
      }
    }

    // Check assignment frequency
    if (student.total_designacoes > 10) {
      warnings.push({
        field: 'estudante_id',
        message: 'Student has many assignments this period',
        code: 'high_frequency',
        value: student.total_designacoes,
        severity: 'warning'
      });
    }

    return warnings;
  }

  private isDuplicateEmail(email: string, excludeId?: string): boolean {
    // In a real implementation, this would check the database
    // For now, return false
    return false;
  }

  private calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
}

// Global validation instance
export const validationEngine = ValidationEngine.getInstance();

// Utility functions
export const validateField = (schema: z.ZodSchema, value: any): ValidationResult => {
  const result = schema.safeParse(value);
  
  if (result.success) {
    return { isValid: true, errors: [], warnings: [] };
  }

  const errors: ValidationError[] = result.error.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code,
    value,
    severity: 'error'
  }));

  return { isValid: false, errors, warnings: [] };
};

export const combineValidationResults = (...results: ValidationResult[]): ValidationResult => {
  const allErrors = results.flatMap(r => r.errors);
  const allWarnings = results.flatMap(r => r.warnings);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
};