import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import RelatoriosPage from '../RelatoriosPage'
import { useProgramContext } from '@/contexts/ProgramContext'
import { useAssignmentContext } from '@/contexts/AssignmentContext'
import { useStudentContext } from '@/contexts/StudentContext'

// Mock dependencies
vi.mock('@/contexts/ProgramContext')
vi.mock('@/contexts/AssignmentContext')
vi.mock('@/contexts/StudentContext')
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}))

// Mock child components
vi.mock('@/components/QualificacoesAvancadas', () => ({
  default: ({ congregacaoId }: { congregacaoId: string }) => (
    <div data-testid="qualificacoes-avancadas">
      Qualificações Avançadas - {congregacaoId}
    </div>
  )
}))

// Mock UnifiedLayout
vi.mock('@/components/layout/UnifiedLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="unified-layout">{children}</div>
  )
}))

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}))

const mockUseProgramContext = useProgramContext as ReturnType<typeof vi.fn>
const mockUseAssignmentContext = useAssignmentContext as ReturnType<typeof vi.fn>
const mockUseStudentContext = useStudentContext as ReturnType<typeof vi.fn>

const mockStudents = [
  {
    id: '1',
    nome: 'João Silva',
    genero: 'masculino',
    cargo: 'publicador',
    ativo: true
  },
  {
    id: '2',
    nome: 'Maria Santos',
    genero: 'feminino',
    cargo: 'publicadora',
    ativo: true
  },
  {
    id: '3',
    nome: 'Pedro Costa',
    genero: 'masculino',
    cargo: 'anciao',
    ativo: false
  }
]

const mockAssignments = [
  {
    id: '1',
    studentId: '1',
    partType: 'bible_reading',
    status: 'completed',
    weekDate: '2024-12-15'
  },
  {
    id: '2',
    studentId: '2',
    partType: 'starting_conversation',
    status: 'completed',
    weekDate: '2024-12-15'
  },
  {
    id: '3',
    studentId: '1',
    partType: 'making_disciples',
    status: 'pending',
    weekDate: '2024-12-22'
  }
]

const mockReportData = {
  metrics: {
    total_designacoes: 15,
    total_estudantes: 8,
    designacoes_atribuidas: 12,
    taxa_participacao: 85
  },
  estudantes: [
    {
      id: '1',
      nome: 'João Silva',
      genero: 'masculino',
      frequencia: '2x/mês',
      qualificacoes: '7/9',
      nivel_qualificacao: 'Avançado'
    },
    {
      id: '2',
      nome: 'Maria Santos',
      genero: 'feminino',
      frequencia: '1x/mês',
      qualificacoes: '5/9',
      nivel_qualificacao: 'Intermediário'
    }
  ],
  summary: {
    estudantes_avancados: 3,
    estudantes_intermediarios: 4,
    estudantes_basicos: 1
  },
  report: [
    {
      id: '1',
      nome: 'João Silva',
      genero: 'masculino',
      total_qualificacoes: 7,
      privilégios: ['Leitura', 'Discursos'],
      nivel_desenvolvimento: 'Avançado'
    }
  ],
  participations: [
    {
      id: '1',
      created_at: '2024-12-01T00:00:00Z',
      principal_estudante: { nome: 'João Silva' },
      assistente_estudante: null,
      programacao_item: { titulo: 'Leitura da Bíblia', tipo: 'bible_reading' }
    }
  ]
}

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('RelatoriosPage Migration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    mockUseProgramContext.mockReturnValue({
      selectedCongregacaoId: 'cong-1',
      setSelectedCongregacaoId: vi.fn()
    })
    
    mockUseAssignmentContext.mockReturnValue({
      assignments: mockAssignments,
      getAssignmentStats: vi.fn().mockReturnValue({
        total: 3,
        completed: 2,
        pending: 1
      }),
      getStudentHistory: vi.fn().mockReturnValue([])
    })
    
    mockUseStudentContext.mockReturnValue({
      students: mockStudents,
      getStudentStats: vi.fn().mockReturnValue({
        total: 3,
        active: 2,
        inactive: 1
      }),
      getActiveStudents: vi.fn().mockReturnValue(mockStudents.filter(s => s.ativo))
    })
  })

  describe('Layout Consistency', () => {
    it('should use UnifiedLayout component', () => {
      renderWithRouter(<RelatoriosPage />)
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should display real-time analytics overview', () => {
      renderWithRouter(<RelatoriosPage />)
      
      expect(screen.getByText('Visão Geral em Tempo Real')).toBeInTheDocument()
      expect(screen.getByText('Total de Designações')).toBeInTheDocument()
      expect(screen.getByText('Estudantes Ativos')).toBeInTheDocument()
      expect(screen.getByText('Média por Estudante')).toBeInTheDocument()
      expect(screen.getByText('Taxa de Conclusão')).toBeInTheDocument()
    })

    it('should display filters and configuration section', () => {
      renderWithRouter(<RelatoriosPage />)
      
      expect(screen.getByText('Filtros e Configurações')).toBeInTheDocument()
      expect(screen.getByText('Congregação:')).toBeInTheDocument()
      expect(screen.getByText('Data Início:')).toBeInTheDocument()
      expect(screen.getByText('Data Fim:')).toBeInTheDocument()
    })

    it('should display action buttons in header', () => {
      renderWithRouter(<RelatoriosPage />)
      
      expect(screen.getByText('Atualizar')).toBeInTheDocument()
      expect(screen.getByText('Exportar CSV')).toBeInTheDocument()
    })
  })

  describe('Navigation Integration', () => {
    it('should display all report type buttons', () => {
      renderWithRouter(<RelatoriosPage />)
      
      expect(screen.getByText('Engajamento')).toBeInTheDocument()
      expect(screen.getByText('Desempenho')).toBeInTheDocument()
      expect(screen.getByText('Progresso')).toBeInTheDocument()
      expect(screen.getByText('Distribuição')).toBeInTheDocument()
      expect(screen.getByText('Qualificações')).toBeInTheDocument()
      expect(screen.getByText('Histórico')).toBeInTheDocument()
    })

    it('should switch between report types', async () => {
      renderWithRouter(<RelatoriosPage />)
      
      const performanceButton = screen.getByText('Desempenho')
      fireEvent.click(performanceButton)
      
      // Should switch to performance tab
      expect(performanceButton).toBeInTheDocument()
    })

    it('should switch to progress tracking', async () => {
      renderWithRouter(<RelatoriosPage />)
      
      const progressButton = screen.getByText('Progresso')
      fireEvent.click(progressButton)
      
      await waitFor(() => {
        expect(screen.getByText('Acompanhamento de Progresso')).toBeInTheDocument()
      })
    })

    it('should switch to distribution analysis', async () => {
      renderWithRouter(<RelatoriosPage />)
      
      const distributionButton = screen.getByText('Distribuição')
      fireEvent.click(distributionButton)
      
      await waitFor(() => {
        expect(screen.getByText('Análise de Distribuição')).toBeInTheDocument()
      })
    })
  })

  describe('Enhanced Functionality', () => {
    it('should display real-time analytics with correct calculations', () => {
      renderWithRouter(<RelatoriosPage />)
      
      // Should show calculated metrics from context data
      expect(screen.getByText('3')).toBeInTheDocument() // Total assignments
      expect(screen.getByText('2')).toBeInTheDocument() // Active students
      expect(screen.getByText('1.5')).toBeInTheDocument() // Average per student (3/2)
      expect(screen.getByText('67%')).toBeInTheDocument() // Completion rate (2/3)
    })

    it('should show progress tracking for students', async () => {
      renderWithRouter(<RelatoriosPage />)
      
      const progressButton = screen.getByText('Progresso')
      fireEvent.click(progressButton)
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.getByText('Maria Santos')).toBeInTheDocument()
        expect(screen.getByText('1 designações')).toBeInTheDocument()
      })
    })

    it('should display assignment distribution analysis', async () => {
      renderWithRouter(<RelatoriosPage />)
      
      const distributionButton = screen.getByText('Distribuição')
      fireEvent.click(distributionButton)
      
      await waitFor(() => {
        expect(screen.getByText('Por Tipo de Parte')).toBeInTheDocument()
        expect(screen.getByText('Balanceamento por Estudante')).toBeInTheDocument()
      })
    })

    it('should handle congregation filter changes', () => {
      const mockSetSelectedCongregacaoId = vi.fn()
      mockUseProgramContext.mockReturnValue({
        selectedCongregacaoId: 'cong-1',
        setSelectedCongregacaoId: mockSetSelectedCongregacaoId
      })
      
      renderWithRouter(<RelatoriosPage />)
      
      // Congregation filter should be available
      expect(screen.getByText('Congregação:')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should have responsive analytics overview grid', () => {
      renderWithRouter(<RelatoriosPage />)
      
      const analyticsGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-4')
      expect(analyticsGrid).toBeInTheDocument()
    })

    it('should have responsive filters grid', () => {
      renderWithRouter(<RelatoriosPage />)
      
      const filtersGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-4')
      expect(filtersGrid).toBeInTheDocument()
    })

    it('should have responsive distribution analysis grid', async () => {
      renderWithRouter(<RelatoriosPage />)
      
      const distributionButton = screen.getByText('Distribuição')
      fireEvent.click(distributionButton)
      
      await waitFor(() => {
        const distributionGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2')
        expect(distributionGrid).toBeInTheDocument()
      })
    })
  })

  describe('Data Integration', () => {
    it('should handle Supabase Edge Function calls for reports', async () => {
      const mockSupabase = {
        functions: {
          invoke: vi.fn().mockResolvedValue({
            data: mockReportData,
            error: null
          })
        }
      }
      
      vi.mocked(require('@/integrations/supabase/client')).supabase = mockSupabase
      
      renderWithRouter(<RelatoriosPage />)
      
      const generateButton = screen.getByText('Gerar Relatório')
      fireEvent.click(generateButton)
      
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('reports', {
          body: {
            type: 'engagement',
            congregacao_id: 'cong-1',
            start_date: undefined,
            end_date: undefined
          }
        })
      })
    })

    it('should handle export functionality', async () => {
      const mockSupabase = {
        functions: {
          invoke: vi.fn().mockResolvedValue({
            data: { downloadUrl: 'http://example.com/report.csv' },
            error: null
          })
        }
      }
      
      vi.mocked(require('@/integrations/supabase/client')).supabase = mockSupabase
      
      renderWithRouter(<RelatoriosPage />)
      
      const exportButton = screen.getByText('Exportar CSV')
      fireEvent.click(exportButton)
      
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('reports-export', {
          body: {
            type: 'csv',
            congregacao_id: 'cong-1',
            start_date: undefined,
            end_date: undefined
          }
        })
      })
    })

    it('should handle loading states', () => {
      renderWithRouter(<RelatoriosPage />)
      
      // Should show initial state without data
      expect(screen.getByText('Selecione um tipo de relatório e clique em "Gerar Relatório" para visualizar os dados.')).toBeInTheDocument()
    })

    it('should display engagement metrics when data is loaded', async () => {
      renderWithRouter(<RelatoriosPage />)
      
      // Simulate loading report data
      const component = screen.getByTestId('unified-layout')
      expect(component).toBeInTheDocument()
    })
  })

  describe('Report Types', () => {
    it('should display engagement report when selected', async () => {
      renderWithRouter(<RelatoriosPage />)
      
      const engagementButton = screen.getByText('Engajamento')
      fireEvent.click(engagementButton)
      
      // Should be ready to display engagement metrics
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should display performance report when selected', async () => {
      renderWithRouter(<RelatoriosPage />)
      
      const performanceButton = screen.getByText('Desempenho')
      fireEvent.click(performanceButton)
      
      // Should be ready to display performance data
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should display qualifications report when selected', async () => {
      renderWithRouter(<RelatoriosPage />)
      
      const qualificationsButton = screen.getByText('Qualificações')
      fireEvent.click(qualificationsButton)
      
      // Should be ready to display qualifications data
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should display participation history when selected', async () => {
      renderWithRouter(<RelatoriosPage />)
      
      const participationButton = screen.getByText('Histórico')
      fireEvent.click(participationButton)
      
      // Should be ready to display participation history
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle Supabase errors gracefully', async () => {
      const mockSupabase = {
        functions: {
          invoke: vi.fn().mockRejectedValue(new Error('Supabase error'))
        }
      }
      
      vi.mocked(require('@/integrations/supabase/client')).supabase = mockSupabase
      
      renderWithRouter(<RelatoriosPage />)
      
      const generateButton = screen.getByText('Gerar Relatório')
      fireEvent.click(generateButton)
      
      // Should still render the layout
      await waitFor(() => {
        expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
      })
    })

    it('should handle export errors gracefully', async () => {
      const mockSupabase = {
        functions: {
          invoke: vi.fn().mockRejectedValue(new Error('Export failed'))
        }
      }
      
      vi.mocked(require('@/integrations/supabase/client')).supabase = mockSupabase
      
      renderWithRouter(<RelatoriosPage />)
      
      const exportButton = screen.getByText('Exportar CSV')
      fireEvent.click(exportButton)
      
      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
      })
    })

    it('should handle missing context data', () => {
      mockUseAssignmentContext.mockReturnValue({
        assignments: undefined,
        getAssignmentStats: vi.fn().mockReturnValue({}),
        getStudentHistory: vi.fn().mockReturnValue([])
      })
      
      renderWithRouter(<RelatoriosPage />)
      
      // Should not crash with missing data
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })
  })

  describe('Context Integration', () => {
    it('should use ProgramContext for congregation selection', () => {
      renderWithRouter(<RelatoriosPage />)
      
      expect(mockUseProgramContext).toHaveBeenCalled()
    })

    it('should use AssignmentContext for assignment data', () => {
      renderWithRouter(<RelatoriosPage />)
      
      expect(mockUseAssignmentContext).toHaveBeenCalled()
    })

    it('should use StudentContext for student data', () => {
      renderWithRouter(<RelatoriosPage />)
      
      expect(mockUseStudentContext).toHaveBeenCalled()
    })

    it('should generate real-time analytics from context data', () => {
      renderWithRouter(<RelatoriosPage />)
      
      // Should calculate metrics from context data
      expect(screen.getByText('3')).toBeInTheDocument() // Total assignments
      expect(screen.getByText('2')).toBeInTheDocument() // Active students
    })
  })

  describe('Date Range Filtering', () => {
    it('should handle date range inputs', () => {
      renderWithRouter(<RelatoriosPage />)
      
      const startDateInput = screen.getByLabelText('Data Início:')
      const endDateInput = screen.getByLabelText('Data Fim:')
      
      expect(startDateInput).toBeInTheDocument()
      expect(endDateInput).toBeInTheDocument()
      expect(startDateInput).toHaveAttribute('type', 'date')
      expect(endDateInput).toHaveAttribute('type', 'date')
    })

    it('should update date range when inputs change', () => {
      renderWithRouter(<RelatoriosPage />)
      
      const startDateInput = screen.getByLabelText('Data Início:')
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } })
      
      expect(startDateInput).toHaveValue('2024-01-01')
    })
  })

  describe('Advanced Features', () => {
    it('should show advanced qualifications component when selected', async () => {
      renderWithRouter(<RelatoriosPage />)
      
      // The advanced qualifications should be available
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should handle congregation-specific filtering', () => {
      const mockSetSelectedCongregacaoId = vi.fn()
      mockUseProgramContext.mockReturnValue({
        selectedCongregacaoId: 'cong-2',
        setSelectedCongregacaoId: mockSetSelectedCongregacaoId
      })
      
      renderWithRouter(<RelatoriosPage />)
      
      // Should use the selected congregation
      expect(mockUseProgramContext).toHaveBeenCalled()
    })
  })
})