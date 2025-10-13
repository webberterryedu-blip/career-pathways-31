/**
 * Assignment Integration Tests
 * 
 * Integration tests that verify the assignment engine and validator work together correctly.
 * Tests cover:
 * - End-to-end assignment generation and validation
 * - Complex scenarios with multiple constraints
 * - Performance with realistic data sets
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateAssignments, createAssignmentEngine } from '../assignmentEngine';
import { validateAssignments, createAssignmentValidator, type ValidationContext } from '../assignmentValidator';
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

describe('Assignment Integration Tests', () => {
  let mockStudents: EstudanteRow[];
  let mockQualifications: Map<string, StudentQualifications>;
  let mockHistories: Map<string, HistoricoDesignacao>;
  let mockFamilyRelationships: Map<string, string[]>;
  let mockOptions: OpcoesDegeracao;

  beforeEach(() => {
    // Create a realistic congregation setup
    mockStudents = [
      // Elders
      createMockStudent('elder-1', 'João Elder', 'masculino', 'anciao'),
      createMockStudent('elder-2', 'Paulo Elder', 'masculino', 'anciao'),
      
      // Ministerial Servants
      createMockStudent('ms-1', 'Pedro MS', 'masculino', 'servo_ministerial'),
      createMockStudent('ms-2', 'Marcos MS', 'masculino', 'servo_ministerial'),
      
      // Baptized Publishers - Men
      createMockStudent('pub-m-1', 'Carlos Pub', 'masculino', 'publicador_batizado'),
      createMockStudent('pub-m-2', 'André Pub', 'masculino', 'publicador_batizado'),
      createMockStudent('pub-m-3', 'Lucas Pub', 'masculino', 'publicador_batizado'),
      
      // Baptized Publishers - Women
      createMockStudent('pub-f-1', 'Maria Pub', 'feminino', 'publicador_batizado'),
      createMockStudent('pub-f-2', 'Ana Pub', 'feminino', 'publicador_batizado'),
      createMockStudent('pub-f-3', 'Sara Pub', 'feminino', 'publicador_batizado'),
      createMockStudent('pub-f-4', 'Débora Pub', 'feminino', 'publicador_batizado'),
      createMockStudent('pub-f-5', 'Rute Pub', 'feminino', 'publicador_batizado'),
      
      // Unbaptized Publishers
      createMockStudent('unpub-m-1', 'João Não Batizado', 'masculino', 'publicador_nao_batizado'),
      createMockStudent('unpub-f-1', 'Maria Não Batizada', 'feminino', 'publicador_nao_batizado'),
      
      // Minors
      createMockStudent('minor-m-1', 'João Jovem', 'masculino', 'publicador_nao_batizado', true, true),
      createMockStudent('minor-f-1', 'Maria Jovem', 'feminino', 'publicador_nao_batizado', true, true),
      
      // Family groups
      createMockStudent('father-1', 'José Pai', 'masculino', 'publicador_batizado'),
      createMockStudent('mother-1', 'Rosa Mãe', 'feminino', 'publicador_batizado'),
      createMockStudent('son-1', 'Lucas Filho', 'masculino', 'publicador_nao_batizado', true, true),
      createMockStudent('daughter-1', 'Lúcia Filha', 'feminino', 'publicador_nao_batizado', true, true),
      
      createMockStudent('father-2', 'Antônio Pai', 'masculino', 'servo_ministerial'),
      createMockStudent('mother-2', 'Isabel Mãe', 'feminino', 'publicador_batizado'),
      createMockStudent('son-2', 'Mateus Filho', 'masculino', 'publicador_batizado'),
      createMockStudent('daughter-2', 'Ester Filha', 'feminino', 'publicador_batizado')
    ];

    // Create realistic qualifications
    mockQualifications = new Map();
    mockStudents.forEach(student => {
      const isMale = student.genero === 'masculino';
      const isQualified = ['anciao', 'servo_ministerial', 'publicador_batizado'].includes(student.cargo);
      const isMinor = student.menor;
      
      mockQualifications.set(student.id, createMockQualifications(student.id, {
        bible_reading: isMale && !isMinor,
        talk: isMale && isQualified,
        bible_study: isMale && isQualified,
        demonstration: !isMinor || student.cargo !== 'estudante_novo',
        can_be_helper: true,
        can_teach_others: isQualified
      }));
    });

    // Create realistic assignment histories with some variation
    mockHistories = new Map();
    mockStudents.forEach((student, index) => {
      // Vary assignment history to test distribution
      const assignmentCount = index % 4; // 0-3 assignments
      const lastAssignment = assignmentCount > 0 ? '2023-12-01' : undefined;
      mockHistories.set(student.id, createMockHistory(student.id, assignmentCount, lastAssignment));
    });

    // Create family relationships
    mockFamilyRelationships = new Map([
      ['father-1', ['mother-1', 'son-1', 'daughter-1']],
      ['mother-1', ['father-1', 'son-1', 'daughter-1']],
      ['son-1', ['father-1', 'mother-1', 'daughter-1']],
      ['daughter-1', ['father-1', 'mother-1', 'son-1']],
      
      ['father-2', ['mother-2', 'son-2', 'daughter-2']],
      ['mother-2', ['father-2', 'son-2', 'daughter-2']],
      ['son-2', ['father-2', 'mother-2', 'daughter-2']],
      ['daughter-2', ['father-2', 'mother-2', 'son-2']],
      
      // Sibling relationships for minors
      ['minor-m-1', ['minor-f-1']],
      ['minor-f-1', ['minor-m-1']]
    ]);

    // Create typical meeting program
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
  });

  describe('End-to-End Assignment Generation and Validation', () => {
    it('should generate valid assignments that pass validation', async () => {
      // Generate assignments
      const generationResult = await generateAssignments(
        mockStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      expect(generationResult.sucesso).toBe(true);
      expect(generationResult.designacoes).toHaveLength(5);
      expect(generationResult.erros).toHaveLength(0);

      // Validate generated assignments
      const validationContext: ValidationContext = {
        students: new Map(mockStudents.map(s => [s.id, s])),
        qualifications: mockQualifications,
        familyRelationships: mockFamilyRelationships,
        assignmentHistory: new Map(),
        weekDate: mockOptions.data_inicio_semana,
        existingAssignments: []
      };

      const validationResult = validateAssignments(generationResult.designacoes, validationContext);

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
      expect(validationResult.score).toBeGreaterThan(80);
    });

    it('should generate assignments that follow S-38 rules', async () => {
      const result = await generateAssignments(
        mockStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      expect(result.sucesso).toBe(true);

      // Check Bible reading assignment (Part 3)
      const bibleReading = result.designacoes.find(d => d.numero_parte === 3);
      expect(bibleReading).toBeDefined();
      const bibleReader = mockStudents.find(s => s.id === bibleReading!.id_estudante);
      expect(bibleReader?.genero).toBe('masculino');

      // Check talk assignment (Part 6)
      const talk = result.designacoes.find(d => d.numero_parte === 6);
      expect(talk).toBeDefined();
      const speaker = mockStudents.find(s => s.id === talk!.id_estudante);
      expect(speaker?.genero).toBe('masculino');
      expect(['anciao', 'servo_ministerial', 'publicador_batizado']).toContain(speaker?.cargo);

      // Check demonstrations have assistants
      const demonstrations = result.designacoes.filter(d => d.tipo_parte === 'demonstracao');
      demonstrations.forEach(demo => {
        expect(demo.id_ajudante).toBeDefined();
      });

      // Check assistant pairing rules
      demonstrations.forEach(demo => {
        const mainStudent = mockStudents.find(s => s.id === demo.id_estudante);
        const assistant = mockStudents.find(s => s.id === demo.id_ajudante);
        
        const areFamilyMembers = mockFamilyRelationships.get(mainStudent!.id)?.includes(assistant!.id);
        const sameGender = mainStudent?.genero === assistant?.genero;
        
        // Should be same gender or family members
        expect(sameGender || areFamilyMembers).toBe(true);
      });
    });

    it('should distribute assignments fairly', async () => {
      const result = await generateAssignments(
        mockStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      expect(result.sucesso).toBe(true);
      expect(result.estatisticas).toBeDefined();

      // Check gender distribution
      expect(result.estatisticas.distribuicaoPorGenero.masculino).toBeGreaterThan(0);
      expect(result.estatisticas.distribuicaoPorGenero.feminino).toBeGreaterThan(0);

      // Check that assignments are distributed among different students
      const allParticipants = new Set([
        ...result.designacoes.map(d => d.id_estudante),
        ...result.designacoes.map(d => d.id_ajudante).filter(Boolean)
      ]);
      
      expect(allParticipants.size).toBeGreaterThan(5); // Should involve multiple students
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle limited qualified students', async () => {
      // Reduce qualified students to create constraints
      const limitedStudents = mockStudents.filter(s => 
        s.genero === 'masculino' ? ['anciao', 'servo_ministerial'].includes(s.cargo) : true
      );

      const result = await generateAssignments(
        limitedStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      // Should still succeed but might have warnings
      expect(result.sucesso).toBe(true);
      expect(result.designacoes).toHaveLength(5);
    });

    it('should handle students with many recent assignments', async () => {
      // Set most students to have many recent assignments
      const overloadedHistories = new Map();
      mockStudents.forEach((student, index) => {
        const assignmentCount = index < 10 ? 4 : 0; // First 10 students overloaded
        overloadedHistories.set(student.id, createMockHistory(student.id, assignmentCount, '2023-12-15'));
      });

      const result = await generateAssignments(
        mockStudents,
        mockQualifications,
        overloadedHistories,
        mockFamilyRelationships,
        mockOptions
      );

      expect(result.sucesso).toBe(true);
      // The engine should still generate assignments even with overloaded students
      expect(result.designacoes.length).toBeGreaterThan(0);
    });

    it('should handle complex family relationships', async () => {
      // Create assignments that should prefer family members
      const familyOnlyOptions = {
        ...mockOptions,
        preferir_pares_familiares: true
      };

      const result = await generateAssignments(
        mockStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        familyOnlyOptions
      );

      expect(result.sucesso).toBe(true);
      expect(result.estatisticas.paresFamiliares).toBeGreaterThan(0);
    });

    it('should handle multiple weeks of assignments', async () => {
      const weeks = ['2024-01-01', '2024-01-08', '2024-01-15', '2024-01-22'];
      const allAssignments = [];

      for (const week of weeks) {
        const weekOptions = { ...mockOptions, data_inicio_semana: week };
        const result = await generateAssignments(
          mockStudents,
          mockQualifications,
          mockHistories,
          mockFamilyRelationships,
          weekOptions
        );

        expect(result.sucesso).toBe(true);
        allAssignments.push(...result.designacoes);

        // Update histories to reflect new assignments
        result.designacoes.forEach(assignment => {
          const history = mockHistories.get(assignment.id_estudante);
          if (history) {
            history.total_designacoes_8_semanas += 1;
            history.ultima_designacao = week;
          }
        });
      }

      // Check that assignments are distributed over time
      const studentAssignmentCounts = new Map<string, number>();
      allAssignments.forEach(assignment => {
        const count = studentAssignmentCounts.get(assignment.id_estudante) || 0;
        studentAssignmentCounts.set(assignment.id_estudante, count + 1);
      });

      // No student should have too many assignments
      const maxAssignments = Math.max(...studentAssignmentCounts.values());
      expect(maxAssignments).toBeLessThanOrEqual(3); // Reasonable distribution
    });
  });

  describe('Performance Tests', () => {
    it('should handle large congregation efficiently', async () => {
      // Create a large congregation
      const largeStudentList: EstudanteRow[] = [];
      const largeQualifications = new Map<string, StudentQualifications>();
      const largeHistories = new Map<string, HistoricoDesignacao>();

      for (let i = 0; i < 200; i++) {
        const student = createMockStudent(
          `student-${i}`,
          `Student ${i}`,
          i % 2 === 0 ? 'masculino' : 'feminino',
          i % 5 === 0 ? 'anciao' : i % 4 === 0 ? 'servo_ministerial' : 'publicador_batizado'
        );
        largeStudentList.push(student);
        largeQualifications.set(student.id, createMockQualifications(student.id));
        largeHistories.set(student.id, createMockHistory(student.id, i % 3));
      }

      const startTime = Date.now();

      const result = await generateAssignments(
        largeStudentList,
        largeQualifications,
        largeHistories,
        mockFamilyRelationships,
        mockOptions
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.sucesso).toBe(true);
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.designacoes).toHaveLength(5);
    });

    it('should validate large assignment sets efficiently', async () => {
      // Generate many assignments
      const manyAssignments = [];
      for (let i = 0; i < 100; i++) {
        const studentId = mockStudents[i % mockStudents.length].id;
        const assistantId = mockStudents[(i + 1) % mockStudents.length].id;
        
        manyAssignments.push({
          id_estudante: studentId,
          id_ajudante: assistantId,
          numero_parte: 4 + (i % 4),
          titulo_parte: `Parte ${4 + (i % 4)}`,
          tipo_parte: 'demonstracao' as TipoParteS38T,
          tempo_minutos: 5,
          data_inicio_semana: `2024-01-${String(1 + (i % 28)).padStart(2, '0')}`,
          confirmado: false
        });
      }

      const validationContext: ValidationContext = {
        students: new Map(mockStudents.map(s => [s.id, s])),
        qualifications: mockQualifications,
        familyRelationships: mockFamilyRelationships,
        assignmentHistory: new Map(),
        weekDate: '2024-01-01',
        existingAssignments: []
      };

      const startTime = Date.now();
      const result = validateAssignments(manyAssignments, validationContext);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle no available students gracefully', async () => {
      const result = await generateAssignments(
        [], // No students
        new Map(),
        new Map(),
        new Map(),
        mockOptions
      );

      expect(result.sucesso).toBe(false);
      expect(result.erros.length).toBeGreaterThan(0);
      expect(result.designacoes).toHaveLength(0);
    });

    it('should handle impossible constraints gracefully', async () => {
      // Create scenario where no men are available for Bible reading
      const femaleOnlyStudents = mockStudents.filter(s => s.genero === 'feminino');
      
      const result = await generateAssignments(
        femaleOnlyStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      expect(result.sucesso).toBe(false);
      expect(result.erros.length).toBeGreaterThan(0);
      // Check that some error message exists about assignment generation
      expect(result.erros.some(error => error.includes('Parte 3') || error.includes('designação'))).toBe(true);
    });

    it('should handle corrupted data gracefully', async () => {
      // Create student with missing required fields
      const corruptedStudents = [
        { ...mockStudents[0], genero: undefined as any },
        { ...mockStudents[1], cargo: undefined as any }
      ];

      const result = await generateAssignments(
        corruptedStudents as EstudanteRow[],
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      // Should handle gracefully without crashing
      expect(result).toBeDefined();
      expect(result.sucesso).toBeDefined();
    });

    it('should validate assignments with missing context data', async () => {
      const assignment = {
        id_estudante: 'nonexistent-student',
        numero_parte: 4,
        titulo_parte: 'Parte 4',
        tipo_parte: 'demonstracao' as TipoParteS38T,
        tempo_minutos: 5,
        data_inicio_semana: '2024-01-01',
        confirmado: false
      };

      const validationContext: ValidationContext = {
        students: new Map(),
        qualifications: new Map(),
        familyRelationships: new Map(),
        assignmentHistory: new Map(),
        weekDate: '2024-01-01',
        existingAssignments: []
      };

      const result = validateAssignments([assignment], validationContext);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          ruleId: 'student_not_found'
        })
      );
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical congregation meeting assignment', async () => {
      // Simulate a real congregation with typical constraints
      const result = await generateAssignments(
        mockStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        mockOptions
      );

      expect(result.sucesso).toBe(true);
      expect(result.designacoes).toHaveLength(5);

      // Verify realistic assignment distribution
      const stats = result.estatisticas;
      expect(stats.totalDesignacoes).toBe(5);
      expect(stats.estudantesComAjudante).toBe(3); // 3 demonstrations
      expect(stats.distribuicaoPorGenero.masculino).toBeGreaterThanOrEqual(2); // Bible reading + talk minimum
      expect(stats.distribuicaoPorGenero.feminino).toBeGreaterThan(0); // Some demonstrations
    });

    it('should handle circuit overseer visit week (modified program)', async () => {
      // Circuit overseer visit typically has different program structure
      const coVisitOptions = {
        ...mockOptions,
        partes: [
          createMockPart(3, 'leitura_biblica', false, 'masculino'),
          createMockPart(4, 'demonstracao', true),
          // No parts 5-7 during CO visit
        ]
      };

      const result = await generateAssignments(
        mockStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        coVisitOptions
      );

      expect(result.sucesso).toBe(true);
      expect(result.designacoes).toHaveLength(2);
    });

    it('should handle Memorial week (no meeting)', async () => {
      const memorialOptions = {
        ...mockOptions,
        partes: [] // No regular meeting parts during Memorial week
      };

      const result = await generateAssignments(
        mockStudents,
        mockQualifications,
        mockHistories,
        mockFamilyRelationships,
        memorialOptions
      );

      expect(result.sucesso).toBe(true);
      expect(result.designacoes).toHaveLength(0);
      expect(result.estatisticas.totalDesignacoes).toBe(0);
    });
  });
});