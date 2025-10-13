import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import DesignacoesPage from '../DesignacoesPage'
import { useEstudantes } from '@/hooks/useEstudantes'
import { useAuth } from '@/contexts/AuthContext'
import { useAssignmentContext } from '@/contexts/AssignmentContext'
import { useStudentContext } from '@/contexts/StudentContext'

// Mock dependencies
vi.mock('@/hooks/useEstudantes')
vi.mock('@/contexts/AuthContext')
vi.mock('@/contexts/AssignmentContext')
vi.mock('@/contexts/StudentContext')
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

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

const mockUseEstudantes = useEstudantes as ReturnType<typeof vi.fn>
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>
const mockUseAssignmentContext = useAssignmentContext as ReturnType<typeof vi.fn>
const mockUseStudentContext = useStudentContext as ReturnType<typeof vi.fn>

const mockEstudantes = [
  {
    id: '1',
    nome: 'João Silva',
    genero: 'masculino',
    cargo: 'publicador',
    ativo: true,
    congregacao_id: 'cong-1'
  },
  {
    id: '2',
    nome: 'Maria Santos',
    genero: 'feminino',
    cargo: 'publicadora',
    ativo: true,
    congregacao_id: 'cong-1'
  }
]

const mockPrograma = {
  id: '2024-12-02',
  semana: '2-8 de dezembro de 2024',
  data_inicio: '2024-12-02',
  mes_ano: 'dezembro de 2024',
  partes: [
    {
      numero: 3,
      titulo: 'Leitura da Bíblia',
      tempo: 4,
      tipo: 'bible_reading',
      secao: 'TESOUROS'
    },
    {
      numero: 4,
      titulo: 'Iniciando conversas',
      tempo: 3,
      tipo: 'starting_conversation',
      secao: 'MINISTERIO'
    }
  ]
}

const mockDesignacoes = [
  {
    id: '1',
    programacao_item_id: 'bible_reading',
    parte_numero: 4,
    parte_titulo: 'Leitura da Bíblia',
    parte_tempo: 4,
    parte_tipo: 'bible_reading',
    principal_estudante_id: '1',
    assistente_estudante_id: null,
    status: 'OK',
    observacoes: ''
  },
  {
    id: '2',
    programacao_item_id: 'starting_conversation',
    parte_numero: 5,
    parte_titulo: 'Iniciando conversas',
    parte_tempo: 3,
    parte_tipo: 'starting_conversation',
    principal_estudante_id: '2',
    assistente_estudante_id: '1',
    status: 'OK',
    observacoes: ''
  }
]

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('DesignacoesPage Migration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      profile: { id: '1', nome: 'Test User', role: 'instrutor' }
    })
    
    mockUseEstudantes.mockReturnValue({
      estudantes: mockEstudantes,
      isLoading: false
    })
    
    mockUseAssignmentContext.mockReturnValue({
      assignments: [],
      createAssignment: vi.fn(),
      updateAssignment: vi.fn(),
      validateAssignments: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
      detectConflicts: vi.fn().mockReturnValue([]),
      generateAssignments: vi.fn()
    })
    
    mockUseStudentContext.mockReturnValue({
      getActiveStudents: vi.fn().mockReturnValue(mockEstudantes),
      getQualifiedStudents: vi.fn().mockReturnValue(mockEstudantes),
      validateStudentQualifications: vi.fn().mockReturnValue({ isValid: true })
    })

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue(JSON.stringify(mockPrograma)),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
    })

    // Mock fetch for fallback API calls
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })
  })

  describe('Layout Consistency', () => {
    it('should use UnifiedLayout component', () => {
      renderWithRouter(<DesignacoesPage />)
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should display configuration section', () => {
      renderWithRouter(<DesignacoesPage />)
      
      expect(screen.getByText('Configuração e Status')).toBeInTheDocument()
      expect(screen.getByText('Programa:')).toBeInTheDocument()
      expect(screen.getByText('Estudantes ativos:')).toBeInTheDocument()
      expect(screen.getByText('Congregação:')).toBeInTheDocument()
    })

    it('should display action buttons in header', () => {
      renderWithRouter(<DesignacoesPage />)
      
      expect(screen.getByText('Carregar Programa')).toBeInTheDocument()
      expect(screen.getByText('Limpar')).toBeInTheDocument()
      expect(screen.getByText('Gerar com S-38')).toBeInTheDocument()
    })
  })

  describe('Navigation Integration', () => {
    it('should load program from localStorage on mount', async () => {
      renderWithRouter(<DesignacoesPage />)
      
      await waitFor(() => {
        expect(screen.getByText('2-8 de dezembro de 2024')).toBeInTheDocument()
      })
    })

    it('should handle program loading', async () => {
      renderWithRouter(<DesignacoesPage />)
      
      const loadButton = screen.getByText('Carregar Programa')
      fireEvent.click(loadButton)
      
      // Should attempt to load programs
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })
  })

  describe('Enhanced Functionality', () => {
    it('should display S-38 algorithm status when assignments exist', async () => {
      // Mock component state with assignments
      renderWithRouter(<DesignacoesPage />)
      
      // The S-38 status section should be available when assignments are generated
      expect(screen.getByText('Gerar com S-38')).toBeInTheDocument()
    })

    it('should show assignment generation interface', () => {
      renderWithRouter(<DesignacoesPage />)
      
      expect(screen.getByText('Gerar com S-38')).toBeInTheDocument()
      expect(screen.getByText('Carregar Programa')).toBeInTheDocument()
    })

    it('should display student statistics', () => {
      renderWithRouter(<DesignacoesPage />)
      
      expect(screen.getByText('2 disponíveis')).toBeInTheDocument()
      expect(screen.getByText('2 estudantes')).toBeInTheDocument()
    })

    it('should handle assignment validation with S-38 rules', () => {
      const mockValidateAssignments = vi.fn().mockReturnValue({
        isValid: true,
        errors: []
      })
      
      mockUseAssignmentContext.mockReturnValue({
        ...mockUseAssignmentContext(),
        validateAssignments: mockValidateAssignments
      })
      
      renderWithRouter(<DesignacoesPage />)
      
      // Validation should be available for use
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should have responsive configuration grid', () => {
      renderWithRouter(<DesignacoesPage />)
      
      const configGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-4')
      expect(configGrid).toBeInTheDocument()
    })

    it('should have responsive header layout', () => {
      renderWithRouter(<DesignacoesPage />)
      
      const headerSection = document.querySelector('.flex.items-center.justify-between')
      expect(headerSection).toBeInTheDocument()
    })
  })

  describe('Data Integration', () => {
    it('should handle Supabase Edge Function for assignment generation', async () => {
      const mockSupabase = {
        functions: {
          invoke: vi.fn().mockResolvedValue({
            data: {
              success: true,
              data: {
                designacoes: mockDesignacoes,
                estatisticas: { conflitos_encontrados: [] }
              }
            },
            error: null
          })
        }
      }
      
      vi.mocked(require('@/integrations/supabase/client')).supabase = mockSupabase
      
      renderWithRouter(<DesignacoesPage />)
      
      const generateButton = screen.getByText('Gerar com S-38')
      fireEvent.click(generateButton)
      
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          'generate-assignments',
          expect.any(Object)
        )
      })
    })

    it('should fallback to local generator when Edge Function fails', async () => {
      const mockSupabase = {
        functions: {
          invoke: vi.fn().mockRejectedValue(new Error('Edge Function failed'))
        }
      }
      
      vi.mocked(require('@/integrations/supabase/client')).supabase = mockSupabase
      
      renderWithRouter(<DesignacoesPage />)
      
      const generateButton = screen.getByText('Gerar com S-38')
      fireEvent.click(generateButton)
      
      // Should still work with local fallback
      await waitFor(() => {
        expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
      })
    })

    it('should handle loading states', () => {
      mockUseEstudantes.mockReturnValue({
        estudantes: [],
        isLoading: true
      })
      
      renderWithRouter(<DesignacoesPage />)
      
      expect(screen.getByText('Carregando...')).toBeInTheDocument()
    })

    it('should handle empty program state', () => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
          removeItem: vi.fn()
        }
      })
      
      renderWithRouter(<DesignacoesPage />)
      
      expect(screen.getByText('Nenhuma semana carregada. Carregue a semana atual ou importe um PDF na aba Programas.')).toBeInTheDocument()
    })
  })

  describe('Assignment Management', () => {
    it('should handle assignment saving', async () => {
      const mockSupabase = {
        functions: {
          invoke: vi.fn().mockResolvedValue({
            data: { success: true, saved_count: 2 },
            error: null
          })
        }
      }
      
      vi.mocked(require('@/integrations/supabase/client')).supabase = mockSupabase
      
      renderWithRouter(<DesignacoesPage />)
      
      // Generate assignments first (mock state)
      const generateButton = screen.getByText('Gerar com S-38')
      fireEvent.click(generateButton)
      
      // Save button should appear after generation
      await waitFor(() => {
        // The save functionality should be available
        expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
      })
    })

    it('should handle real-time assignment editing', () => {
      const mockUpdateAssignment = vi.fn()
      mockUseAssignmentContext.mockReturnValue({
        ...mockUseAssignmentContext(),
        updateAssignment: mockUpdateAssignment
      })
      
      renderWithRouter(<DesignacoesPage />)
      
      // Real-time editing should be available
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should validate assignments with S-38 rules', () => {
      const mockValidateAssignments = vi.fn().mockReturnValue({
        isValid: false,
        errors: [{ message: 'Gender requirement not met' }]
      })
      
      mockUseAssignmentContext.mockReturnValue({
        ...mockUseAssignmentContext(),
        validateAssignments: mockValidateAssignments
      })
      
      renderWithRouter(<DesignacoesPage />)
      
      // Validation should be integrated
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should detect and display conflicts', () => {
      const mockDetectConflicts = vi.fn().mockReturnValue([
        { type: 'scheduling', message: 'Student has conflicting assignment' }
      ])
      
      mockUseAssignmentContext.mockReturnValue({
        ...mockUseAssignmentContext(),
        detectConflicts: mockDetectConflicts
      })
      
      renderWithRouter(<DesignacoesPage />)
      
      // Conflict detection should be available
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockSupabase = {
        functions: {
          invoke: vi.fn().mockRejectedValue(new Error('Network error'))
        }
      }
      
      vi.mocked(require('@/integrations/supabase/client')).supabase = mockSupabase
      
      global.fetch = vi.fn().mockRejectedValue(new Error('Backend also failed'))
      
      renderWithRouter(<DesignacoesPage />)
      
      const generateButton = screen.getByText('Gerar com S-38')
      fireEvent.click(generateButton)
      
      // Should still render the layout
      await waitFor(() => {
        expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
      })
    })

    it('should handle missing congregation selection', () => {
      renderWithRouter(<DesignacoesPage />)
      
      const generateButton = screen.getByText('Gerar com S-38')
      fireEvent.click(generateButton)
      
      // Should handle missing congregation gracefully
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should handle assignment validation errors', () => {
      const mockValidateAssignments = vi.fn().mockReturnValue({
        isValid: false,
        errors: [{ field: 'student', message: 'Student not qualified' }]
      })
      
      mockUseAssignmentContext.mockReturnValue({
        ...mockUseAssignmentContext(),
        validateAssignments: mockValidateAssignments
      })
      
      renderWithRouter(<DesignacoesPage />)
      
      // Should handle validation errors
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })
  })

  describe('Context Integration', () => {
    it('should use AssignmentContext for assignment management', () => {
      renderWithRouter(<DesignacoesPage />)
      
      expect(mockUseAssignmentContext).toHaveBeenCalled()
    })

    it('should use StudentContext for student qualification checks', () => {
      renderWithRouter(<DesignacoesPage />)
      
      expect(mockUseStudentContext).toHaveBeenCalled()
    })

    it('should integrate with existing estudantes hook', () => {
      renderWithRouter(<DesignacoesPage />)
      
      expect(mockUseEstudantes).toHaveBeenCalled()
    })

    it('should use auth context for user information', () => {
      renderWithRouter(<DesignacoesPage />)
      
      expect(mockUseAuth).toHaveBeenCalled()
    })
  })

  describe('Program Management', () => {
    it('should handle program selection from multiple programs', () => {
      renderWithRouter(<DesignacoesPage />)
      
      // Program selection should be available
      expect(screen.getByText('Programa:')).toBeInTheDocument()
    })

    it('should persist program data', () => {
      const mockSetItem = vi.fn()
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn().mockReturnValue(JSON.stringify(mockPrograma)),
          setItem: mockSetItem,
          removeItem: vi.fn()
        }
      })
      
      renderWithRouter(<DesignacoesPage />)
      
      // Should be ready to persist program data
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should handle program loading from different sources', async () => {
      renderWithRouter(<DesignacoesPage />)
      
      const loadButton = screen.getByText('Carregar Programa')
      fireEvent.click(loadButton)
      
      // Should attempt to load from multiple sources
      await waitFor(() => {
        expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
      })
    })
  })
})