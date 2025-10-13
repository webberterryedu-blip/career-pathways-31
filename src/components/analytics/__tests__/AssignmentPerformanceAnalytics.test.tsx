import React from 'react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssignmentPerformanceAnalytics from '../AssignmentPerformanceAnalytics';
import { analyticsEngine } from '@/services/analyticsEngine';

// Mock dependencies
vi.mock('@/services/analyticsEngine', () => ({
  analyticsEngine: {
    calculateParticipationMetrics: vi.fn(),
    getAssignmentFrequencyAnalysis: vi.fn()
  }
}));

// Mock chart components
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  Radar: () => <div data-testid="radar" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>
}));

describe('AssignmentPerformanceAnalytics', () => {
  const mockParticipationData = [
    {
      studentId: 'student1',
      studentName: 'João Silva',
      totalAssignments: 8,
      assignmentsByType: {
        'bible_reading': 3,
        'starting_conversation': 2,
        'making_disciples': 2,
        'explaining_beliefs': 1
      },
      averageTimeBetweenAssignments: 14,
      lastAssignmentDate: '2024-01-15',
      participationRate: 85,
      skillDevelopmentScore: 78
    },
    {
      studentId: 'student2',
      studentName: 'Maria Santos',
      totalAssignments: 6,
      assignmentsByType: {
        'bible_reading': 2,
        'starting_conversation': 3,
        'following_up': 1
      },
      averageTimeBetweenAssignments: 18,
      lastAssignmentDate: '2024-01-12',
      participationRate: 75,
      skillDevelopmentScore: 72
    },
    {
      studentId: 'student3',
      studentName: 'Pedro Costa',
      totalAssignments: 10,
      assignmentsByType: {
        'bible_reading': 4,
        'starting_conversation': 2,
        'making_disciples': 3,
        'explaining_beliefs': 1
      },
      averageTimeBetweenAssignments: 12,
      lastAssignmentDate: '2024-01-18',
      participationRate: 90,
      skillDevelopmentScore: 85
    }
  ];

  const mockFrequencyData = {
    byStudent: {
      'João Silva': 8,
      'Maria Santos': 6,
      'Pedro Costa': 10
    },
    byPartType: {
      'bible_reading': 9,
      'starting_conversation': 7,
      'making_disciples': 5,
      'explaining_beliefs': 2,
      'following_up': 1
    },
    byMonth: {
      '2023-11': 8,
      '2023-12': 10,
      '2024-01': 6
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (analyticsEngine.calculateParticipationMetrics as Mock).mockResolvedValue(mockParticipationData);
    (analyticsEngine.getAssignmentFrequencyAnalysis as Mock).mockResolvedValue(mockFrequencyData);
  });

  describe('Component Rendering', () => {
    it('should render performance analytics dashboard', async () => {
      render(<AssignmentPerformanceAnalytics />);

      expect(screen.getByText('Análise de Desempenho de Designações')).toBeInTheDocument();
      expect(screen.getByText('Métricas detalhadas de participação e eficácia')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<AssignmentPerformanceAnalytics />);

      expect(screen.getByText('Carregando análise de desempenho...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toHaveClass('animate-spin');
    });

    it('should load and display analytics data', async () => {
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
      });

      expect(analyticsEngine.calculateParticipationMetrics).toHaveBeenCalled();
      expect(analyticsEngine.getAssignmentFrequencyAnalysis).toHaveBeenCalled();
    });
  });

  describe('Performance Metrics Display', () => {
    it('should display key performance indicators', async () => {
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        // Total assignments
        expect(screen.getByText('Total de Designações')).toBeInTheDocument();
        expect(screen.getByText('24')).toBeInTheDocument(); // 8 + 6 + 10

        // Average participation rate
        expect(screen.getByText('Taxa Média de Participação')).toBeInTheDocument();
        expect(screen.getByText('83%')).toBeInTheDocument(); // (85 + 75 + 90) / 3

        // Most active student
        expect(screen.getByText('Estudante Mais Ativo')).toBeInTheDocument();
        expect(screen.getByText('Pedro Costa')).toBeInTheDocument(); // 10 assignments

        // Assignment variety
        expect(screen.getByText('Tipos de Designação')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // 5 different types
      });
    });

    it('should calculate performance metrics correctly', async () => {
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        // Check that calculations are correct
        const totalAssignments = mockParticipationData.reduce((sum, student) => sum + student.totalAssignments, 0);
        expect(screen.getByText(totalAssignments.toString())).toBeInTheDocument();

        const avgParticipation = Math.round(
          mockParticipationData.reduce((sum, student) => sum + student.participationRate, 0) / mockParticipationData.length
        );
        expect(screen.getByText(`${avgParticipation}%`)).toBeInTheDocument();
      });
    });
  });

  describe('Chart Visualizations', () => {
    it('should render participation trend chart', async () => {
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('Tendência de Participação')).toBeInTheDocument();
        expect(screen.getByText('Evolução da participação ao longo do tempo')).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('should render assignment distribution chart', async () => {
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('Distribuição por Tipo')).toBeInTheDocument();
        expect(screen.getByText('Quantidade de cada tipo de designação')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('should render student performance comparison', async () => {
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('Comparação de Desempenho')).toBeInTheDocument();
        expect(screen.getByText('Taxa de participação vs desenvolvimento de habilidades')).toBeInTheDocument();
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });
    });

    it('should render skill development radar chart', async () => {
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('Análise de Habilidades')).toBeInTheDocument();
        expect(screen.getByText('Distribuição de pontuações de desenvolvimento')).toBeInTheDocument();
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Data Filtering and Interaction', () => {
    it('should allow filtering by time period', async () => {
      const user = userEvent.setup();
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Find and click period filter
      const periodSelect = screen.getByRole('combobox');
      await user.click(periodSelect);

      await waitFor(() => {
        expect(screen.getByText('Último mês')).toBeInTheDocument();
        expect(screen.getByText('Últimos 3 meses')).toBeInTheDocument();
        expect(screen.getByText('Últimos 6 meses')).toBeInTheDocument();
        expect(screen.getByText('Último ano')).toBeInTheDocument();
      });

      // Select different period
      await user.click(screen.getByText('Últimos 3 meses'));

      // Should trigger new data fetch
      await waitFor(() => {
        expect(analyticsEngine.calculateParticipationMetrics).toHaveBeenCalledTimes(2);
      });
    });

    it('should allow filtering by assignment type', async () => {
      const user = userEvent.setup();
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Find assignment type filter
      const typeFilters = screen.getAllByRole('checkbox');
      expect(typeFilters.length).toBeGreaterThan(0);

      // Toggle a filter
      await user.click(typeFilters[0]);

      // Should update the displayed data
      await waitFor(() => {
        // The component should re-render with filtered data
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('should show detailed student information on hover/click', async () => {
      const user = userEvent.setup();
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Find student card or chart element
      const studentElement = screen.getByText('João Silva');
      await user.click(studentElement);

      // Should show detailed information
      await waitFor(() => {
        expect(screen.getByText('8 designações')).toBeInTheDocument();
        expect(screen.getByText('85% participação')).toBeInTheDocument();
        expect(screen.getByText('78 pontos de habilidade')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Insights', () => {
    it('should identify top performers', async () => {
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('Top Performers')).toBeInTheDocument();
        
        // Pedro Costa should be identified as top performer (highest participation rate and assignments)
        expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
        expect(screen.getByText('90%')).toBeInTheDocument(); // His participation rate
        expect(screen.getByText('10')).toBeInTheDocument(); // His assignment count
      });
    });

    it('should identify students needing attention', async () => {
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('Precisam de Atenção')).toBeInTheDocument();
        
        // Maria Santos should be identified as needing attention (lowest participation)
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(screen.getByText('75%')).toBeInTheDocument(); // Her participation rate
        expect(screen.getByText('6')).toBeInTheDocument(); // Her assignment count
      });
    });

    it('should show assignment balance recommendations', async () => {
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('Recomendações de Equilíbrio')).toBeInTheDocument();
        
        // Should suggest more assignments for underutilized students
        expect(screen.getByText(/Maria Santos.*precisa.*mais designações/i)).toBeInTheDocument();
        
        // Should suggest variety for students with limited types
        expect(screen.getByText(/diversificar.*tipos.*designação/i)).toBeInTheDocument();
      });
    });

    it('should calculate assignment frequency insights', async () => {
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('Frequência de Designações')).toBeInTheDocument();
        
        // Should show average time between assignments
        const avgTime = Math.round(
          mockParticipationData.reduce((sum, student) => sum + student.averageTimeBetweenAssignments, 0) / 
          mockParticipationData.length
        );
        expect(screen.getByText(`${avgTime} dias`)).toBeInTheDocument();
        
        // Should identify students with gaps
        expect(screen.getByText(/Maria Santos.*18 dias.*entre designações/i)).toBeInTheDocument();
      });
    });
  });

  describe('Export and Sharing', () => {
    it('should provide export functionality', async () => {
      const user = userEvent.setup();
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Find export button
      const exportButton = screen.getByText('Exportar Análise');
      expect(exportButton).toBeInTheDocument();

      await user.click(exportButton);

      // Should show export options
      await waitFor(() => {
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('Excel')).toBeInTheDocument();
        expect(screen.getByText('Imagem')).toBeInTheDocument();
      });
    });

    it('should allow sharing insights', async () => {
      const user = userEvent.setup();
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Find share button
      const shareButton = screen.getByText('Compartilhar');
      expect(shareButton).toBeInTheDocument();

      await user.click(shareButton);

      // Should show sharing options
      await waitFor(() => {
        expect(screen.getByText('Copiar Link')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty data gracefully', async () => {
      (analyticsEngine.calculateParticipationMetrics as Mock).mockResolvedValue([]);
      (analyticsEngine.getAssignmentFrequencyAnalysis as Mock).mockResolvedValue({
        byStudent: {},
        byPartType: {},
        byMonth: {}
      });

      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum dado disponível')).toBeInTheDocument();
        expect(screen.getByText('Não há dados de designações para o período selecionado.')).toBeInTheDocument();
      });
    });

    it('should handle API errors', async () => {
      (analyticsEngine.calculateParticipationMetrics as Mock).mockRejectedValue(new Error('API Error'));

      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument();
        expect(screen.getByText('Ocorreu um erro ao carregar a análise de desempenho.')).toBeInTheDocument();
      });
    });

    it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeParticipationData = Array.from({ length: 500 }, (_, i) => ({
        studentId: `student${i}`,
        studentName: `Student ${i}`,
        totalAssignments: Math.floor(Math.random() * 20),
        assignmentsByType: {
          'bible_reading': Math.floor(Math.random() * 5),
          'starting_conversation': Math.floor(Math.random() * 5)
        },
        averageTimeBetweenAssignments: Math.floor(Math.random() * 30),
        lastAssignmentDate: '2024-01-15',
        participationRate: Math.floor(Math.random() * 100),
        skillDevelopmentScore: Math.floor(Math.random() * 100)
      }));

      (analyticsEngine.calculateParticipationMetrics as Mock).mockResolvedValue(largeParticipationData);

      const startTime = Date.now();
      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('Student 0')).toBeInTheDocument();
      });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(3000); // Should render within 3 seconds
    });

    it('should handle missing or null values in data', async () => {
      const dataWithNulls = [
        {
          studentId: 'student1',
          studentName: 'João Silva',
          totalAssignments: 5,
          assignmentsByType: {},
          averageTimeBetweenAssignments: 0,
          lastAssignmentDate: null,
          participationRate: 0,
          skillDevelopmentScore: 0
        }
      ];

      (analyticsEngine.calculateParticipationMetrics as Mock).mockResolvedValue(dataWithNulls);

      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('0%')).toBeInTheDocument(); // Should handle 0 participation rate
        expect(screen.getByText('N/A')).toBeInTheDocument(); // Should handle null last assignment date
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to different screen sizes', () => {
      render(<AssignmentPerformanceAnalytics />);

      // Check for responsive grid classes
      const container = screen.getByText('Análise de Desempenho de Designações').closest('div');
      expect(container).toHaveClass('space-y-6');

      // Charts should be in responsive containers
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should handle mobile layout', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<AssignmentPerformanceAnalytics />);

      await waitFor(() => {
        // Should show mobile-friendly layout
        const mobileElements = screen.getAllByTestId('responsive-container');
        expect(mobileElements.length).toBeGreaterThan(0);
      });
    });
  });
});