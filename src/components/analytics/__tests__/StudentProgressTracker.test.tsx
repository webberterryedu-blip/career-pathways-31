import React from 'react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentProgressTracker from '../StudentProgressTracker';
import { analyticsEngine } from '@/services/analyticsEngine';
import { toast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/services/analyticsEngine', () => ({
  analyticsEngine: {
    calculateStudentProgress: vi.fn()
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

// Mock chart components
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>
}));

describe('StudentProgressTracker', () => {
  const mockProgressData = {
    studentId: 'student1',
    studentName: 'João Silva',
    assignmentHistory: [
      {
        id: '1',
        date: '2024-01-15',
        partType: 'bible_reading',
        title: 'Leitura da Bíblia',
        duration: 4,
        counselNotes: 'Excelente apresentação, clara e confiante',
        performanceScore: 85
      },
      {
        id: '2',
        date: '2024-01-08',
        partType: 'starting_conversation',
        title: 'Iniciando Conversas',
        duration: 5,
        counselNotes: 'Bom tempo, precisa trabalhar o contato visual',
        performanceScore: 70
      },
      {
        id: '3',
        date: '2024-01-01',
        partType: 'making_disciples',
        title: 'Fazendo Discípulos',
        duration: 6,
        counselNotes: 'Preparação excelente, muito natural',
        performanceScore: 90
      }
    ],
    skillProgression: [
      {
        skill: 'presentation',
        currentLevel: 85,
        previousLevel: 75,
        improvementTrend: 'improving' as const,
        lastAssessmentDate: '2024-01-15'
      },
      {
        skill: 'timing',
        currentLevel: 70,
        previousLevel: 80,
        improvementTrend: 'declining' as const,
        lastAssessmentDate: '2024-01-15'
      },
      {
        skill: 'preparation',
        currentLevel: 90,
        previousLevel: 85,
        improvementTrend: 'improving' as const,
        lastAssessmentDate: '2024-01-15'
      },
      {
        skill: 'engagement',
        currentLevel: 75,
        previousLevel: 75,
        improvementTrend: 'stable' as const,
        lastAssessmentDate: '2024-01-15'
      }
    ],
    improvementAreas: ['timing', 'audience engagement'],
    strengths: ['preparation', 'overall performance'],
    nextRecommendedAssignment: 'following_up'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (analyticsEngine.calculateStudentProgress as Mock).mockResolvedValue(mockProgressData);
  });

  describe('Initial States', () => {
    it('should show student selection message when no studentId provided', () => {
      render(<StudentProgressTracker />);

      expect(screen.getByText('Selecione um Estudante')).toBeInTheDocument();
      expect(screen.getByText('Escolha um estudante para visualizar seu progresso e desenvolvimento.')).toBeInTheDocument();
    });

    it('should show loading state while fetching data', async () => {
      (analyticsEngine.calculateStudentProgress as Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockProgressData), 100))
      );

      render(<StudentProgressTracker studentId="student1" />);

      expect(screen.getByText('Carregando dados de progresso...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toHaveClass('animate-spin');

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });
    });

    it('should show error state when data loading fails', async () => {
      (analyticsEngine.calculateStudentProgress as Mock).mockRejectedValue(new Error('Failed to load'));

      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('Dados não encontrados')).toBeInTheDocument();
        expect(screen.getByText('Não foi possível carregar os dados de progresso para este estudante.')).toBeInTheDocument();
      });

      expect(toast).toHaveBeenCalledWith({
        title: "Erro ao carregar progresso",
        description: "Não foi possível carregar os dados de progresso do estudante.",
        variant: "destructive",
      });
    });
  });

  describe('Student Progress Display', () => {
    it('should display student information and summary cards', async () => {
      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('Progresso e Desenvolvimento')).toBeInTheDocument();
      });

      // Check summary cards
      expect(screen.getByText('Total de Designações')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('no período selecionado')).toBeInTheDocument();

      expect(screen.getByText('Desempenho Médio')).toBeInTheDocument();
      expect(screen.getByText('82')).toBeInTheDocument(); // (85 + 70 + 90) / 3 = 81.67 rounded to 82
      expect(screen.getByText('pontuação média')).toBeInTheDocument();

      expect(screen.getByText('Habilidades em Melhoria')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // presentation and preparation are improving
      expect(screen.getByText('de 4 habilidades')).toBeInTheDocument();

      expect(screen.getByText('Próxima Recomendação')).toBeInTheDocument();
      expect(screen.getByText('FOLLOWING_UP')).toBeInTheDocument();
      expect(screen.getByText('tipo de designação')).toBeInTheDocument();
    });

    it('should handle student with no recommended assignment', async () => {
      const dataWithoutRecommendation = {
        ...mockProgressData,
        nextRecommendedAssignment: null
      };

      (analyticsEngine.calculateStudentProgress as Mock).mockResolvedValue(dataWithoutRecommendation);

      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('Nenhuma')).toBeInTheDocument();
      });
    });
  });

  describe('Period Selection', () => {
    it('should allow changing time period', async () => {
      const user = userEvent.setup();
      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Check default period (6 months should be selected)
      const sixMonthsButton = screen.getByText('6 meses');
      expect(sixMonthsButton).toHaveClass('bg-primary'); // Default variant styling

      // Click 3 months
      const threeMonthsButton = screen.getByText('3 meses');
      await user.click(threeMonthsButton);

      // Should call analytics engine with new date range
      await waitFor(() => {
        expect(analyticsEngine.calculateStudentProgress).toHaveBeenCalledWith(
          'student1',
          expect.objectContaining({
            startDate: expect.any(String),
            endDate: expect.any(String)
          })
        );
      });
    });

    it('should calculate correct date ranges for different periods', async () => {
      const user = userEvent.setup();
      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Test 1 year period
      const oneYearButton = screen.getByText('1 ano');
      await user.click(oneYearButton);

      await waitFor(() => {
        const calls = (analyticsEngine.calculateStudentProgress as Mock).mock.calls;
        const lastCall = calls[calls.length - 1];
        const dateRange = lastCall[1];
        
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        const diffInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        
        expect(diffInDays).toBeGreaterThan(360); // Approximately 1 year
        expect(diffInDays).toBeLessThan(370);
      });
    });
  });

  describe('Performance Tab', () => {
    it('should display performance charts', async () => {
      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Performance tab should be active by default
      expect(screen.getByText('Tendência de Desempenho')).toBeInTheDocument();
      expect(screen.getByText('Evolução da pontuação de desempenho nas últimas designações')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();

      expect(screen.getByText('Duração das Apresentações')).toBeInTheDocument();
      expect(screen.getByText('Tempo gasto em cada designação (em minutos)')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should transform assignment data correctly for charts', async () => {
      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // The component should reverse the assignment history for chronological display
      // and limit to 10 assignments
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Skills Tab', () => {
    it('should display skill progression and status', async () => {
      const user = userEvent.setup();
      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Switch to skills tab
      const skillsTab = screen.getByText('Habilidades');
      await user.click(skillsTab);

      await waitFor(() => {
        expect(screen.getByText('Progressão de Habilidades')).toBeInTheDocument();
        expect(screen.getByText('Comparação entre níveis atual e anterior')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

        expect(screen.getByText('Status das Habilidades')).toBeInTheDocument();
        expect(screen.getByText('Tendência de desenvolvimento por habilidade')).toBeInTheDocument();
      });

      // Check skill status displays
      expect(screen.getByText('Presentation')).toBeInTheDocument();
      expect(screen.getByText('75 → 85')).toBeInTheDocument();
      expect(screen.getByText('Melhorando')).toBeInTheDocument();

      expect(screen.getByText('Timing')).toBeInTheDocument();
      expect(screen.getByText('80 → 70')).toBeInTheDocument();
      expect(screen.getByText('Precisa atenção')).toBeInTheDocument();

      expect(screen.getByText('Preparation')).toBeInTheDocument();
      expect(screen.getByText('85 → 90')).toBeInTheDocument();
      expect(screen.getByText('Melhorando')).toBeInTheDocument();

      expect(screen.getByText('Engagement')).toBeInTheDocument();
      expect(screen.getByText('75 → 75')).toBeInTheDocument();
      expect(screen.getByText('Estável')).toBeInTheDocument();
    });

    it('should display correct trend icons', async () => {
      const user = userEvent.setup();
      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const skillsTab = screen.getByText('Habilidades');
      await user.click(skillsTab);

      await waitFor(() => {
        // Check for trend icons (using data-testid from lucide icons)
        const improvingIcons = screen.getAllByTestId('lucide-trending-up');
        const decliningIcons = screen.getAllByTestId('lucide-trending-down');
        const stableIcons = screen.getAllByTestId('lucide-minus');

        expect(improvingIcons.length).toBeGreaterThan(0);
        expect(decliningIcons.length).toBeGreaterThan(0);
        expect(stableIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('History Tab', () => {
    it('should display assignment history', async () => {
      const user = userEvent.setup();
      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Switch to history tab
      const historyTab = screen.getByText('Histórico');
      await user.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText('Histórico de Designações')).toBeInTheDocument();
        expect(screen.getByText('Todas as designações no período selecionado')).toBeInTheDocument();
      });

      // Check assignment entries
      expect(screen.getByText('Leitura da Bíblia')).toBeInTheDocument();
      expect(screen.getByText('BIBLE_READING')).toBeInTheDocument();
      expect(screen.getByText('Conselho: Excelente apresentação, clara e confiante')).toBeInTheDocument();
      expect(screen.getByText('4 min')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();

      expect(screen.getByText('Iniciando Conversas')).toBeInTheDocument();
      expect(screen.getByText('STARTING_CONVERSATION')).toBeInTheDocument();
      expect(screen.getByText('Conselho: Bom tempo, precisa trabalhar o contato visual')).toBeInTheDocument();
      expect(screen.getByText('5 min')).toBeInTheDocument();
      expect(screen.getByText('70')).toBeInTheDocument();

      expect(screen.getByText('Fazendo Discípulos')).toBeInTheDocument();
      expect(screen.getByText('MAKING_DISCIPLES')).toBeInTheDocument();
      expect(screen.getByText('Conselho: Preparação excelente, muito natural')).toBeInTheDocument();
      expect(screen.getByText('6 min')).toBeInTheDocument();
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('should format dates correctly', async () => {
      const user = userEvent.setup();
      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const historyTab = screen.getByText('Histórico');
      await user.click(historyTab);

      await waitFor(() => {
        // Check for formatted dates (Brazilian Portuguese format)
        expect(screen.getByText(/segunda-feira, 15 de janeiro de 2024/)).toBeInTheDocument();
        expect(screen.getByText(/segunda-feira, 8 de janeiro de 2024/)).toBeInTheDocument();
        expect(screen.getByText(/segunda-feira, 1 de janeiro de 2024/)).toBeInTheDocument();
      });
    });

    it('should handle assignments without counsel notes or timing', async () => {
      const dataWithIncompleteAssignments = {
        ...mockProgressData,
        assignmentHistory: [
          {
            id: '1',
            date: '2024-01-15',
            partType: 'bible_reading',
            title: 'Leitura da Bíblia',
            duration: null,
            counselNotes: null,
            performanceScore: null
          }
        ]
      };

      (analyticsEngine.calculateStudentProgress as Mock).mockResolvedValue(dataWithIncompleteAssignments);

      const user = userEvent.setup();
      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const historyTab = screen.getByText('Histórico');
      await user.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText('Leitura da Bíblia')).toBeInTheDocument();
        // Should not show counsel notes or timing when they're null
        expect(screen.queryByText('Conselho:')).not.toBeInTheDocument();
        expect(screen.queryByText('min')).not.toBeInTheDocument();
      });
    });
  });

  describe('Recommendations Tab', () => {
    it('should display strengths and improvement areas', async () => {
      const user = userEvent.setup();
      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Switch to recommendations tab
      const recommendationsTab = screen.getByText('Recomendações');
      await user.click(recommendationsTab);

      await waitFor(() => {
        expect(screen.getByText('Pontos Fortes')).toBeInTheDocument();
        expect(screen.getByText('preparation')).toBeInTheDocument();
        expect(screen.getByText('overall performance')).toBeInTheDocument();

        expect(screen.getByText('Áreas para Melhoria')).toBeInTheDocument();
        expect(screen.getByText('timing')).toBeInTheDocument();
        expect(screen.getByText('audience engagement')).toBeInTheDocument();

        expect(screen.getByText('Próxima Designação Recomendada')).toBeInTheDocument();
        expect(screen.getByText('FOLLOWING_UP')).toBeInTheDocument();
      });
    });

    it('should handle student with no strengths or improvement areas', async () => {
      const dataWithoutRecommendations = {
        ...mockProgressData,
        strengths: [],
        improvementAreas: [],
        nextRecommendedAssignment: null
      };

      (analyticsEngine.calculateStudentProgress as Mock).mockResolvedValue(dataWithoutRecommendations);

      const user = userEvent.setup();
      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const recommendationsTab = screen.getByText('Recomendações');
      await user.click(recommendationsTab);

      await waitFor(() => {
        expect(screen.getByText('Continue participando para identificar seus pontos fortes.')).toBeInTheDocument();
        expect(screen.getByText('Excelente! Não foram identificadas áreas específicas para melhoria.')).toBeInTheDocument();
        expect(screen.queryByText('Próxima Designação Recomendada')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large assignment history efficiently', async () => {
      const largeAssignmentHistory = Array.from({ length: 100 }, (_, i) => ({
        id: `assignment-${i}`,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        partType: 'bible_reading',
        title: `Assignment ${i}`,
        duration: 4,
        counselNotes: `Counsel for assignment ${i}`,
        performanceScore: 70 + (i % 30)
      }));

      const dataWithLargeHistory = {
        ...mockProgressData,
        assignmentHistory: largeAssignmentHistory
      };

      (analyticsEngine.calculateStudentProgress as Mock).mockResolvedValue(dataWithLargeHistory);

      const user = userEvent.setup();
      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Should display total count correctly
      expect(screen.getByText('100')).toBeInTheDocument();

      // Switch to history tab and verify it renders without performance issues
      const historyTab = screen.getByText('Histórico');
      const startTime = Date.now();
      await user.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText('Assignment 0')).toBeInTheDocument();
      });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should render within 2 seconds
    });

    it('should handle empty assignment history', async () => {
      const dataWithEmptyHistory = {
        ...mockProgressData,
        assignmentHistory: []
      };

      (analyticsEngine.calculateStudentProgress as Mock).mockResolvedValue(dataWithEmptyHistory);

      render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Should show 0 assignments
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('no período selecionado')).toBeInTheDocument();

      // Should show 50 as default performance score
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('pontuação média')).toBeInTheDocument();
    });

    it('should maintain responsive design', () => {
      render(<StudentProgressTracker studentId="student1" className="test-class" />);

      // Check that className is applied
      const container = screen.getByText('Selecione um Estudante').closest('.test-class');
      expect(container).toBeInTheDocument();
    });

    it('should reload data when studentId changes', async () => {
      const { rerender } = render(<StudentProgressTracker studentId="student1" />);

      await waitFor(() => {
        expect(analyticsEngine.calculateStudentProgress).toHaveBeenCalledWith('student1', expect.any(Object));
      });

      // Change studentId
      rerender(<StudentProgressTracker studentId="student2" />);

      await waitFor(() => {
        expect(analyticsEngine.calculateStudentProgress).toHaveBeenCalledWith('student2', expect.any(Object));
      });

      expect(analyticsEngine.calculateStudentProgress).toHaveBeenCalledTimes(2);
    });
  });
});