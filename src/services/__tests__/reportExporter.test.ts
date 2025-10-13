import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ReportExporter, ExportData } from '../reportExporter';
import { ParticipationMetrics, AssignmentDistributionMetrics } from '../analyticsEngine';

// Mock DOM methods
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockOpen = vi.fn();

// Mock document and window
Object.defineProperty(global, 'document', {
  value: {
    createElement: mockCreateElement,
    body: {
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild
    }
  }
});

Object.defineProperty(global, 'window', {
  value: {
    open: mockOpen
  }
});

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL
  }
});

describe('ReportExporter', () => {
  let mockExportData: ExportData;
  let mockElement: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock element
    mockElement = {
      setAttribute: vi.fn(),
      click: mockClick
    };
    mockCreateElement.mockReturnValue(mockElement);
    mockCreateObjectURL.mockReturnValue('blob:mock-url');

    // Setup mock export data
    const mockParticipationData: ParticipationMetrics[] = [
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

    const mockDistributionData: AssignmentDistributionMetrics = {
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

    mockExportData = {
      participationData: mockParticipationData,
      distributionData: mockDistributionData,
      frequencyData: mockFrequencyData,
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      }
    };
  });

  describe('exportToCSV', () => {
    it('should generate CSV content with correct headers and data', () => {
      ReportExporter.exportToCSV(mockExportData);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('href', expect.stringContaining('data:text/csv'));
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', expect.stringMatching(/relatorio_participacao_\d{4}-\d{2}-\d{2}\.csv/));
      expect(mockAppendChild).toHaveBeenCalledWith(mockElement);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockElement);
    });

    it('should include summary data in CSV', () => {
      ReportExporter.exportToCSV(mockExportData);

      const csvCall = mockElement.setAttribute.mock.calls.find(call => call[0] === 'href');
      const csvContent = decodeURIComponent(csvCall[1]);

      expect(csvContent).toContain('RESUMO GERAL');
      expect(csvContent).toContain('Total de Estudantes,2');
      expect(csvContent).toContain('Estudantes Ativos,2');
      expect(csvContent).toContain('Média de Designações,4');
      expect(csvContent).toContain('Índice de Equilíbrio,0.5');
    });

    it('should include participation details in CSV', () => {
      ReportExporter.exportToCSV(mockExportData);

      const csvCall = mockElement.setAttribute.mock.calls.find(call => call[0] === 'href');
      const csvContent = decodeURIComponent(csvCall[1]);

      expect(csvContent).toContain('DETALHES DE PARTICIPAÇÃO');
      expect(csvContent).toContain('João Silva,5,80,75,2024-01-15,14');
      expect(csvContent).toContain('Maria Santos,3,60,65,2024-01-10,21');
    });

    it('should include assignment types breakdown in CSV', () => {
      ReportExporter.exportToCSV(mockExportData);

      const csvCall = mockElement.setAttribute.mock.calls.find(call => call[0] === 'href');
      const csvContent = decodeURIComponent(csvCall[1]);

      expect(csvContent).toContain('DESIGNAÇÕES POR TIPO');
      expect(csvContent).toContain('bible_reading,starting_conversation,making_disciples,following_up');
      expect(csvContent).toContain('João Silva,2,2,1,0');
      expect(csvContent).toContain('Maria Santos,1,0,0,2');
    });

    it('should handle data without date range', () => {
      const dataWithoutDateRange = { ...mockExportData, dateRange: undefined };
      
      ReportExporter.exportToCSV(dataWithoutDateRange);

      const csvCall = mockElement.setAttribute.mock.calls.find(call => call[0] === 'href');
      const csvContent = decodeURIComponent(csvCall[1]);

      expect(csvContent).toContain('Relatório de Participação - Sistema Ministerial');
      expect(csvContent).not.toContain('Período:');
    });

    it('should handle data without distribution metrics', () => {
      const dataWithoutDistribution = { ...mockExportData, distributionData: null };
      
      ReportExporter.exportToCSV(dataWithoutDistribution);

      const csvCall = mockElement.setAttribute.mock.calls.find(call => call[0] === 'href');
      const csvContent = decodeURIComponent(csvCall[1]);

      expect(csvContent).not.toContain('RESUMO GERAL');
      expect(csvContent).toContain('DETALHES DE PARTICIPAÇÃO');
    });
  });

  describe('exportToJSON', () => {
    it('should generate JSON export with metadata', () => {
      ReportExporter.exportToJSON(mockExportData);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('href', expect.stringContaining('data:application/json'));
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', expect.stringMatching(/relatorio_dados_\d{4}-\d{2}-\d{2}\.json/));
    });

    it('should include all data sections in JSON', () => {
      ReportExporter.exportToJSON(mockExportData);

      const jsonCall = mockElement.setAttribute.mock.calls.find(call => call[0] === 'href');
      const jsonContent = decodeURIComponent(jsonCall[1].replace('data:application/json;charset=utf-8,', ''));
      const parsedData = JSON.parse(jsonContent);

      expect(parsedData).toHaveProperty('metadata');
      expect(parsedData).toHaveProperty('summary');
      expect(parsedData).toHaveProperty('participation');
      expect(parsedData).toHaveProperty('frequency');
      expect(parsedData.metadata).toHaveProperty('generatedAt');
      expect(parsedData.metadata).toHaveProperty('dateRange');
      expect(parsedData.metadata.reportType).toBe('comprehensive');
    });
  });

  describe('generateHTMLReport', () => {
    it('should generate complete HTML report', () => {
      const htmlContent = ReportExporter.generateHTMLReport(mockExportData);

      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<title>Relatório de Participação - Sistema Ministerial</title>');
      expect(htmlContent).toContain('Relatório de Participação');
      expect(htmlContent).toContain('Sistema de Gerenciamento Ministerial');
    });

    it('should include summary section with distribution data', () => {
      const htmlContent = ReportExporter.generateHTMLReport(mockExportData);

      expect(htmlContent).toContain('Resumo Geral');
      expect(htmlContent).toContain('Total de Estudantes');
      expect(htmlContent).toContain('<div class="value">2</div>');
      expect(htmlContent).toContain('Média de Designações');
      expect(htmlContent).toContain('<div class="value">4</div>');
      expect(htmlContent).toContain('Índice de Equilíbrio');
      expect(htmlContent).toContain('<div class="value">0.5</div>');
    });

    it('should include participation details table', () => {
      const htmlContent = ReportExporter.generateHTMLReport(mockExportData);

      expect(htmlContent).toContain('Detalhes de Participação');
      expect(htmlContent).toContain('<th>Nome</th>');
      expect(htmlContent).toContain('<th>Total de Designações</th>');
      expect(htmlContent).toContain('<td>João Silva</td>');
      expect(htmlContent).toContain('<td>5</td>');
      expect(htmlContent).toContain('<td>Maria Santos</td>');
      expect(htmlContent).toContain('<td>3</td>');
    });

    it('should include assignment types table', () => {
      const htmlContent = ReportExporter.generateHTMLReport(mockExportData);

      expect(htmlContent).toContain('Designações por Tipo');
      expect(htmlContent).toContain('<th>BIBLE_READING</th>');
      expect(htmlContent).toContain('<th>STARTING_CONVERSATION</th>');
      expect(htmlContent).toContain('<th>MAKING_DISCIPLES</th>');
      expect(htmlContent).toContain('<th>FOLLOWING_UP</th>');
    });

    it('should show alerts for unbalanced distribution', () => {
      const htmlContent = ReportExporter.generateHTMLReport(mockExportData);

      expect(htmlContent).toContain('Estudantes Subutilizados');
      expect(htmlContent).toContain('1 estudantes com poucas designações');
    });

    it('should show success message for balanced distribution', () => {
      const balancedData = {
        ...mockExportData,
        distributionData: {
          ...mockExportData.distributionData!,
          underutilizedStudents: [],
          overutilizedStudents: []
        }
      };

      const htmlContent = ReportExporter.generateHTMLReport(balancedData);

      expect(htmlContent).toContain('Distribuição Equilibrada!');
      expect(htmlContent).toContain('Todos os estudantes têm uma carga adequada');
    });

    it('should handle data without distribution metrics', () => {
      const dataWithoutDistribution = { ...mockExportData, distributionData: null };
      
      const htmlContent = ReportExporter.generateHTMLReport(dataWithoutDistribution);

      expect(htmlContent).not.toContain('Resumo Geral');
      expect(htmlContent).toContain('Detalhes de Participação');
    });

    it('should include date range in header when provided', () => {
      const htmlContent = ReportExporter.generateHTMLReport(mockExportData);

      expect(htmlContent).toContain('Período: 2024-01-01 a 2024-01-31');
    });

    it('should include CSS styles for proper formatting', () => {
      const htmlContent = ReportExporter.generateHTMLReport(mockExportData);

      expect(htmlContent).toContain('<style>');
      expect(htmlContent).toContain('font-family: Arial, sans-serif');
      expect(htmlContent).toContain('.summary-grid');
      expect(htmlContent).toContain('@media print');
    });
  });

  describe('printReport', () => {
    it('should open print window with HTML content', () => {
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn()
        },
        focus: vi.fn(),
        print: vi.fn()
      };

      mockOpen.mockReturnValue(mockPrintWindow);

      ReportExporter.printReport(mockExportData);

      expect(mockOpen).toHaveBeenCalledWith('', '_blank');
      expect(mockPrintWindow.document.write).toHaveBeenCalled();
      expect(mockPrintWindow.document.close).toHaveBeenCalled();
      expect(mockPrintWindow.focus).toHaveBeenCalled();
      expect(mockPrintWindow.print).toHaveBeenCalled();
    });

    it('should handle case when window.open returns null', () => {
      mockOpen.mockReturnValue(null);

      expect(() => ReportExporter.printReport(mockExportData)).not.toThrow();
    });
  });

  describe('saveHTMLReport', () => {
    it('should create and download HTML file', () => {
      ReportExporter.saveHTMLReport(mockExportData);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockElement.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', expect.stringMatching(/relatorio_participacao_\d{4}-\d{2}-\d{2}\.html/));
      expect(mockAppendChild).toHaveBeenCalledWith(mockElement);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockElement);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should create blob with correct HTML content', () => {
      // Mock Blob constructor
      const mockBlob = vi.fn();
      global.Blob = mockBlob;

      ReportExporter.saveHTMLReport(mockExportData);

      expect(mockBlob).toHaveBeenCalledWith(
        [expect.stringContaining('<!DOCTYPE html>')],
        { type: 'text/html' }
      );
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      // Create large dataset
      const largeParticipationData: ParticipationMetrics[] = Array.from({ length: 1000 }, (_, i) => ({
        studentId: `student${i}`,
        studentName: `Student ${i}`,
        totalAssignments: Math.floor(Math.random() * 20),
        assignmentsByType: {
          'bible_reading': Math.floor(Math.random() * 5),
          'starting_conversation': Math.floor(Math.random() * 5),
          'making_disciples': Math.floor(Math.random() * 5)
        },
        averageTimeBetweenAssignments: Math.floor(Math.random() * 30),
        lastAssignmentDate: '2024-01-15',
        participationRate: Math.floor(Math.random() * 100),
        skillDevelopmentScore: Math.floor(Math.random() * 100)
      }));

      const largeExportData = {
        ...mockExportData,
        participationData: largeParticipationData
      };

      const startTime = Date.now();
      ReportExporter.exportToCSV(largeExportData);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle empty participation data', () => {
      const emptyData = {
        ...mockExportData,
        participationData: []
      };

      expect(() => ReportExporter.exportToCSV(emptyData)).not.toThrow();
      expect(() => ReportExporter.generateHTMLReport(emptyData)).not.toThrow();
    });

    it('should handle special characters in student names', () => {
      const dataWithSpecialChars = {
        ...mockExportData,
        participationData: [
          {
            ...mockExportData.participationData[0],
            studentName: 'José da Silva, Jr. & Cia.'
          }
        ]
      };

      expect(() => ReportExporter.exportToCSV(dataWithSpecialChars)).not.toThrow();
      
      const htmlContent = ReportExporter.generateHTMLReport(dataWithSpecialChars);
      expect(htmlContent).toContain('José da Silva, Jr. &amp; Cia.');
    });

    it('should generate unique filenames for concurrent exports', () => {
      const originalDateNow = Date.now;
      let mockTime = 1640995200000; // Fixed timestamp
      
      Date.now = vi.fn(() => mockTime);

      ReportExporter.exportToCSV(mockExportData);
      const firstCall = mockElement.setAttribute.mock.calls.find(call => call[0] === 'download');
      
      mockTime += 1000; // Advance time by 1 second
      ReportExporter.exportToCSV(mockExportData);
      const secondCall = mockElement.setAttribute.mock.calls.findLast(call => call[0] === 'download');

      expect(firstCall[1]).not.toBe(secondCall[1]);
      
      Date.now = originalDateNow;
    });
  });
});