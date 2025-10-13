import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  ValidationEngine, 
  validationEngine, 
  validateField, 
  combineValidationResults,
  StudentSchema,
  AssignmentSchema,
  ProgramSchema
} from '../validation';
import { z } from 'zod';

describe('ValidationEngine', () => {
  let engine: ValidationEngine;

  beforeEach(() => {
    engine = ValidationEngine.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ValidationEngine.getInstance();
      const instance2 = ValidationEngine.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should use global instance', () => {
      expect(validationEngine).toBe(engine);
    });
  });

  describe('Student Validation', () => {
    const validStudent = {
      nome: 'João Silva',
      email: 'joao@example.com',
      telefone: '+55 11 99999-9999',
      genero: 'masculino',
      data_nascimento: '1990-01-01',
      congregacao_id: '123e4567-e89b-12d3-a456-426614174000',
      privilegios: ['publicador'],
      qualificacoes: {
        pode_dar_discursos: true,
        pode_fazer_demonstracoes: true,
        pode_assistir: true,
        nivel_experiencia: 'intermediario'
      },
      ativo: true
    };

    it('should validate correct student data', () => {
      const result = engine.validateStudent(validStudent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject student with invalid name', () => {
      const invalidStudent = { ...validStudent, nome: 'A' };
      const result = engine.validateStudent(invalidStudent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'nome')).toBe(true);
      expect(result.errors.find(e => e.field === 'nome')?.message).toContain('at least 2 characters');
    });

    it('should reject student with invalid email', () => {
      const invalidStudent = { ...validStudent, email: 'invalid-email' };
      const result = engine.validateStudent(invalidStudent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'email')).toBe(true);
      expect(result.errors.find(e => e.field === 'email')?.message).toContain('Invalid email format');
    });

    it('should accept empty email', () => {
      const studentWithoutEmail = { ...validStudent, email: '' };
      const result = engine.validateStudent(studentWithoutEmail);
      
      expect(result.isValid).toBe(true);
    });

    it('should reject student with invalid phone', () => {
      const invalidStudent = { ...validStudent, telefone: 'abc123' };
      const result = engine.validateStudent(invalidStudent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'telefone')).toBe(true);
    });

    it('should accept empty phone', () => {
      const studentWithoutPhone = { ...validStudent, telefone: '' };
      const result = engine.validateStudent(studentWithoutPhone);
      
      expect(result.isValid).toBe(true);
    });

    it('should reject student with invalid gender', () => {
      const invalidStudent = { ...validStudent, genero: 'outro' };
      const result = engine.validateStudent(invalidStudent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'genero')).toBe(true);
    });

    it('should reject student with invalid birth date', () => {
      const invalidStudent = { ...validStudent, data_nascimento: '2020-01-01' }; // Too young
      const result = engine.validateStudent(invalidStudent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'data_nascimento')).toBe(true);
    });

    it('should reject student with invalid congregation ID', () => {
      const invalidStudent = { ...validStudent, congregacao_id: 'invalid-uuid' };
      const result = engine.validateStudent(invalidStudent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'congregacao_id')).toBe(true);
    });

    it('should warn about young student giving talks', () => {
      const youngStudent = { 
        ...validStudent, 
        data_nascimento: '2015-01-01', // 9 years old
        qualificacoes: {
          ...validStudent.qualificacoes,
          pode_dar_discursos: true
        }
      };
      
      const result = engine.validateStudent(youngStudent);
      
      expect(result.warnings.some(w => w.code === 'age_warning')).toBe(true);
      expect(result.warnings.find(w => w.code === 'age_warning')?.message).toContain('too young for talks');
    });

    it('should handle missing qualifications', () => {
      const studentWithoutQualifications = { ...validStudent };
      delete (studentWithoutQualifications as any).qualificacoes;
      
      const result = engine.validateStudent(studentWithoutQualifications);
      
      expect(result.isValid).toBe(true); // Should use defaults
    });

    it('should reject notes that are too long', () => {
      const studentWithLongNotes = { 
        ...validStudent, 
        observacoes: 'A'.repeat(501) 
      };
      
      const result = engine.validateStudent(studentWithLongNotes);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'observacoes')).toBe(true);
    });
  });

  describe('Assignment Validation', () => {
    const validAssignment = {
      programa_id: '123e4567-e89b-12d3-a456-426614174000',
      estudante_id: '123e4567-e89b-12d3-a456-426614174001',
      assistente_id: '123e4567-e89b-12d3-a456-426614174002',
      tipo_parte: 'iniciando_conversa',
      ponto_estudo: 'Como iniciar uma conversa',
      data_semana: '2024-12-31',
      status: 'pendente'
    };

    const mockStudents = [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        genero: 'feminino',
        qualificacoes: {
          pode_dar_discursos: false,
          pode_fazer_demonstracoes: true
        },
        familia_id: 'family-1'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        genero: 'feminino',
        qualificacoes: {
          pode_dar_discursos: false,
          pode_fazer_demonstracoes: true
        },
        familia_id: 'family-1'
      }
    ];

    it('should validate correct assignment data', () => {
      const result = engine.validateAssignment(validAssignment, mockStudents);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject assignment with invalid program ID', () => {
      const invalidAssignment = { ...validAssignment, programa_id: 'invalid-uuid' };
      const result = engine.validateAssignment(invalidAssignment);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'programa_id')).toBe(true);
    });

    it('should reject assignment with invalid student ID', () => {
      const invalidAssignment = { ...validAssignment, estudante_id: 'invalid-uuid' };
      const result = engine.validateAssignment(invalidAssignment);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'estudante_id')).toBe(true);
    });

    it('should reject assignment with invalid part type', () => {
      const invalidAssignment = { ...validAssignment, tipo_parte: 'invalid_type' };
      const result = engine.validateAssignment(invalidAssignment);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'tipo_parte')).toBe(true);
    });

    it('should reject assignment with empty study point', () => {
      const invalidAssignment = { ...validAssignment, ponto_estudo: '' };
      const result = engine.validateAssignment(invalidAssignment);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'ponto_estudo')).toBe(true);
    });

    it('should reject assignment with past date', () => {
      const invalidAssignment = { ...validAssignment, data_semana: '2020-01-01' };
      const result = engine.validateAssignment(invalidAssignment);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'data_semana')).toBe(true);
    });

    it('should reject assignment with study point too long', () => {
      const invalidAssignment = { ...validAssignment, ponto_estudo: 'A'.repeat(201) };
      const result = engine.validateAssignment(invalidAssignment);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'ponto_estudo')).toBe(true);
    });

    it('should reject assignment with counsel notes too long', () => {
      const invalidAssignment = { 
        ...validAssignment, 
        observacoes_conselho: 'A'.repeat(501) 
      };
      const result = engine.validateAssignment(invalidAssignment);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'observacoes_conselho')).toBe(true);
    });

    it('should reject assignment with invalid presentation time', () => {
      const invalidAssignment = { ...validAssignment, tempo_apresentacao: 35 };
      const result = engine.validateAssignment(invalidAssignment);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'tempo_apresentacao')).toBe(true);
    });
  });

  describe('S-38 Rule Validation', () => {
    const mockMaleStudent = {
      id: 'male-student',
      genero: 'masculino',
      qualificacoes: {
        pode_dar_discursos: true,
        pode_fazer_demonstracoes: true
      },
      familia_id: 'family-1'
    };

    const mockFemaleStudent = {
      id: 'female-student',
      genero: 'feminino',
      qualificacoes: {
        pode_dar_discursos: false,
        pode_fazer_demonstracoes: true
      },
      familia_id: 'family-2'
    };

    const mockFemaleAssistant = {
      id: 'female-assistant',
      genero: 'feminino',
      qualificacoes: {
        pode_dar_discursos: false,
        pode_fazer_demonstracoes: true
      },
      familia_id: 'family-2'
    };

    const mockMaleAssistant = {
      id: 'male-assistant',
      genero: 'masculino',
      qualificacoes: {
        pode_dar_discursos: true,
        pode_fazer_demonstracoes: true
      },
      familia_id: 'family-3'
    };

    const mockStudents = [mockMaleStudent, mockFemaleStudent, mockFemaleAssistant, mockMaleAssistant];

    it('should allow same-gender assistant for starting conversation', () => {
      const assignment = {
        programa_id: '123e4567-e89b-12d3-a456-426614174000',
        estudante_id: 'female-student',
        assistente_id: 'female-assistant',
        tipo_parte: 'iniciando_conversa',
        ponto_estudo: 'Test point',
        data_semana: '2024-12-31',
        status: 'pendente'
      };

      const result = engine.validateAssignment(assignment, mockStudents);
      expect(result.isValid).toBe(true);
    });

    it('should reject different-gender assistant for starting conversation (non-family)', () => {
      const assignment = {
        programa_id: '123e4567-e89b-12d3-a456-426614174000',
        estudante_id: 'female-student',
        assistente_id: 'male-assistant',
        tipo_parte: 'iniciando_conversa',
        ponto_estudo: 'Test point',
        data_semana: '2024-12-31',
        status: 'pendente'
      };

      const result = engine.validateAssignment(assignment, mockStudents);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'gender_mismatch')).toBe(true);
    });

    it('should allow family member assistant regardless of gender', () => {
      const familyMember = {
        ...mockMaleAssistant,
        familia_id: 'family-2' // Same family as female student
      };
      
      const studentsWithFamily = [mockMaleStudent, mockFemaleStudent, familyMember];

      const assignment = {
        programa_id: '123e4567-e89b-12d3-a456-426614174000',
        estudante_id: 'female-student',
        assistente_id: 'male-assistant',
        tipo_parte: 'iniciando_conversa',
        ponto_estudo: 'Test point',
        data_semana: '2024-12-31',
        status: 'pendente'
      };

      const result = engine.validateAssignment(assignment, studentsWithFamily);
      expect(result.isValid).toBe(true);
    });

    it('should require same-gender assistant for making disciples', () => {
      const assignment = {
        programa_id: '123e4567-e89b-12d3-a456-426614174000',
        estudante_id: 'female-student',
        assistente_id: 'male-assistant',
        tipo_parte: 'fazendo_discipulos',
        ponto_estudo: 'Test point',
        data_semana: '2024-12-31',
        status: 'pendente'
      };

      const result = engine.validateAssignment(assignment, mockStudents);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'gender_mismatch')).toBe(true);
    });

    it('should allow only males for talks', () => {
      const assignment = {
        programa_id: '123e4567-e89b-12d3-a456-426614174000',
        estudante_id: 'female-student',
        tipo_parte: 'discurso',
        ponto_estudo: 'Test point',
        data_semana: '2024-12-31',
        status: 'pendente'
      };

      const result = engine.validateAssignment(assignment, mockStudents);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'gender_restriction')).toBe(true);
    });

    it('should allow males for talks', () => {
      const assignment = {
        programa_id: '123e4567-e89b-12d3-a456-426614174000',
        estudante_id: 'male-student',
        tipo_parte: 'discurso',
        ponto_estudo: 'Test point',
        data_semana: '2024-12-31',
        status: 'pendente'
      };

      const result = engine.validateAssignment(assignment, mockStudents);
      expect(result.isValid).toBe(true);
    });

    it('should validate qualifications for talks', () => {
      const unqualifiedStudent = {
        ...mockMaleStudent,
        qualificacoes: {
          pode_dar_discursos: false,
          pode_fazer_demonstracoes: true
        }
      };

      const assignment = {
        programa_id: '123e4567-e89b-12d3-a456-426614174000',
        estudante_id: 'male-student',
        tipo_parte: 'discurso',
        ponto_estudo: 'Test point',
        data_semana: '2024-12-31',
        status: 'pendente'
      };

      const result = engine.validateAssignment(assignment, [unqualifiedStudent]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'qualification_missing')).toBe(true);
    });

    it('should validate qualifications for demonstrations', () => {
      const unqualifiedStudent = {
        ...mockFemaleStudent,
        qualificacoes: {
          pode_dar_discursos: false,
          pode_fazer_demonstracoes: false
        }
      };

      const assignment = {
        programa_id: '123e4567-e89b-12d3-a456-426614174000',
        estudante_id: 'female-student',
        tipo_parte: 'iniciando_conversa',
        ponto_estudo: 'Test point',
        data_semana: '2024-12-31',
        status: 'pendente'
      };

      const result = engine.validateAssignment(assignment, [unqualifiedStudent]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'qualification_missing')).toBe(true);
    });
  });

  describe('Scheduling Validation', () => {
    it('should warn about recent assignments', () => {
      const studentWithRecentAssignment = {
        id: 'student-1',
        genero: 'masculino',
        qualificacoes: {
          pode_dar_discursos: true,
          pode_fazer_demonstracoes: true
        },
        ultima_designacao: '2024-12-20' // 11 days ago from 2024-12-31
      };

      const assignment = {
        programa_id: '123e4567-e89b-12d3-a456-426614174000',
        estudante_id: 'student-1',
        tipo_parte: 'discurso',
        ponto_estudo: 'Test point',
        data_semana: '2024-12-31',
        status: 'pendente'
      };

      const result = engine.validateAssignment(assignment, [studentWithRecentAssignment]);
      expect(result.warnings.some(w => w.code === 'recent_assignment')).toBe(true);
    });

    it('should warn about high assignment frequency', () => {
      const busyStudent = {
        id: 'student-1',
        genero: 'masculino',
        qualificacoes: {
          pode_dar_discursos: true,
          pode_fazer_demonstracoes: true
        },
        total_designacoes: 15
      };

      const assignment = {
        programa_id: '123e4567-e89b-12d3-a456-426614174000',
        estudante_id: 'student-1',
        tipo_parte: 'discurso',
        ponto_estudo: 'Test point',
        data_semana: '2024-12-31',
        status: 'pendente'
      };

      const result = engine.validateAssignment(assignment, [busyStudent]);
      expect(result.warnings.some(w => w.code === 'high_frequency')).toBe(true);
    });
  });

  describe('Program Validation', () => {
    const validProgram = {
      data_semana: '2024-12-31',
      secao_tesouros: {
        cantico_inicial: 1,
        oracao_inicial: 'João Silva',
        joias_espirituais: 'Pontos principais do capítulo',
        leitura_biblica: {
          estudante: '123e4567-e89b-12d3-a456-426614174001',
          capitulos: 'Gênesis 1-2'
        }
      },
      secao_ministerio: {
        partes: [
          {
            titulo: 'Iniciando Conversas',
            tipo: 'iniciando_conversa',
            tempo_alocado: 3,
            ponto_estudo: 'Como abordar pessoas',
            requisito_genero: 'ambos',
            assistente_obrigatorio: true
          }
        ]
      },
      secao_vida_crista: {
        partes: [
          {
            titulo: 'Estudo Bíblico de Congregação',
            tipo: 'estudo_congregacao',
            tempo_alocado: 30,
            designado: '123e4567-e89b-12d3-a456-426614174002'
          }
        ]
      },
      ativo: true,
      criado_por: '123e4567-e89b-12d3-a456-426614174003'
    };

    it('should validate correct program data', () => {
      const result = engine.validateProgram(validProgram);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject program with invalid date', () => {
      const invalidProgram = { ...validProgram, data_semana: 'invalid-date' };
      const result = engine.validateProgram(invalidProgram);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'data_semana')).toBe(true);
    });

    it('should reject program with invalid song number', () => {
      const invalidProgram = {
        ...validProgram,
        secao_tesouros: {
          ...validProgram.secao_tesouros,
          cantico_inicial: 200 // Invalid song number
        }
      };
      const result = engine.validateProgram(invalidProgram);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field.includes('cantico_inicial'))).toBe(true);
    });

    it('should reject program without ministry parts', () => {
      const invalidProgram = {
        ...validProgram,
        secao_ministerio: {
          partes: []
        }
      };
      const result = engine.validateProgram(invalidProgram);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field.includes('partes'))).toBe(true);
    });

    it('should reject program without Christian living parts', () => {
      const invalidProgram = {
        ...validProgram,
        secao_vida_crista: {
          partes: []
        }
      };
      const result = engine.validateProgram(invalidProgram);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field.includes('partes'))).toBe(true);
    });

    it('should warn about excessive ministry time', () => {
      const longProgram = {
        ...validProgram,
        secao_ministerio: {
          partes: [
            {
              titulo: 'Part 1',
              tipo: 'iniciando_conversa',
              tempo_alocado: 8,
              ponto_estudo: 'Point 1',
              requisito_genero: 'ambos',
              assistente_obrigatorio: true
            },
            {
              titulo: 'Part 2',
              tipo: 'fazendo_revisitas',
              tempo_alocado: 8,
              ponto_estudo: 'Point 2',
              requisito_genero: 'ambos',
              assistente_obrigatorio: true
            }
          ]
        }
      };
      
      const result = engine.validateProgram(longProgram);
      
      expect(result.warnings.some(w => w.code === 'time_warning')).toBe(true);
      expect(result.warnings.find(w => w.code === 'time_warning')?.value).toBe(16);
    });

    it('should detect duplicate study points', () => {
      const duplicateProgram = {
        ...validProgram,
        secao_ministerio: {
          partes: [
            {
              titulo: 'Part 1',
              tipo: 'iniciando_conversa',
              tempo_alocado: 3,
              ponto_estudo: 'Same point',
              requisito_genero: 'ambos',
              assistente_obrigatorio: true
            },
            {
              titulo: 'Part 2',
              tipo: 'fazendo_revisitas',
              tempo_alocado: 3,
              ponto_estudo: 'Same point',
              requisito_genero: 'ambos',
              assistente_obrigatorio: true
            }
          ]
        }
      };
      
      const result = engine.validateProgram(duplicateProgram);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'duplicate_study_points')).toBe(true);
    });

    it('should reject program with invalid creator ID', () => {
      const invalidProgram = { ...validProgram, criado_por: 'invalid-uuid' };
      const result = engine.validateProgram(invalidProgram);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'criado_por')).toBe(true);
    });
  });
});

describe('Utility Functions', () => {
  describe('validateField', () => {
    it('should validate field with schema', () => {
      const schema = z.string().min(3);
      
      const validResult = validateField(schema, 'valid');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
      
      const invalidResult = validateField(schema, 'ab');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toHaveLength(1);
      expect(invalidResult.errors[0].field).toBe('');
    });
  });

  describe('combineValidationResults', () => {
    it('should combine multiple validation results', () => {
      const result1 = {
        isValid: false,
        errors: [{ field: 'field1', message: 'Error 1', code: 'error1', severity: 'error' as const }],
        warnings: [{ field: 'field1', message: 'Warning 1', code: 'warning1', severity: 'warning' as const }]
      };
      
      const result2 = {
        isValid: false,
        errors: [{ field: 'field2', message: 'Error 2', code: 'error2', severity: 'error' as const }],
        warnings: []
      };
      
      const combined = combineValidationResults(result1, result2);
      
      expect(combined.isValid).toBe(false);
      expect(combined.errors).toHaveLength(2);
      expect(combined.warnings).toHaveLength(1);
    });

    it('should return valid when no errors', () => {
      const result1 = {
        isValid: true,
        errors: [],
        warnings: [{ field: 'field1', message: 'Warning 1', code: 'warning1', severity: 'warning' as const }]
      };
      
      const result2 = {
        isValid: true,
        errors: [],
        warnings: []
      };
      
      const combined = combineValidationResults(result1, result2);
      
      expect(combined.isValid).toBe(true);
      expect(combined.errors).toHaveLength(0);
      expect(combined.warnings).toHaveLength(1);
    });
  });
});

describe('Schema Validation', () => {
  describe('StudentSchema', () => {
    it('should validate complete student object', () => {
      const validStudent = {
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '+55 11 99999-9999',
        genero: 'masculino',
        data_nascimento: '1990-01-01',
        congregacao_id: '123e4567-e89b-12d3-a456-426614174000',
        privilegios: ['publicador'],
        qualificacoes: {
          pode_dar_discursos: true,
          pode_fazer_demonstracoes: true,
          pode_assistir: true,
          nivel_experiencia: 'intermediario'
        },
        familia_id: '123e4567-e89b-12d3-a456-426614174001',
        ativo: true,
        observacoes: 'Test notes'
      };

      const result = StudentSchema.safeParse(validStudent);
      expect(result.success).toBe(true);
    });

    it('should use default values for optional fields', () => {
      const minimalStudent = {
        nome: 'João Silva',
        genero: 'masculino',
        data_nascimento: '1990-01-01',
        congregacao_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      const result = StudentSchema.safeParse(minimalStudent);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.privilegios).toEqual([]);
        expect(result.data.ativo).toBe(true);
        expect(result.data.qualificacoes.pode_dar_discursos).toBe(false);
        expect(result.data.qualificacoes.nivel_experiencia).toBe('iniciante');
      }
    });
  });

  describe('AssignmentSchema', () => {
    it('should validate complete assignment object', () => {
      const validAssignment = {
        programa_id: '123e4567-e89b-12d3-a456-426614174000',
        estudante_id: '123e4567-e89b-12d3-a456-426614174001',
        assistente_id: '123e4567-e89b-12d3-a456-426614174002',
        tipo_parte: 'iniciando_conversa',
        ponto_estudo: 'Como iniciar uma conversa',
        data_semana: '2024-12-31',
        status: 'pendente',
        observacoes_conselho: 'Good presentation',
        tempo_apresentacao: 3,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const result = AssignmentSchema.safeParse(validAssignment);
      expect(result.success).toBe(true);
    });

    it('should use default status', () => {
      const minimalAssignment = {
        programa_id: '123e4567-e89b-12d3-a456-426614174000',
        estudante_id: '123e4567-e89b-12d3-a456-426614174001',
        tipo_parte: 'iniciando_conversa',
        ponto_estudo: 'Como iniciar uma conversa',
        data_semana: '2024-12-31'
      };

      const result = AssignmentSchema.safeParse(minimalAssignment);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.status).toBe('pendente');
      }
    });
  });

  describe('ProgramSchema', () => {
    it('should validate complete program object', () => {
      const validProgram = {
        data_semana: '2024-12-31',
        secao_tesouros: {
          cantico_inicial: 1,
          oracao_inicial: 'João Silva',
          joias_espirituais: 'Pontos principais',
          leitura_biblica: {
            estudante: '123e4567-e89b-12d3-a456-426614174001',
            capitulos: 'Gênesis 1-2'
          }
        },
        secao_ministerio: {
          partes: [
            {
              titulo: 'Iniciando Conversas',
              tipo: 'iniciando_conversa',
              tempo_alocado: 3,
              ponto_estudo: 'Como abordar pessoas',
              requisito_genero: 'ambos',
              assistente_obrigatorio: true
            }
          ]
        },
        secao_vida_crista: {
          partes: [
            {
              titulo: 'Estudo Bíblico',
              tipo: 'estudo_congregacao',
              tempo_alocado: 30,
              designado: '123e4567-e89b-12d3-a456-426614174002'
            }
          ]
        },
        ativo: true,
        criado_por: '123e4567-e89b-12d3-a456-426614174003',
        created_at: '2024-01-01T00:00:00Z'
      };

      const result = ProgramSchema.safeParse(validProgram);
      expect(result.success).toBe(true);
    });

    it('should use default values', () => {
      const minimalProgram = {
        data_semana: '2024-12-31',
        secao_tesouros: {
          cantico_inicial: 1,
          oracao_inicial: 'João Silva',
          joias_espirituais: 'Pontos principais',
          leitura_biblica: {
            estudante: '123e4567-e89b-12d3-a456-426614174001',
            capitulos: 'Gênesis 1-2'
          }
        },
        secao_ministerio: {
          partes: [
            {
              titulo: 'Iniciando Conversas',
              tipo: 'iniciando_conversa',
              tempo_alocado: 3,
              ponto_estudo: 'Como abordar pessoas',
              requisito_genero: 'ambos',
              assistente_obrigatorio: true
            }
          ]
        },
        secao_vida_crista: {
          partes: [
            {
              titulo: 'Estudo Bíblico',
              tipo: 'estudo_congregacao',
              tempo_alocado: 30
            }
          ]
        },
        criado_por: '123e4567-e89b-12d3-a456-426614174003'
      };

      const result = ProgramSchema.safeParse(minimalProgram);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.ativo).toBe(true);
      }
    });
  });
});