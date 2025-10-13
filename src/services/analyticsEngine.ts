import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

// Type definitions for analytics
export interface ParticipationMetrics {
  studentId: string;
  studentName: string;
  totalAssignments: number;
  assignmentsByType: Record<string, number>;
  averageTimeBetweenAssignments: number;
  lastAssignmentDate: string | null;
  participationRate: number;
  skillDevelopmentScore: number;
}

export interface AssignmentDistributionMetrics {
  totalStudents: number;
  activeStudents: number;
  averageAssignmentsPerStudent: number;
  assignmentDistributionBalance: number;
  underutilizedStudents: string[];
  overutilizedStudents: string[];
}

export interface StudentProgressMetrics {
  studentId: string;
  studentName: string;
  assignmentHistory: AssignmentHistoryItem[];
  skillProgression: SkillProgressionItem[];
  improvementAreas: string[];
  strengths: string[];
  nextRecommendedAssignment: string | null;
}

export interface AssignmentHistoryItem {
  id: string;
  date: string;
  partType: string;
  title: string;
  duration: number | null;
  counselNotes: string | null;
  performanceScore: number | null;
}

export interface SkillProgressionItem {
  skill: string;
  currentLevel: number;
  previousLevel: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  lastAssessmentDate: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export class AnalyticsEngine {
  /**
   * Calculate participation metrics for all students
   */
  async calculateParticipationMetrics(
    dateRange?: DateRange
  ): Promise<ParticipationMetrics[]> {
    try {
      // Build query with optional date filtering
      let query = supabase
        .from('designacoes')
        .select(`
          *,
          estudante:estudantes!estudante_id(id, nome),
          ajudante:estudantes!ajudante_id(id, nome)
        `);

      if (dateRange) {
        query = query
          .gte('data_designacao', dateRange.startDate)
          .lte('data_designacao', dateRange.endDate);
      }

      const { data: assignments, error } = await query;

      if (error) throw error;

      // Get all students
      const { data: students, error: studentsError } = await supabase
        .from('estudantes')
        .select('id, nome, ativo')
        .eq('ativo', true);

      if (studentsError) throw studentsError;

      const metrics: ParticipationMetrics[] = [];

      for (const student of students) {
        const studentAssignments = assignments?.filter(
          (assignment) => assignment.estudante_id === student.id
        ) || [];

        const assignmentsByType = this.groupAssignmentsByType(studentAssignments);
        const averageTimeBetween = this.calculateAverageTimeBetweenAssignments(studentAssignments);
        const participationRate = this.calculateParticipationRate(studentAssignments, dateRange);
        const skillScore = this.calculateSkillDevelopmentScore(studentAssignments);

        metrics.push({
          studentId: student.id,
          studentName: student.nome,
          totalAssignments: studentAssignments.length,
          assignmentsByType,
          averageTimeBetweenAssignments: averageTimeBetween,
          lastAssignmentDate: this.getLastAssignmentDate(studentAssignments),
          participationRate,
          skillDevelopmentScore: skillScore,
        });
      }

      return metrics.sort((a, b) => b.totalAssignments - a.totalAssignments);
    } catch (error) {
      console.error('Error calculating participation metrics:', error);
      throw error;
    }
  }

  /**
   * Analyze assignment distribution balance and fairness
   */
  async calculateAssignmentDistribution(
    dateRange?: DateRange
  ): Promise<AssignmentDistributionMetrics> {
    try {
      const participationMetrics = await this.calculateParticipationMetrics(dateRange);
      
      const totalStudents = participationMetrics.length;
      const activeStudents = participationMetrics.filter(m => m.totalAssignments > 0).length;
      const totalAssignments = participationMetrics.reduce((sum, m) => sum + m.totalAssignments, 0);
      const averageAssignments = totalAssignments / totalStudents;

      // Calculate balance score (lower is better, 0 = perfect balance)
      const variance = participationMetrics.reduce(
        (sum, m) => sum + Math.pow(m.totalAssignments - averageAssignments, 2),
        0
      ) / totalStudents;
      const balanceScore = Math.sqrt(variance) / averageAssignments;

      // Identify under/over-utilized students (more than 1 standard deviation from mean)
      const standardDeviation = Math.sqrt(variance);
      const underutilized = participationMetrics
        .filter(m => m.totalAssignments < averageAssignments - standardDeviation)
        .map(m => m.studentId);
      const overutilized = participationMetrics
        .filter(m => m.totalAssignments > averageAssignments + standardDeviation)
        .map(m => m.studentId);

      return {
        totalStudents,
        activeStudents,
        averageAssignmentsPerStudent: Math.round(averageAssignments * 100) / 100,
        assignmentDistributionBalance: Math.round(balanceScore * 100) / 100,
        underutilizedStudents: underutilized,
        overutilizedStudents: overutilized,
      };
    } catch (error) {
      console.error('Error calculating assignment distribution:', error);
      throw error;
    }
  }

  /**
   * Track individual student progress and development
   */
  async calculateStudentProgress(
    studentId: string,
    dateRange?: DateRange
  ): Promise<StudentProgressMetrics> {
    try {
      // Get student info
      const { data: student, error: studentError } = await supabase
        .from('estudantes')
        .select('id, nome, qualificacoes')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // Get assignment history
      let query = supabase
        .from('designacoes')
        .select('*')
        .eq('estudante_id', studentId)
        .order('data_designacao', { ascending: false });

      if (dateRange) {
        query = query
          .gte('data_designacao', dateRange.startDate)
          .lte('data_designacao', dateRange.endDate);
      }

      const { data: assignments, error: assignmentsError } = await query;

      if (assignmentsError) throw assignmentsError;

      const assignmentHistory: AssignmentHistoryItem[] = assignments?.map(assignment => ({
        id: assignment.id,
        date: assignment.data_designacao || '',
        partType: assignment.titulo_parte || 'unknown',
        title: assignment.titulo_parte || '',
        duration: assignment.tempo_minutos,
        counselNotes: assignment.observacoes,
        performanceScore: this.calculatePerformanceScore(assignment),
      })) || [];

      const skillProgression = this.calculateSkillProgression(assignmentHistory);
      const improvementAreas = this.identifyImprovementAreas(assignmentHistory, skillProgression);
      const strengths = this.identifyStrengths(assignmentHistory, skillProgression);
      const nextRecommendation = this.recommendNextAssignment(student, assignmentHistory);

      return {
        studentId: student.id,
        studentName: student.nome,
        assignmentHistory,
        skillProgression,
        improvementAreas,
        strengths,
        nextRecommendedAssignment: nextRecommendation,
      };
    } catch (error) {
      console.error('Error calculating student progress:', error);
      throw error;
    }
  }

  /**
   * Get assignment frequency analysis for balanced distribution
   */
  async getAssignmentFrequencyAnalysis(dateRange?: DateRange): Promise<{
    byStudent: Record<string, number>;
    byPartType: Record<string, number>;
    byMonth: Record<string, number>;
  }> {
    try {
      let query = supabase
        .from('designacoes')
        .select(`
          *,
          estudante:estudantes!estudante_id(nome)
        `);

      if (dateRange) {
        query = query
          .gte('data_designacao', dateRange.startDate)
          .lte('data_designacao', dateRange.endDate);
      }

      const { data: assignments, error } = await query;

      if (error) throw error;

      const byStudent: Record<string, number> = {};
      const byPartType: Record<string, number> = {};
      const byMonth: Record<string, number> = {};

      assignments?.forEach(assignment => {
        // By student
        const studentName = assignment.estudante?.nome || 'Unknown';
        byStudent[studentName] = (byStudent[studentName] || 0) + 1;

        // By part type
        const partType = assignment.titulo_parte || 'unknown';
        byPartType[partType] = (byPartType[partType] || 0) + 1;

        // By month
        if (assignment.data_designacao) {
          const month = assignment.data_designacao.substring(0, 7); // YYYY-MM
          byMonth[month] = (byMonth[month] || 0) + 1;
        }
      });

      return { byStudent, byPartType, byMonth };
    } catch (error) {
      console.error('Error getting assignment frequency analysis:', error);
      throw error;
    }
  }

  // Private helper methods
  private groupAssignmentsByType(assignments: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    assignments.forEach(assignment => {
      const type = assignment.titulo_parte || 'unknown';
      grouped[type] = (grouped[type] || 0) + 1;
    });
    return grouped;
  }

  private calculateAverageTimeBetweenAssignments(assignments: any[]): number {
    if (assignments.length < 2) return 0;

    const sortedAssignments = assignments
      .filter(a => a.data_designacao)
      .sort((a, b) => new Date(a.data_designacao).getTime() - new Date(b.data_designacao).getTime());

    let totalDays = 0;
    for (let i = 1; i < sortedAssignments.length; i++) {
      const prevDate = new Date(sortedAssignments[i - 1].data_designacao);
      const currDate = new Date(sortedAssignments[i].data_designacao);
      totalDays += (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    }

    return Math.round(totalDays / (sortedAssignments.length - 1));
  }

  private calculateParticipationRate(assignments: any[], dateRange?: DateRange): number {
    if (!dateRange) return 100; // If no date range, assume 100% participation

    const rangeStart = new Date(dateRange.startDate);
    const rangeEnd = new Date(dateRange.endDate);
    const totalWeeks = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
    
    const assignmentWeeks = new Set(
      assignments
        .filter(a => a.data_designacao)
        .map(a => {
          const date = new Date(a.data_designacao);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          return weekStart.toISOString().substring(0, 10);
        })
    );

    return Math.round((assignmentWeeks.size / totalWeeks) * 100);
  }

  private calculateSkillDevelopmentScore(assignments: any[]): number {
    if (assignments.length === 0) return 0;

    // Simple scoring based on assignment variety and frequency
    const uniqueTypes = new Set(assignments.map(a => a.tipo_designacao)).size;
    const recentAssignments = assignments.filter(a => {
      if (!a.data_designacao) return false;
      const assignmentDate = new Date(a.data_designacao);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return assignmentDate >= threeMonthsAgo;
    }).length;

    // Score based on variety (0-50) and recent activity (0-50)
    const varietyScore = Math.min(uniqueTypes * 10, 50);
    const activityScore = Math.min(recentAssignments * 5, 50);

    return varietyScore + activityScore;
  }

  private getLastAssignmentDate(assignments: any[]): string | null {
    const sortedAssignments = assignments
      .filter(a => a.data_designacao)
      .sort((a, b) => new Date(b.data_designacao).getTime() - new Date(a.data_designacao).getTime());

    return sortedAssignments.length > 0 ? sortedAssignments[0].data_designacao : null;
  }

  private calculatePerformanceScore(assignment: any): number | null {
    // Simple performance scoring based on available data
    let score = 50; // Base score

    // Adjust based on timing (if available)
    if (assignment.tempo_minutos) {
      // Assume ideal time varies by part type, but generally 3-5 minutes
      const idealTime = 4;
      const timeDiff = Math.abs(assignment.tempo_minutos - idealTime);
      score += Math.max(0, 20 - timeDiff * 5); // Penalty for being too far from ideal
    }

    // Adjust based on counsel notes (if positive indicators present)
    if (assignment.observacoes) {
      const positiveWords = ['good', 'excellent', 'improved', 'clear', 'confident'];
      const negativeWords = ['needs', 'work on', 'improve', 'unclear', 'nervous'];
      
      const notes = assignment.observacoes.toLowerCase();
      positiveWords.forEach(word => {
        if (notes.includes(word)) score += 5;
      });
      negativeWords.forEach(word => {
        if (notes.includes(word)) score -= 3;
      });
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateSkillProgression(assignmentHistory: AssignmentHistoryItem[]): SkillProgressionItem[] {
    const skills = ['presentation', 'timing', 'preparation', 'engagement'];
    const progression: SkillProgressionItem[] = [];

    skills.forEach(skill => {
      const recentAssignments = assignmentHistory.slice(0, 5); // Last 5 assignments
      const olderAssignments = assignmentHistory.slice(5, 10); // Previous 5 assignments

      const recentAvg = this.calculateSkillAverage(recentAssignments, skill);
      const olderAvg = this.calculateSkillAverage(olderAssignments, skill);

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (recentAvg > olderAvg + 5) trend = 'improving';
      else if (recentAvg < olderAvg - 5) trend = 'declining';

      progression.push({
        skill,
        currentLevel: recentAvg,
        previousLevel: olderAvg,
        improvementTrend: trend,
        lastAssessmentDate: assignmentHistory[0]?.date || new Date().toISOString(),
      });
    });

    return progression;
  }

  private calculateSkillAverage(assignments: AssignmentHistoryItem[], skill: string): number {
    if (assignments.length === 0) return 50;

    const scores = assignments
      .map(a => a.performanceScore || 50)
      .filter(score => score !== null);

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private identifyImprovementAreas(
    assignmentHistory: AssignmentHistoryItem[],
    skillProgression: SkillProgressionItem[]
  ): string[] {
    const areas: string[] = [];

    // Based on skill progression trends
    skillProgression.forEach(skill => {
      if (skill.improvementTrend === 'declining' || skill.currentLevel < 60) {
        areas.push(skill.skill);
      }
    });

    // Based on counsel notes patterns
    const commonIssues = assignmentHistory
      .map(a => a.counselNotes?.toLowerCase() || '')
      .join(' ');

    if (commonIssues.includes('timing') || commonIssues.includes('time')) {
      areas.push('time management');
    }
    if (commonIssues.includes('eye contact') || commonIssues.includes('audience')) {
      areas.push('audience engagement');
    }
    if (commonIssues.includes('preparation') || commonIssues.includes('research')) {
      areas.push('preparation');
    }

    return [...new Set(areas)]; // Remove duplicates
  }

  private identifyStrengths(
    assignmentHistory: AssignmentHistoryItem[],
    skillProgression: SkillProgressionItem[]
  ): string[] {
    const strengths: string[] = [];

    // Based on skill progression trends
    skillProgression.forEach(skill => {
      if (skill.improvementTrend === 'improving' || skill.currentLevel > 80) {
        strengths.push(skill.skill);
      }
    });

    // Based on counsel notes patterns
    const commonPraise = assignmentHistory
      .map(a => a.counselNotes?.toLowerCase() || '')
      .join(' ');

    if (commonPraise.includes('excellent') || commonPraise.includes('outstanding')) {
      strengths.push('overall performance');
    }
    if (commonPraise.includes('clear') || commonPraise.includes('articulate')) {
      strengths.push('communication clarity');
    }
    if (commonPraise.includes('confident') || commonPraise.includes('natural')) {
      strengths.push('confidence');
    }

    return [...new Set(strengths)]; // Remove duplicates
  }

  private recommendNextAssignment(student: any, assignmentHistory: AssignmentHistoryItem[]): string | null {
    // Simple recommendation logic based on assignment history and qualifications
    const recentTypes = assignmentHistory.slice(0, 3).map(a => a.partType);
    const qualifications = student.qualificacoes || {};

    // Avoid repeating the same type too frequently
    const availableTypes = ['bible_reading', 'starting_conversation', 'following_up', 'making_disciples'];
    const lessUsedTypes = availableTypes.filter(type => !recentTypes.includes(type));

    if (lessUsedTypes.length > 0) {
      return lessUsedTypes[0];
    }

    return null;
  }
}

// Export singleton instance
export const analyticsEngine = new AnalyticsEngine();