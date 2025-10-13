import { describe, it, expect, vi } from 'vitest';
import { AnalyticsEngine } from '../analyticsEngine';
import { beforeEach } from 'node:test';

// Mock Supabase client completely
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          gte: vi.fn(() => ({
            lte: vi.fn()
          })),
          order: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn()
            }))
          }))
        })),
        gte: vi.fn(() => ({
          lte: vi.fn()
        })),
        order: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn()
          }))
        }))
      }))
    }))
  }
}));

describe('AnalyticsEngine', () => {
  let analyticsEngine: AnalyticsEngine;

  beforeEach(() => {
    analyticsEngine = new AnalyticsEngine();
  });

  describe('Core Functionality Tests', () => {
    it('should instantiate AnalyticsEngine correctly', () => {
      expect(analyticsEngine).toBeInstanceOf(AnalyticsEngine);
    });

    it('should have all required methods', () => {
      expect(typeof analyticsEngine.calculateParticipationMetrics).toBe('function');
      expect(typeof analyticsEngine.calculateAssignmentDistribution).toBe('function');
      expect(typeof analyticsEngine.calculateStudentProgress).toBe('function');
      expect(typeof analyticsEngine.getAssignmentFrequencyAnalysis).toBe('function');
    });
  });

  describe('Data Processing Logic Tests', () => {
    it('should group assignments by type correctly', () => {
      const assignments = [
        { titulo_parte: 'bible_reading' },
        { titulo_parte: 'bible_reading' },
        { titulo_parte: 'starting_conversation' },
        { titulo_parte: null }
      ];

      // Access private method for testing
      const groupedAssignments = (analyticsEngine as any).groupAssignmentsByType(assignments);

      expect(groupedAssignments).toEqual({
        'bible_reading': 2,
        'starting_conversation': 1,
        'unknown': 1
      });
    });

    it('should calculate average time between assignments correctly', () => {
      const assignments = [
        { data_designacao: '2024-01-01' },
        { data_designacao: '2024-01-15' }, // 14 days later
        { data_designacao: '2024-02-01' }  // 17 days later
      ];

      const averageTime = (analyticsEngine as any).calculateAverageTimeBetweenAssignments(assignments);

      expect(averageTime).toBe(16); // (14 + 17) / 2 = 15.5, rounded to 16
    });

    it('should handle empty assignments for average time calculation', () => {
      const assignments: any[] = [];
      const averageTime = (analyticsEngine as any).calculateAverageTimeBetweenAssignments(assignments);
      expect(averageTime).toBe(0);

      const singleAssignment = [{ data_designacao: '2024-01-01' }];
      const singleAverageTime = (analyticsEngine as any).calculateAverageTimeBetweenAssignments(singleAssignment);
      expect(singleAverageTime).toBe(0);
    });

    it('should calculate participation rate correctly', () => {
      const assignments = [
        { data_designacao: '2024-01-01' },
        { data_designacao: '2024-01-15' }
      ];

      const dateRange = {
        startDate: '2024-01-01',
        endDate: '2024-01-31' // 31 days = ~4.4 weeks
      };

      const participationRate = (analyticsEngine as any).calculateParticipationRate(assignments, dateRange);

      expect(participationRate).toBeGreaterThan(0);
      expect(participationRate).toBeLessThanOrEqual(100);
    });

    it('should return 100% participation rate when no date range provided', () => {
      const assignments = [{ data_designacao: '2024-01-01' }];
      const participationRate = (analyticsEngine as any).calculateParticipationRate(assignments);
      expect(participationRate).toBe(100);
    });

    it('should calculate skill development score based on variety and activity', () => {
      const assignments = [
        {
          tipo_designacao: 'bible_reading',
          data_designacao: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          tipo_designacao: 'starting_conversation',
          data_designacao: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ];

      const skillScore = (analyticsEngine as any).calculateSkillDevelopmentScore(assignments);

      expect(skillScore).toBeGreaterThan(0);
      expect(skillScore).toBeLessThanOrEqual(100);
    });

    it('should return 0 skill score for empty assignments', () => {
      const assignments: any[] = [];
      const skillScore = (analyticsEngine as any).calculateSkillDevelopmentScore(assignments);
      expect(skillScore).toBe(0);
    });

    it('should get last assignment date correctly', () => {
      const assignments = [
        { data_designacao: '2024-01-01' },
        { data_designacao: '2024-01-15' },
        { data_designacao: '2024-01-10' }
      ];

      const lastDate = (analyticsEngine as any).getLastAssignmentDate(assignments);
      expect(lastDate).toBe('2024-01-15'); // Most recent date
    });

    it('should return null for last assignment date when no assignments', () => {
      const assignments: any[] = [];
      const lastDate = (analyticsEngine as any).getLastAssignmentDate(assignments);
      expect(lastDate).toBeNull();
    });

    it('should calculate performance score correctly', () => {
      const assignment = {
        tempo_minutos: 4, // Ideal time
        observacoes: 'Excellent presentation, very good work'
      };

      const performanceScore = (analyticsEngine as any).calculatePerformanceScore(assignment);

      expect(performanceScore).toBeGreaterThan(50);
      expect(performanceScore).toBeLessThanOrEqual(100);
    });

    it('should handle assignment without timing or notes', () => {
      const assignment = {
        tempo_minutos: null,
        observacoes: null
      };

      const performanceScore = (analyticsEngine as any).calculatePerformanceScore(assignment);

      expect(performanceScore).toBe(50); // Base score
    });

    it('should calculate skill progression correctly', () => {
      const assignmentHistory = [
        { performanceScore: 80, date: '2024-01-15' },
        { performanceScore: 75, date: '2024-01-10' },
        { performanceScore: 70, date: '2024-01-05' },
        { performanceScore: 85, date: '2024-01-01' }
      ];

      const skillProgression = (analyticsEngine as any).calculateSkillProgression(assignmentHistory);

      expect(skillProgression).toHaveLength(4); // presentation, timing, preparation, engagement
      expect(skillProgression[0]).toHaveProperty('skill');
      expect(skillProgression[0]).toHaveProperty('currentLevel');
      expect(skillProgression[0]).toHaveProperty('previousLevel');
      expect(skillProgression[0]).toHaveProperty('improvementTrend');
    });

    it('should identify improvement areas from counsel notes', () => {
      const assignmentHistory = [
        { counselNotes: 'Good timing but needs work on eye contact' },
        { counselNotes: 'Excellent preparation, improve timing' },
        { counselNotes: 'Work on audience engagement' }
      ];

      const skillProgression = [
        { skill: 'timing', improvementTrend: 'declining', currentLevel: 40 }
      ];

      const improvementAreas = (analyticsEngine as any).identifyImprovementAreas(assignmentHistory, skillProgression);

      expect(improvementAreas).toContain('timing');
      expect(improvementAreas).toContain('time management');
      expect(improvementAreas).toContain('audience engagement');
    });

    it('should identify strengths from counsel notes and skill progression', () => {
      const assignmentHistory = [
        { counselNotes: 'Excellent presentation, outstanding work' },
        { counselNotes: 'Very clear and articulate delivery' },
        { counselNotes: 'Confident and natural presentation' }
      ];

      const skillProgression = [
        { skill: 'presentation', improvementTrend: 'improving', currentLevel: 85 }
      ];

      const strengths = (analyticsEngine as any).identifyStrengths(assignmentHistory, skillProgression);

      expect(strengths).toContain('presentation');
      expect(strengths).toContain('overall performance');
      expect(strengths).toContain('communication clarity');
      expect(strengths).toContain('confidence');
    });

    it('should recommend next assignment based on history', () => {
      const student = { qualificacoes: {} };
      const assignmentHistory = [
        { partType: 'bible_reading' },
        { partType: 'bible_reading' },
        { partType: 'starting_conversation' }
      ];

      const recommendation = (analyticsEngine as any).recommendNextAssignment(student, assignmentHistory);

      // Should recommend a type not recently used
      expect(['making_disciples', 'following_up']).toContain(recommendation);
    });

    it('should return null when no recommendation available', () => {
      const student = { qualificacoes: {} };
      const assignmentHistory = [
        { partType: 'bible_reading' },
        { partType: 'starting_conversation' },
        { partType: 'following_up' },
        { partType: 'making_disciples' } // Add all available types
      ];

      const recommendation = (analyticsEngine as any).recommendNextAssignment(student, assignmentHistory);

      expect(recommendation).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined values in assignments', () => {
      const assignments = [
        { titulo_parte: null, data_designacao: null },
        { titulo_parte: undefined, data_designacao: undefined },
        { titulo_parte: 'bible_reading', data_designacao: '2024-01-01' }
      ];

      const grouped = (analyticsEngine as any).groupAssignmentsByType(assignments);
      expect(grouped['unknown']).toBe(2);
      expect(grouped['bible_reading']).toBe(1);
    });

    it('should handle assignments with invalid dates', () => {
      const assignments = [
        { data_designacao: 'invalid-date' },
        { data_designacao: '2024-01-01' },
        { data_designacao: null }
      ];

      const averageTime = (analyticsEngine as any).calculateAverageTimeBetweenAssignments(assignments);
      expect(typeof averageTime).toBe('number');
    });

    it('should handle extreme performance scores', () => {
      const assignment = {
        tempo_minutos: 20, // Very long time
        observacoes: 'Needs significant improvement in all areas'
      };

      const performanceScore = (analyticsEngine as any).calculatePerformanceScore(assignment);

      expect(performanceScore).toBeGreaterThanOrEqual(0);
      expect(performanceScore).toBeLessThanOrEqual(100);
    });

    it('should handle empty skill progression data', () => {
      const assignmentHistory: any[] = [];
      const skillProgression = (analyticsEngine as any).calculateSkillProgression(assignmentHistory);

      expect(skillProgression).toHaveLength(4);
      skillProgression.forEach(skill => {
        expect(skill.currentLevel).toBe(50); // Default level
        expect(skill.previousLevel).toBe(50);
        expect(skill.improvementTrend).toBe('stable');
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large assignment datasets efficiently', () => {
      const largeAssignmentSet = Array.from({ length: 1000 }, (_, i) => ({
        titulo_parte: `assignment_type_${i % 5}`,
        data_designacao: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tempo_minutos: 3 + (i % 5),
        observacoes: `Test assignment ${i}`
      }));

      const startTime = Date.now();
      const grouped = (analyticsEngine as any).groupAssignmentsByType(largeAssignmentSet);
      const endTime = Date.now();

      expect(Object.keys(grouped)).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should calculate skill scores efficiently for large datasets', () => {
      const largeAssignmentSet = Array.from({ length: 500 }, (_, i) => ({
        tipo_designacao: `type_${i % 10}`,
        data_designacao: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));

      const startTime = Date.now();
      const skillScore = (analyticsEngine as any).calculateSkillDevelopmentScore(largeAssignmentSet);
      const endTime = Date.now();

      expect(skillScore).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(50); // Should complete within 50ms
    });
  });

  describe('Data Validation and Accuracy', () => {
    it('should ensure participation rates are within valid range', () => {
      const testCases = [
        { assignments: [], dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' } },
        { assignments: [{ data_designacao: '2024-01-15' }], dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' } },
        { assignments: Array.from({ length: 10 }, (_, i) => ({ data_designacao: `2024-01-${i + 1}` })), dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' } }
      ];

      testCases.forEach(testCase => {
        const rate = (analyticsEngine as any).calculateParticipationRate(testCase.assignments, testCase.dateRange);
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(100);
      });
    });

    it('should ensure skill development scores are within valid range', () => {
      const testCases = [
        [], // Empty
        [{ tipo_designacao: 'bible_reading', data_designacao: '2024-01-01' }], // Single
        Array.from({ length: 20 }, (_, i) => ({ tipo_designacao: `type_${i % 3}`, data_designacao: '2024-01-01' })) // Multiple
      ];

      testCases.forEach(assignments => {
        const score = (analyticsEngine as any).calculateSkillDevelopmentScore(assignments);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('should ensure performance scores are calculated consistently', () => {
      const baseAssignment = { tempo_minutos: 4, observacoes: 'Good presentation' };
      
      // Multiple calculations should be consistent
      const score1 = (analyticsEngine as any).calculatePerformanceScore(baseAssignment);
      const score2 = (analyticsEngine as any).calculatePerformanceScore(baseAssignment);
      
      expect(score1).toBe(score2);
      expect(score1).toBeGreaterThanOrEqual(0);
      expect(score1).toBeLessThanOrEqual(100);
    });
  });
});