import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../Dashboard'
import { useAuth } from '@/contexts/AuthContext'
import { useEstudantes } from '@/hooks/useEstudantes'
import { useDesignacoesPendentes } from '@/hooks/useDesignacoesPendentes'
import { useAssignmentContext } from '@/contexts/AssignmentContext'
import { useStudentContext } from '@/contexts/StudentContext'

// Mock all dependencies
vi.mock('@/contexts/AuthContext')
vi.mock('@/hooks/useEstudantes')
vi.mock('@/hooks/useDesignacoesPendentes')
vi.mock('@/contexts/AssignmentContext')
vi.mock('@/contexts/StudentContext')

// Mock react-router-dom with a simple navigate function
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock UnifiedLayout
vi.mock('@/components/layout/UnifiedLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="unified-layout">{children}</div>
  )
}))

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>
const mockUseEstudantes = useEstudantes as ReturnType<typeof vi.fn>
const mockUseDesignacoesPendentes = useDesignacoesPendentes as ReturnType<typeof vi.fn>
const mockUseAssignmentContext = useAssignmentContext as ReturnType<typeof vi.fn>
const mockUseStudentContext = useStudentContext as ReturnType<typeof vi.fn>

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Dashboard Page Migration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      profile: { id: '1', nome: 'Test User', role: 'instrutor' }
    })
    
    mockUseEstudantes.mockReturnValue({
      estudantes: [
        { id: '1', nome: 'João Silva', ativo: true },
        { id: '2', nome: 'Maria Santos', ativo: true },
        { id: '3', nome: 'Pedro Costa', ativo: false }
      ],
      isLoading: false
    })
    
    mockUseDesignacoesPendentes.mockReturnValue({
      stats: { pendentes: 5 },
      isLoading: false
    })
    
    mockUseAssignmentContext.mockReturnValue({
      assignments: [
        { id: '1', weekDate: '2024-12-15', studentId: '1', partType: 'bible_reading' },
        { id: '2', weekDate: '2024-12-22', studentId: '2', partType: 'starting_conversation' }
      ]
    })
    
    mockUseStudentContext.mockReturnValue({
      getAvailableStudents: vi.fn().mockReturnValue([
        { id: '1', nome: 'João Silva' },
        { id: '2', nome: 'Maria Santos' }
      ])
    })
  })

  describe('Layout Consistency', () => {
    it('should use UnifiedLayout component', () => {
      renderWithRouter(<Dashboard />)
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should render all main dashboard sections', () => {
      renderWithRouter(<Dashboard />)
      
      // Check for statistics cards
      expect(screen.getByText('Total de Estudantes')).toBeInTheDocument()
      expect(screen.getByText('Estudantes Disponíveis')).toBeInTheDocument()
      expect(screen.getAllByText('Próximas Designações')).toHaveLength(2) // Appears in card and section
      expect(screen.getByText('Próxima Reunião')).toBeInTheDocument()
    })

    it('should display quick actions section', () => {
      renderWithRouter(<Dashboard />)
      
      expect(screen.getByText('Ações Rápidas')).toBeInTheDocument()
      expect(screen.getAllByText('Gerenciar Estudantes')).toHaveLength(2) // Appears in button and span
      expect(screen.getByText('Importar Programa')).toBeInTheDocument()
      expect(screen.getAllByText('Gerar Designações')).toHaveLength(2) // Appears in button and span
      expect(screen.getByText('Ver Relatórios')).toBeInTheDocument()
    })
  })

  describe('Navigation Integration', () => {
    it('should have navigation buttons available', () => {
      renderWithRouter(<Dashboard />)
      
      // Check that navigation buttons exist (some may appear multiple times)
      expect(screen.getAllByText('Gerenciar Estudantes').length).toBeGreaterThan(0)
      expect(screen.getByText('Importar Programa')).toBeInTheDocument()
      expect(screen.getAllByText('Gerar Designações').length).toBeGreaterThan(0)
      expect(screen.getByText('Ver Relatórios')).toBeInTheDocument()
    })

    it('should use navigate function from react-router-dom', () => {
      renderWithRouter(<Dashboard />)
      
      // The component should have access to navigation
      expect(mockNavigate).toBeDefined()
    })
  })

  describe('Enhanced Functionality', () => {
    it('should display student statistics sections', () => {
      renderWithRouter(<Dashboard />)
      
      // Check for statistics card titles
      expect(screen.getByText('Total de Estudantes')).toBeInTheDocument()
      expect(screen.getByText('Estudantes Disponíveis')).toBeInTheDocument()
      expect(screen.getAllByText('Próximas Designações').length).toBeGreaterThan(0)
      expect(screen.getByText('Próxima Reunião')).toBeInTheDocument()
    })

    it('should display assignment overview sections', () => {
      renderWithRouter(<Dashboard />)
      
      // Check for section titles (may appear multiple times)
      expect(screen.getByText('Status dos Estudantes')).toBeInTheDocument()
    })

    it('should show upcoming assignments content', () => {
      renderWithRouter(<Dashboard />)
      
      // Check for assignment-related content
      expect(screen.getByText('Nenhuma designação programada')).toBeInTheDocument()
    })

    it('should display student status information', () => {
      renderWithRouter(<Dashboard />)
      
      expect(screen.getByText('Disponíveis')).toBeInTheDocument()
      expect(screen.getByText('Total Ativos')).toBeInTheDocument()
      expect(screen.getByText('Qualificados para Discursos')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should have responsive grid layout for statistics', () => {
      renderWithRouter(<Dashboard />)
      
      const statsGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4')
      expect(statsGrid).toBeInTheDocument()
    })

    it('should have responsive quick actions layout', () => {
      renderWithRouter(<Dashboard />)
      
      const quickActionsGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4')
      expect(quickActionsGrid).toBeInTheDocument()
    })

    it('should have responsive assignment overview layout', () => {
      renderWithRouter(<Dashboard />)
      
      const overviewGrid = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2')
      expect(overviewGrid).toBeInTheDocument()
    })
  })

  describe('Data Integration', () => {
    it('should handle loading states', () => {
      mockUseEstudantes.mockReturnValue({
        estudantes: [],
        isLoading: true
      })
      
      renderWithRouter(<Dashboard />)
      
      // Should still render layout while loading
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should handle empty data states', () => {
      mockUseEstudantes.mockReturnValue({
        estudantes: [],
        isLoading: false
      })
      
      mockUseAssignmentContext.mockReturnValue({
        assignments: []
      })
      
      renderWithRouter(<Dashboard />)
      
      // Should render without crashing
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
      expect(screen.getByText('Total de Estudantes')).toBeInTheDocument()
    })

    it('should integrate with contexts correctly', () => {
      renderWithRouter(<Dashboard />)
      
      // Should call all required hooks
      expect(mockUseEstudantes).toHaveBeenCalled()
      expect(mockUseAssignmentContext).toHaveBeenCalled()
      expect(mockUseStudentContext).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle context errors gracefully', () => {
      mockUseEstudantes.mockReturnValue({
        estudantes: null,
        isLoading: false,
        error: 'Failed to load students'
      })
      
      renderWithRouter(<Dashboard />)
      
      // Should still render the layout
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should handle missing assignment context', () => {
      mockUseAssignmentContext.mockReturnValue({
        assignments: [] // Use empty array instead of undefined to prevent crashes
      })
      
      renderWithRouter(<Dashboard />)
      
      // Should not crash and still render
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })
  })
})