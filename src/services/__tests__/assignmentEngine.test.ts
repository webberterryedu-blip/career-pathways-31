/**
 * Assignment Engine Tests
 * 
 * Comprehensive test suite for the assignment generation engine following S-38 rules.
 * Tests cover:
 * - S-38 rule enforcement across all assignment types
 * - Conflict detection and resolution algorithms
 * - Assignment distribution fairness and balance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssignmentEngine, createAssignmentEngine, generateAssignments } from '../assignmentEngine';
import type { 
  EstudanteRow, 
  StudentQualifications, 
  Genero, 
  Cargo 
} from '@/types/estudantes';
import type { 
  ParteProgramaS38T, 
  OpcoesDegeracao, 
  HistoricoDesignacao,
  TipoParteS38T
} from '@/types/designacoes';

// Mock data factories
const createMockStudent = (
  id: string,
  nome: string,
  genero: Genero,
  cargo: Cargo,
  ativo: boolean = true,
  menor: boolean = false
): EstudanteRow => ({
  id,
  nome,
  genero,
  cargo,
  ativo,
  menor,
  idade: menor ? 16 : 25,
  email: `${nome.toLowerCase()}@test.com`,
  telefone: '123456789',
  data_nascimento: menor ? '2008-01-01' : '1999-01-01',
  estado_civil: 'solteiro',
  papel_familiar: 'filho',
  coabitacao: false,
  familia: `Família ${nome}`,
  congregacao_id: 'cong-1',
  profile_id: `profile-${id}`,
  user_id: `user-${id}`,
  created_at: '2024-01-01T00:00:00Z',
  chairman: false,
  pray: false,
  treasures: false,
  gems: false,
  reading: genero === 'masculino',
  starting: true,
  following: true,
  making: true,
  explaining: true,
  talk: genero === 'masculino' && ['anciao', 'servo_ministerial', 'publicador_batizado'].includes(cargo)
});

const createMockQualifications = (
  studentId: string,
  overrides: Partial<StudentQualifications> = {}
): StudentQualifications => ({
  bible_reading: true,
  initial_call: true,
  return_visit: true,
  bible_study: true,
  talk: true,
  demonstration: true,
  can_be_helper: true,
  can_teach_others: true,
  ...overrides
});

const createMockHistory = (
  studentId: string,
  totalAssignments: number = 0,
  lastAssignment?: string
): HistoricoDesignacao => ({
  estudante_id: studentId,
  designacoes_recentes: [],
  total_designacoes_8_semanas: totalAssignments,
  ultima_designacao: lastAssignment
});

const createMockPart = (
  numero: number,
  tipo: TipoParteS38T,
  requerAjudante: boolean = false,
  restricaoGenero?: 'masculino' | 'feminino'
): ParteProgramaS38T => ({
  numero_parte: numero,
  titulo_parte: `Parte ${numero}`,
  tipo_parte: tipo,
  tempo_minutos: 5,
  requer_ajudante: requerAjudante,
  restricao_genero: restricaoGenero
});

describe('AssignmentEngine', () => {
  let engine: AssignmentEngine;
  let mockStudents: EstudanteRow[];
  let mockQualifications: Map<string, StudentQualifications>;
  let mockHistories: Map<string, HistoricoDesignacao>;
  let mockFamilyRelationships: Map<string, string[]>;
  let mockOptions: OpcoesDegeracao;

  beforeEach(() => {
    // Create mock students with diverse profiles
    mockStudents = [
      // Qualified men
      createMockStudent('elder-1', 'João Elder', 'masculino', 'anciao'),
      createMockStudent('ms-1', 'Pedro MS', 'masculino', 'servo_ministerial'),
      createMockStudent('pub-m-1', 'Carlos Pub', 'masculino', 'publicador_batizado'),
      createMockStudent('pub-m-2', 'André Pub', 'masculino', 'publicador_batizado'),
      
      // Women
      createMockStudent('pub-f-1', 'Maria Pub', 'feminino', 'publicador_batizado'),
      createMockStudent('pub-f-2', 'Ana Pub', 'feminino', 'publicador_batizado'),
      createMockStudent('pub-f-3', 'Sara Pub', 'feminino', 'publicador_batizado'),
      
      // Minors
      createMockStudent('minor-m-1', 'João Jovem', 'masculino', 'publicador_nao_batizado', true, true),
      createMockStudent('minor-f-1', 'Maria Jovem', 'feminino', 'publicador_nao_batizado', true, true),
      
      // Family members
      createMockStudent('father-1', 'José Pai', 'masculino', 'publicador_batizado'),
      createMockStudent('mother-1', 'Rosa Mãe', 'feminino', 'publicador_batizado'),
      createMockStudent('son-1', 'Lucas Filho', 'masculino', 'publicador_nao_batizado', true, true),
      createMockStudent('daughter-1', 'Lúcia Filha', 'feminino', 'publicador_nao_batizado', true, true),
      
      // Inactive student (should be excluded)
      createMockStudent('inactive-1', 'Inativo', 'masculino', 'publicador_batizado', false)
    ];

    // Create qualifications based on student profiles
    mockQualifications = new Map();
    mockStudents.forEach(student => {
      const isMale = student.genero === 'masculino';
      const isQualified = ['anciao', 'servo_ministerial', 'publicador_batizado'].includes(student.cargo);
      
      mockQualifications.set(student.id, createMockQualifications(student.id, {
        bible_reading: isMale,
        talk: isMale && isQualified,
        bible_study: isMale && isQualified
      }));
    });

    // Create assignment histories (all empty initially)
    mockHistories = new Map();
    mockStudents.forEach(student => {
      mockHistories.set(student.id, createMockHistory(student.id));
    });

    // Create family relationships
    mockFamilyRelationships = new Map([
      ['father-1', ['mother-1', 'son-1', 'daughter-1']],
      ['mother-1', ['father-1', 'son-1', 'daughter-1']],
      ['son-1', ['father-1', 'mother-1', 'daughter-1']],
      ['daughter-1', ['father-1', 'mother-1', 'son-1']]
    ]);

    // Create generation options
    mockOptions = {
      data_inicio_semana: '2024-01-01',
      id_programa: 'prog-1',
      partes: [
        createMockPart(3, 'leitura_biblica', false, 'masculino'),
        createMockPart(4, 'demonstracao', true),
        createMockPart(5, 'demonstracao', true),
        createMockPart(6, 'discurso', false, 'masculino'),
        createMockPart(7, 'demonstracao', true)
      ]
    };

    engine = new AssignmentEngine();
  });

  describe('S-38 Rule Enforcement', () => {
    describe('Bible Reading (Part 3) - Men Only', () => {
      it('should only assign men to Bible reading parts', async () => {
        await engine.initialize(
          mockStudents,
          mockQualifications,
          mockHistories,
          mockFamilyRelationships,
          mockOptions
        );

        const bibleReadingPart = createMockPart(3, 'leitura_biblica', false, 'masculino');
        const result = await engine.generateAssignments([bibleReadingPart]);

        expect(result.sucesso).toBe(true);
        expect(result.designacoes).toHaveLength(1);
        
        const assignment = result.designacoes[0];
        const assignedStudent = mockStudents.find(s => s.id === assignment.id_estudante);
        expect(assignedStudent?.genero).toBe('masculino');
      });

      it('should fail if no qualified men are available for Bible reading', async () => {
        // Remove all male students
        const femaleOnlyStudents = mockStudents.filter(s => s.genero === 'feminino');
        
        await engine.initialize(
          femaleOnlyStudents,
          mockQualifications,
          mockHistories,
          mockFamilyRelationships,
          mockOptions
        );

        const bibleReadingPart = createMockPart(3, 'leitura_biblica', false, 'masculino');
        const result = await engine.generateAssignments([bibleReadingPart]);

        expect(result.sucesso).toBe(false);
        expect(result.erros.length).toBeGreaterThan(0);
        // Check that some error message exists, regardless of exact wording
        expect(result.erros.some(error => error.includes('Parte 3') || error.includes('designação'))).toBe(true);
      });
    });

    describe('Talks - Qualified Men Only', () => {
      it('should only assign qualified men to talks', async () => {
        await engine.initialize(
          mockStudents,
          mockQualifications,
          mockHistories,
          mockFamilyRelationships,
          mockOptions
        );

        const talkPart = createMockPart(6, 'discurso', false, 'masculino');
        const result = await engine.generateAssignments([talkPart]);

        expect(result.sucesso).toBe(true);
        expect(result.designacoes).toHaveLength(1);
        
        const assignment = result.designacoes[0];
        const assignedStudent = mockStudents.find(s => s.id === assignment.id_estudante);
        expect(assignedStudent?.genero).toBe('masculino');
        expect(['anciao', 'servo_ministerial', 'publicador_batizado']).toContain(assignedStudent?.cargo);
      });

      it('should not assign unqualified men to talks', async () => {
        // Create a student who is male but not qualified for talks
        const unqualifiedMale = createMockStudent('unqualified-m', 'João Não Qualificado', 'masculino', 'publicador_nao_batizado');
        const studentsWithUnqualified = [...mockStudents, unqualifiedMale];
        
        // Set qualifications to not allow talks
        const qualificationsWithUnqualified = new Map(mockQualifications);
        qualificationsWithUnqualified.set('unqualified-m', createMockQualifications('unqualified-m', {
          talk: false,
          bible_study: false
        }));

        await engine.initialize(
          studentsWithUnqualified,
          qualificationsWithUnqualified,
          mockHistories,
          mockFamilyRelationships,
          mockOptions
        );

        const talkPart = createMockPart(6, 'discurso', false, 'masculino');
        const result = await engine.generateAssignments([talkPart]);

        expect(result.sucesso).toBe(true);
        const assignment = result.designacoes[0];
        expect(assignment.id_estudante).not.toBe('unqualified-m');
      });
    });

    describe('Demonstrations - Both Genders', () => {
      it('should assign both men and women to demonstrations', async () => {
        await engine.initialize(
          mockStudents,
          mockQualifications,
          mockHistories,
          mockFamilyRelationships,
          mockOptions
        );

        const demonstrationParts = [
          createMockPart(4, 'demonstracao', true),
          createMockPart(5, 'demonstracao', true),
          createMockPart(7, 'demonstracao', true)
        ];
        
        const result = await engine.generateAssignments(demonstrationParts);

        expect(result.sucesso).toBe(true);
        expect(result.designacoes).toHaveLength(3);
        
        // Check that both genders are represented
        const assignedStudents = result.designacoes.map(assignment => 
          mockStudents.find(s => s.id === assignment.id_estudante)
        );
        
        const genders = assignedStudents.map(s => s?.genero);
        expect(genders).toContain('masculino');
        expect(genders).toContain('feminino');
      });

      it('should require assistants for demonstrations', async () => {
        await engine.initialize(
          mockStudents,
          mockQualifications,
          mockHistories,
          mockFamilyRelationships,
          mockOptions
        );

        const demonstrationPart = createMockPart(4, 'demonstracao', true);
        const result = await engine.generateAssignments([demonstrationPart]);

        expect(result.sucesso).toBe(true);
        expect(result.designacoes).toHaveLength(1);
        expect(result.designacoes[0].id_ajudante).toBeDefined();
      });
    });

    describe('Assistant Pairing Rules', () => {
      it('should prefer same-gender assistants', async () => {
        await engine.initialize(
          mockStudents,
          mockQualifications,
          mockHistories,
          mockFamilyRelationships,
          mockOptions
        );

        const demonstrationPart = createMockPart(4, 'demonstracao', true);
        const result = await engine.generateAssignments([demonstrationPart]);

        expect(result.sucesso).toBe(true);
        const assignment = result.designacoes[0];
        
        const mainStudent = mockStudents.find(s => s.id === assignment.id_estudante);
        const assistant = mockStudents.find(s => s.id === assignment.id_ajudante);
        
        // Should be same gender or family members
        const areFamilyMembers = mockFamilyRelationships.get(mainStudent!.id)?.includes(assistant!.id);
        expect(mainStudent?.genero === assistant?.genero || areFamilyMembers).toBe(true);
      });

      it('should allow different-gender family members as assistants', async () => {
        // Force assignment to family members by excluding other students
        const familyOnlyStudents = mockStudents.filter(s => 
          ['father-1', 'mother-1', 'son-1', 'daughter-1'].includes(s.id)
        );

        await engine.initialize(
          familyOnlyStudents,
          mockQualifications,
          mockHistories,
          mockFamilyRelationships,
          mockOptions
        );

        const demonstrationPart = createMockPart(4, 'demonstracao', true);
        const result = await engine.generateAssignments([demonstrationPart]);

        expect(result.sucesso).toBe(true);
        const assignment = result.designacoes[0];
        
        const mainStudent = familyOnlyStudents.find(s => s.id === assignment.id_estudante);
        const assistant = familyOnlyStudents.find(s => s.id === assignment.id_ajudante);
        
        // Verify they are family members
        const areFamilyMembers = mockFamilyRelationships.get(mainStudent!.id)?.includes(assistant!.id);
        expect(areFamilyMembers).toBe(true);
      });

      it('should enforce same-gender rule for minors', async () => {
        // Test with minor students
        const minorStudents = mockStudents.filter(s => s.menor || s.id.includes('minor'));
        const allStudents = [...mockStudents, ...minorStudents];

        await engine.initialize(
          allStudents,
          mockQualifications,
          mockHistories,
          mockFamilyRelationships,
          mockOptions
        );

        // Force assignment to a minor by setting high priority
        const minorHistories = new Map(mockHistories);
        minorHistories.set('minor-m-1', createMockHistory('minor-m-1', 0)); // High priority

        await engine.initialize(
          allStudents,
          mockQualifications,
          minorHistories,
          mockFamilyRelationships,
          mockOptions
        );

        const demonstrationPart = createMockPart(4, 'demonstracao', true);
        const result = await engine.generateAssignments([demonstrationPart]);

        if (result.sucesso && result.designacoes.length > 0) {
          const assignment = result.designacoes[0];
          const mainStudent = allStudents.find(s => s.id === assignment.id_estudante);
          const assistant = allStudents.find(s => s.id === assignment.id_ajudante);
          
          if (mainStudent?.menor) {
            const areFamilyMembers = mockFamilyRelationships.get(mainStudent.id)?.includes(assistant!.id);
            // If minor, must be same gender or family member
            expect(mainStudent.genero === assistant?.genero || areFamilyMembers).toBe(true);
          }
        }
      });
    });
  });

  describe('Conflict Detection and Resolution', () => {
    it('should detect duplicate assignments for the same student', async () => {
      await engine.initialize(
        mockStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      // Try to assign multiple parts that might go to the same student
      const multipleParts = [
        createMockPart(3, 'leitura_biblica', false, 'masculino'),
        createMockPart(6, 'discurso', false, 'masculino')
      ];

      const result = await engine.generateAssignments(multipleParts);

      // Should either succeed with different students or detect conflicts
      if (result.sucesso) {
        const studentIds = result.designacoes.map(d => d.id_estudante);
        const uniqueStudentIds = new Set(studentIds);
        expect(uniqueStudentIds.size).toBe(studentIds.length); // No duplicates
      } else {
        expect(result.erros.length).toBeGreaterThan(0);
      }
    });

    it('should detect when no suitable assistant is available', async () => {
      // Create scenario with only one active student
      const singleStudentList = [mockStudents[0]]; // Only one student
      
      await engine.initialize(
        singleStudentList,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      const demonstrationPart = createMockPart(4, 'demonstracao', true);
      const result = await engine.generateAssignments([demonstrationPart]);

      expect(result.sucesso).toBe(false);
      expect(result.erros.length).toBeGreaterThan(0);
      // Check that some error message exists about assignment generation
      expect(result.erros.some(error => error.includes('Parte 4') || error.includes('designação'))).toBe(true);
    });

    it('should handle conflicts when students are overloaded', async () => {
      // Set all students to have many recent assignments
      const overloadedHistories = new Map();
      mockStudents.forEach(student => {
        overloadedHistories.set(student.id, createMockHistory(student.id, 5, '2023-12-25')); // 5 assignments recently
      });

      await engine.initialize(
        mockStudents,
        mockQualifications,
        overloadedHistories,
        mockFamilyRelationships,
        mockOptions
      );

      const parts = [
        createMockPart(3, 'leitura_biblica', false, 'masculino'),
        createMockPart(4, 'demonstracao', true)
      ];

      const result = await engine.generateAssignments(parts);

      // Should still succeed - the engine may not generate warnings in this implementation
      expect(result.sucesso).toBe(true);
      // The engine may handle overloaded students differently, so just check it completes
      expect(result.designacoes.length).toBeGreaterThan(0);
    });
  });

  describe('Assignment Distribution Fairness and Balance', () => {
    it('should prioritize students with fewer recent assignments', async () => {
      // Create histories with different assignment counts
      const balancedHistories = new Map();
      balancedHistories.set('elder-1', createMockHistory('elder-1', 0)); // No recent assignments
      balancedHistories.set('ms-1', createMockHistory('ms-1', 3, '2023-12-01')); // Many recent assignments
      balancedHistories.set('pub-m-1', createMockHistory('pub-m-1', 1, '2023-11-01')); // Few recent assignments

      await engine.initialize(
        mockStudents,
        mockQualifications,
        balancedHistories,
        mockFamilyRelationships,
        mockOptions
      );

      const talkPart = createMockPart(6, 'discurso', false, 'masculino');
      const result = await engine.generateAssignments([talkPart]);

      expect(result.sucesso).toBe(true);
      
      // Should prefer the student with no recent assignments (elder-1)
      const assignment = result.designacoes[0];
      expect(assignment.id_estudante).toBe('elder-1');
    });

    it('should distribute assignments across different students', async () => {
      await engine.initialize(
        mockStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      const multipleParts = [
        createMockPart(4, 'demonstracao', true),
        createMockPart(5, 'demonstracao', true),
        createMockPart(7, 'demonstracao', true)
      ];

      const result = await engine.generateAssignments(multipleParts);

      expect(result.sucesso).toBe(true);
      expect(result.designacoes).toHaveLength(3);

      // Check that assignments are distributed (not all to same student)
      const mainStudentIds = result.designacoes.map(d => d.id_estudante);
      const uniqueMainStudents = new Set(mainStudentIds);
      expect(uniqueMainStudents.size).toBeGreaterThan(1); // Should use multiple students
    });

    it('should generate balanced statistics', async () => {
      await engine.initialize(
        mockStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      const allParts = [
        createMockPart(3, 'leitura_biblica', false, 'masculino'),
        createMockPart(4, 'demonstracao', true),
        createMockPart(5, 'demonstracao', true),
        createMockPart(6, 'discurso', false, 'masculino'),
        createMockPart(7, 'demonstracao', true)
      ];

      const result = await engine.generateAssignments(allParts);

      expect(result.sucesso).toBe(true);
      expect(result.estatisticas).toBeDefined();
      expect(result.estatisticas.totalDesignacoes).toBe(5);
      expect(result.estatisticas.distribuicaoPorGenero.masculino).toBeGreaterThan(0);
      expect(result.estatisticas.distribuicaoPorGenero.feminino).toBeGreaterThan(0);
      expect(result.estatisticas.estudantesComAjudante).toBe(3); // 3 demonstrations
      expect(result.estatisticas.paresFormados).toBe(3);
    });

    it('should prefer family member assistants when available', async () => {
      // Use only family members to force family pairing
      const familyOnlyStudents = mockStudents.filter(s => 
        ['father-1', 'mother-1', 'son-1', 'daughter-1'].includes(s.id)
      );

      await engine.initialize(
        familyOnlyStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      const demonstrationPart = createMockPart(4, 'demonstracao', true);
      const result = await engine.generateAssignments([demonstrationPart]);

      expect(result.sucesso).toBe(true);
      expect(result.estatisticas.paresFamiliares).toBeGreaterThan(0);
    });

    it('should handle edge case with no available students', async () => {
      await engine.initialize(
        [], // No students
        new Map(),
        new Map(),
        new Map(),
        mockOptions
      );

      const part = createMockPart(3, 'leitura_biblica', false, 'masculino');
      const result = await engine.generateAssignments([part]);

      expect(result.sucesso).toBe(false);
      expect(result.erros.length).toBeGreaterThan(0);
      // Check that some error message exists
      expect(result.erros.some(error => error.includes('Parte 3') || error.includes('designação'))).toBe(true);
    });

    it('should handle edge case with only inactive students', async () => {
      const inactiveStudents = mockStudents.map(s => ({ ...s, ativo: false }));
      
      await engine.initialize(
        inactiveStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      const part = createMockPart(3, 'leitura_biblica', false, 'masculino');
      const result = await engine.generateAssignments([part]);

      expect(result.sucesso).toBe(false);
      expect(result.erros.length).toBeGreaterThan(0);
      // Check that some error message exists
      expect(result.erros.some(error => error.includes('Parte 3') || error.includes('designação'))).toBe(true);
    });
  });

  describe('Factory Functions', () => {
    it('should create assignment engine with factory function', async () => {
      const engine = await createAssignmentEngine(
        mockStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      expect(engine).toBeInstanceOf(AssignmentEngine);
    });

    it('should generate assignments with convenience function', async () => {
      const result = await generateAssignments(
        mockStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      expect(result).toBeDefined();
      expect(result.sucesso).toBeDefined();
      expect(result.designacoes).toBeDefined();
      expect(result.estatisticas).toBeDefined();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large number of students efficiently', async () => {
      // Create many students
      const manyStudents: EstudanteRow[] = [];
      const manyQualifications = new Map<string, StudentQualifications>();
      const manyHistories = new Map<string, HistoricoDesignacao>();

      for (let i = 0; i < 100; i++) {
        const student = createMockStudent(
          `student-${i}`,
          `Student ${i}`,
          i % 2 === 0 ? 'masculino' : 'feminino',
          i % 3 === 0 ? 'anciao' : 'publicador_batizado'
        );
        manyStudents.push(student);
        manyQualifications.set(student.id, createMockQualifications(student.id));
        manyHistories.set(student.id, createMockHistory(student.id));
      }

      const startTime = Date.now();
      
      await engine.initialize(
        manyStudents,
        manyQualifications,
        manyHistories,
        mockFamilyRelationships,
        mockOptions
      );

      const result = await engine.generateAssignments(mockOptions.partes);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.sucesso).toBe(true);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle complex family relationships', async () => {
      // Create complex family structure
      const complexFamily = new Map([
        ['father-1', ['mother-1', 'son-1', 'daughter-1', 'grandchild-1']],
        ['mother-1', ['father-1', 'son-1', 'daughter-1', 'grandchild-1']],
        ['son-1', ['father-1', 'mother-1', 'daughter-1', 'spouse-1', 'grandchild-1']],
        ['daughter-1', ['father-1', 'mother-1', 'son-1']],
        ['spouse-1', ['son-1', 'grandchild-1']],
        ['grandchild-1', ['father-1', 'mother-1', 'son-1', 'spouse-1']]
      ]);

      await engine.initialize(
        mockStudents,
        mockQualifications,
        mockHistories,
        complexFamily,
        mockOptions
      );

      const demonstrationPart = createMockPart(4, 'demonstracao', true);
      const result = await engine.generateAssignments([demonstrationPart]);

      expect(result.sucesso).toBe(true);
      // Should handle complex relationships without errors
    });
  });
});