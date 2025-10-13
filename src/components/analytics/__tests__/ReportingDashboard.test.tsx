import React from 'react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportingDashboard from '../ReportingDashboard';
import { analyticsEngine } from '@/services/analyticsEngine';
import { ReportExporter } from '@/services/reportExporter';
import { toast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/services/analyticsEngine', () => ({
  analyticsEngine: {
    calculateParticipationMetrics: vi.fn(),
    calculateAssignmentDistribution: vi.fn(),
    getAssignmentFrequencyAnalysis: vi.fn()
  }
}));

vi.mock('@/services/reportExporter', () => ({
  ReportExporter: {
    saveHTMLReport: vi.fn(),
    exportToCSV: vi.fn()
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

// Mock chart components to avoid canvas rendering issues in tests
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>
}));

describe('ReportingDashboard', () => {
  const mockParticipationData = [
    {
      studentId: 'student1',
      studentName: 'João Silva',
      totalAssignments: 5,
      assignmentsByType: {
        'bible_reading': 2,
        'starting_conversation': 2,
        'making_disciples': 1
      },
      averageTimeBetweenAssignments: 14,
      lastAssignmentDate: '2024-01-15',
      participationRate: 80,
      skillDevelopmentScore: 75
    },
    {
      studentId: 'student2',
      studentName: 'Maria Santos',
      totalAssignments: 3,
      assignmentsByType: {
        'bible_reading': 1,
        'following_up': 2
      },
      averageTimeBetweenAssignments: 21,
      lastAssignmentDate: '2024-01-10',
      participationRate: 60,
      skillDevelopmentScore: 65
    }
  ];

  const mockDistributionData = {
    totalStudents: 2,
    activeStudents: 2,
    averageAssignmentsPerStudent: 4,
    assignmentDistributionBalance: 0.5,
    underutilizedStudents: ['student2'],
    overutilizedStudents: []
  };

  const mockFrequencyData = {
    byStudent: { 'João Silva': 5, 'Maria Santos': 3 },
    byPartType: { 'bible_reading': 3, 'starting_conversation': 2, 'making_disciples': 1, 'following_up': 2 },
    byMonth: { '2024-01': 8 }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    (analyticsEngine.calculateParticipationMetrics as Mock).mockResolvedValue(mockParticipationData);
    (analyticsEngine.calculateAssignmentDistribution as Mock).mockResolvedValue(mockDistributionData);
    (analyticsEngine.getAssignmentFrequencyAnalysis as Mock).mockResolvedValue(mockFrequencyData);
  });

  describe('Initial Render', () => {
    it('should render dashboard header and controls', () => {
      render(<ReportingDashboard />);

      expect(screen.getByText('Dashboard de Relatórios')).toBeInTheDocument();
      expect(screen.getByText('Análise abrangente de participação e desempenho dos estudantes')).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('Excel')).toBeInTheDocument();
    });

    it('should render filters and configuration section', () => {
      render(<ReportingDashboard />);

      expect(screen.getByText('Filtros e Configurações')).toBeInTheDocument();
      expect(screen.getByText('Período')).toBeInTheDocument();
      expect(screen.getByText('Tipo de Relatório')).toBeInTheDocument();
      expect(screen.getByText('Gerar Relatório')).toBeInTheDocument();
    });

    it('should show empty state initially', () => {
      render(<ReportingDashboard />);

      expect(screen.getByText('Nenhum dado encontrado para o período selecionado.')).toBeInTheDocument();
      expect(screen.getByText('Clique em "Gerar Relatório" para carregar os dados.')).toBeInTheDocument();
    });
  });

  describe('Report Generation', () => {
    it('should generate report when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReportingDashboard />);

      const generateButton = screen.getByText('Gerar Relatório');
      await user.click(generateButton);

      await waitFor(() => {
        expect(analyticsEngine.calculateParticipationMetrics).toHaveBeenCalled();
        expect(analyticsEngine.calculateAssignmentDistribution).toHaveBeenCalled();
        expect(analyticsEngine.getAssignmentFrequencyAnalysis).toHaveBeenCalled();
      });

      expect(toast).toHaveBeenCalledWith({
        title: "Relatório gerado com sucesso",
        description: "Os dados foram atualizados com as informações mais recentes.",
      });
    });

    it('should show loading state during report generation', async () => {
      const user = userEvent.setup();
      
      // Make the analytics calls take some time
      (analyticsEngine.calculateParticipationMetrics as Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockParticipationData), 100))
      );

      render(<ReportingDashboard />);

      const generateButton = screen.getByText('Gerar Relatório');
      await user.click(generateButton);

      // Check for loading state
      expect(generateButton).toBeDisabled();
      expect(screen.getByTestId('lucide-refresh-cw')).toHaveClass('animate-spin');

      await waitFor(() => {
        expect(generateButton).not.toBeDisabled();
      });
    });

    it('should handle report generation errors', async () => {
      const user = userEvent.setup();
      
      (analyticsEngine.calculateParticipationMetrics as Mock).mockRejectedValue(new Error('Database error'));

      render(<ReportingDashboard />);

      const generateButton = screen.getByText('Gerar Relatório');
      await user.click(generateButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: "Erro ao gerar relatório",
          description: "Ocorreu um erro ao processar os dados. Tente novamente.",
          variant: "destructive",
        });
      });
    });

    it('should pass date range to analytics engine when provided', async () => {
      const user = userEvent.setup();
      render(<ReportingDashboard />);

      // Mock date picker interaction (simplified)
      const generateButton = screen.getByText('Gerar Relatório');
      await user.click(generateButton);

      await waitFor(() => {
        expect(analyticsEngine.calculateParticipationMetrics).toHaveBeenCalledWith(undefined);
        expect(analyticsEngine.calculateAssignmentDistribution).toHaveBeenCalledWith(undefined);
        expect(analyticsEngine.getAssignmentFrequencyAnalysis).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('Summary Cards', () => {
    it('should display summary cards after report generation', async () => {
      const user = userEvent.setup();
      render(<ReportingDashboard />);

      const generateButton = screen.getByText('Gerar Relatório');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Total de Estudantes')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('2 ativos')).toBeInTheDocument();
        
        expect(screen.getByText('Média de Designações')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('por estudante')).toBeInTheDocument();
        
        expect(screen.getByText('Equilíbrio')).toBeInTheDocument();
        expect(screen.getByText('0.5')).toBeInTheDocument();
        expect(screen.getByText('Bom')).toBeInTheDocument();
        
        expect(screen.getByText('Alertas')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('estudantes com desequilíbrio')).toBeInTheDocument();
      });
    });

    it('should show correct balance assessment', async () => {
      const user = userEvent.setup();
      
      // Test excellent balance
      (analyticsEngine.calculateAssignmentDistribution as Mock).mockResolvedValue({
        ...mockDistributionData,
        assignmentDistributionBalance: 0.3
      });

      render(<ReportingDashboard />);
      await user.click(screen.getByText('Gerar Relatório'));

      await waitFor(() => {
        expect(screen.getByText('Excelente')).toBeInTheDocument();
      });

      // Test needs improvement
      (analyticsEngine.calculateAssignmentDistribution as Mock).mockResolvedValue({
        ...mockDistributionData,
        assignmentDistributionBalance: 1.5
      });

      await user.click(screen.getByText('Gerar Relatório'));

      await waitFor(() => {
        expect(screen.getByText('Precisa melhorar')).toBeInTheDocument();
      });
    });
  });

  describe('Charts and Visualizations', () => {
    it('should render participation charts after data is loaded', async () => {
      const user = userEvent.setup();
      render(<ReportingDashboard />);

      await user.click(screen.getByText('Gerar Relatório'));

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      expect(screen.getByText('Top 10 Estudantes por Designações')).toBeInTheDocument();
      expect(screen.getByText('Taxa de Participação vs Habilidade')).toBeInTheDocument();
    });

    it('should render distribution charts in distribution tab', async () => {
      const user = userEvent.setup();
      render(<ReportingDashboard />);

      await user.click(screen.getByText('Gerar Relatório'));

      await waitFor(() => {
        // Switch to distribution tab
        const distributionTab = screen.getByText('Distribuição');
        user.click(distributionTab);
      });

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        expect(screen.getByText('Distribuição por Tipo de Designação')).toBeInTheDocument();
        expect(screen.getByText('Alertas de Distribuição')).toBeInTheDocument();
      });
    });

    it('should render trends chart in trends tab', async () => {
      const user = userEvent.setup();
      render(<ReportingDashboard />);

      await user.click(screen.getByText('Gerar Relatório'));

      await waitFor(() => {
        // Switch to trends tab
        const trendsTab = screen.getByText('Tendências');
        user.click(trendsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Tendência Mensal de Designações')).toBeInTheDocument();
      });
    });

    it('should show distribution alerts correctly', async () => {
      const user = userEvent.setup();
      render(<ReportingDashboard />);

      await user.click(screen.getByText('Gerar Relatório'));

      await waitFor(() => {
        const distributionTab = screen.getByText('Distribuição');
        user.click(distributionTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Subutilizados:')).toBeInTheDocument();
        expect(screen.getByText('1 estudantes com poucas designações')).toBeInTheDocument();
      });
    });

    it('should show balanced distribution message when appropriate', async () => {
      const user = userEvent.setup();
      
      (analyticsEngine.calculateAssignmentDistribution as Mock).mockResolvedValue({
        ...mockDistributionData,
        underutilizedStudents: [],
        overutilizedStudents: []
      });

      render(<ReportingDashboard />);
      await user.click(screen.getByText('Gerar Relatório'));

      await waitFor(() => {
        const distributionTab = screen.getByText('Distribuição');
        user.click(distributionTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Distribuição equilibrada!')).toBeInTheDocument();
        expect(screen.getByText('Todos os estudantes têm uma carga adequada de designações.')).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export to PDF when PDF button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReportingDashboard />);

      // Generate report first
      await user.click(screen.getByText('Gerar Relatório'));

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Click PDF export
      const pdfButton = screen.getByText('PDF');
      await user.click(pdfButton);

      expect(ReportExporter.saveHTMLReport).toHaveBeenCalledWith({
        participationData: mockParticipationData,
        distributionData: mockDistributionData,
        frequencyData: mockFrequencyData,
        dateRange: undefined
      });

      expect(toast).toHaveBeenCalledWith({
        title: "Relatório exportado",
        description: "O arquivo HTML foi salvo. Você pode convertê-lo para PDF usando seu navegador.",
      });
    });

    it('should export to Excel when Excel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReportingDashboard />);

      // Generate report first
      await user.click(screen.getByText('Gerar Relatório'));

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Click Excel export
      const excelButton = screen.getByText('Excel');
      await user.click(excelButton);

      expect(ReportExporter.exportToCSV).toHaveBeenCalledWith({
        participationData: mockParticipationData,
        distributionData: mockDistributionData,
        frequencyData: mockFrequencyData,
        dateRange: undefined
      });

      expect(toast).toHaveBeenCalledWith({
        title: "Dados exportados",
        description: "O arquivo CSV foi salvo e pode ser aberto no Excel.",
      });
    });

    it('should show error when trying to export without data', async () => {
      const user = userEvent.setup();
      render(<ReportingDashboard />);

      // Try to export without generating report first
      const pdfButton = screen.getByText('PDF');
      await user.click(pdfButton);

      expect(toast).toHaveBeenCalledWith({
        title: "Nenhum dado para exportar",
        description: "Gere um relatório primeiro antes de exportar.",
        variant: "destructive",
      });

      expect(ReportExporter.saveHTMLReport).not.toHaveBeenCalled();
    });
  });

  describe('Report Type Selection', () => {
    it('should allow changing report type', async () => {
      const user = userEvent.setup();
      render(<ReportingDashboard />);

      const reportTypeSelect = screen.getByRole('combobox');
      await user.click(reportTypeSelect);

      // Check if options are available
      await waitFor(() => {
        expect(screen.getByText('Participação')).toBeInTheDocument();
        expect(screen.getByText('Distribuição')).toBeInTheDocument();
        expect(screen.getByText('Progresso')).toBeInTheDocument();
        expect(screen.getByText('Abrangente')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', async () => {
      const user = userEvent.setup();
      
      // Create large dataset
      const largeParticipationData = Array.from({ length: 1000 }, (_, i) => ({
        studentId: `student${i}`,
        studentName: `Student ${i}`,
        totalAssignments: Math.floor(Math.random() * 20),
        assignmentsByType: { 'bible_reading': Math.floor(Math.random() * 5) },
        averageTimeBetweenAssignments: Math.floor(Math.random() * 30),
        lastAssignmentDate: '2024-01-15',
        participationRate: Math.floor(Math.random() * 100),
        skillDevelopmentScore: Math.floor(Math.random() * 100)
      }));

      (analyticsEngine.calculateParticipationMetrics as Mock).mockResolvedValue(largeParticipationData);

      render(<ReportingDashboard />);

      const startTime = Date.now();
      await user.click(screen.getByText('Gerar Relatório'));

      await waitFor(() => {
        expect(screen.getByText('Student 0')).toBeInTheDocument();
      });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Should render within 5 seconds
    });

    it('should handle empty frequency data', async () => {
      const user = userEvent.setup();
      
      (analyticsEngine.getAssignmentFrequencyAnalysis as Mock).mockResolvedValue({
        byStudent: {},
        byPartType: {},
        byMonth: {}
      });

      render(<ReportingDashboard />);
      await user.click(screen.getByText('Gerar Relatório'));

      await waitFor(() => {
        // Should not crash and should show empty charts
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('should handle null distribution data', async () => {
      const user = userEvent.setup();
      
      (analyticsEngine.calculateAssignmentDistribution as Mock).mockResolvedValue(null);

      render(<ReportingDashboard />);
      await user.click(screen.getByText('Gerar Relatório'));

      await waitFor(() => {
        // Should not show summary cards
        expect(screen.queryByText('Total de Estudantes')).not.toBeInTheDocument();
        // But should still show participation data
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });
    });

    it('should maintain responsive design', () => {
      render(<ReportingDashboard />);

      // Check for responsive classes
      const header = screen.getByText('Dashboard de Relatórios').closest('div');
      expect(header).toHaveClass('flex', 'flex-col', 'sm:flex-row');

      const controls = screen.getByText('Filtros e Configurações').closest('.space-y-6');
      expect(controls).toBeInTheDocument();
    });
  });
});