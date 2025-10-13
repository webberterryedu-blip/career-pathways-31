import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import EstudantesPage from '../EstudantesPage'
import { useEstudantes } from '@/hooks/useEstudantes'
import { useStudentContext } from '@/contexts/StudentContext'
import { useAssignmentContext } from '@/contexts/AssignmentContext'

// Mock all dependencies
vi.mock('@/hooks/useEstudantes')
vi.mock('@/contexts/StudentContext')
vi.mock('@/contexts/AssignmentContext')

// Mock child components
vi.mock('@/components/EstudanteForm', () => ({
  default: ({ onSubmit, onCancel }: any) => (
    <div data-testid="estudante-form">
      <button onClick={() => onSubmit({ nome: 'Test Student' })}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}))

vi.mock('@/components/EstudanteCard', () => ({
  default: ({ estudante, onEdit, onDelete }: any) => (
    <div data-testid={`estudante-card-${estudante.id}`}>
      <span>{estudante.nome}</span>
      <button onClick={() => onEdit(estudante)}>Edit</button>
      <button onClick={() => onDelete(estudante.id)}>Delete</button>
    </div>
  )
}))

vi.mock('@/components/SpreadsheetUpload', () => ({
  default: ({ onImportComplete }: any) => (
    <div data-testid="spreadsheet-upload">
      <button onClick={onImportComplete}>Import Complete</button>
    </div>
  )
}))

vi.mock('@/components/EnhancedStudentImport', () => ({
  default: ({ onImportComplete, onViewList }: any) => (
    <div data-testid="enhanced-student-import">
      <button onClick={onImportComplete}>Enhanced Import Complete</button>
      <button onClick={onViewList}>View List</button>
    </div>
  )
}))

vi.mock('@/components/StudentsSpreadsheet', () => ({
  default: () => <div data-testid="students-spreadsheet">Students Spreadsheet</div>
}))

// Mock UnifiedLayout
vi.mock('@/components/layout/UnifiedLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="unified-layout">{children}</div>
  )
}))

const mockUseEstudantes = useEstudantes as ReturnType<typeof vi.fn>
const mockUseStudentContext = useStudentContext as ReturnType<typeof vi.fn>
const mockUseAssignmentContext = useAssignmentContext as ReturnType<typeof vi.fn>

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
  },
  {
    id: '3',
    nome: 'Pedro Costa',
    genero: 'masculino',
    cargo: 'anciao',
    ativo: false,
    congregacao_id: 'cong-1'
  }
]

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('EstudantesPage Migration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    mockUseEstudantes.mockReturnValue({
      estudantes: mockEstudantes,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      createEstudante: vi.fn().mockResolvedValue({}),
      updateEstudante: vi.fn().mockResolvedValue({}),
      deleteEstudante: vi.fn().mockResolvedValue({}),
      filterEstudantes: vi.fn().mockReturnValue(mockEstudantes),
      getStatistics: vi.fn().mockReturnValue({
        total: 3,
        ativos: 2,
        inativos: 1,
        menores: 0
      })
    })
    
    mockUseStudentContext.mockReturnValue({
      getFamilyMembers: vi.fn().mockReturnValue([]),
      getStudentStats: vi.fn().mockReturnValue({}),
      updateStudentQualifications: vi.fn(),
      validateStudentQualifications: vi.fn()
    })
    
    mockUseAssignmentContext.mockReturnValue({
      getAssignmentsByStudent: vi.fn().mockReturnValue([]),
      getStudentHistory: vi.fn().mockReturnValue([])
    })
  })

  describe('Layout Consistency', () => {
    it('should use UnifiedLayout component', () => {
      renderWithRouter(<EstudantesPage />)
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should render all main tabs', () => {
      renderWithRouter(<EstudantesPage />)
      
      expect(screen.getByText('Lista')).toBeInTheDocument()
      expect(screen.getByText('Novo')).toBeInTheDocument()
      expect(screen.getByText('Qualificações')).toBeInTheDocument()
      expect(screen.getByText('Histórico')).toBeInTheDocument()
      expect(screen.getByText('Importar')).toBeInTheDocument()
      expect(screen.getByText('Estatísticas')).toBeInTheDocument()
    })

    it('should display action buttons in header', () => {
      renderWithRouter(<EstudantesPage />)
      
      expect(screen.getByText('🔄 Atualizar')).toBeInTheDocument()
      expect(screen.getByText('Importar')).toBeInTheDocument()
      expect(screen.getByText('Novo Estudante')).toBeInTheDocument()
    })
  })

  describe('Navigation Integration', () => {
    it('should switch between tabs correctly', async () => {
      renderWithRouter(<EstudantesPage />)
      
      // Click on form tab
      const formTab = screen.getByText('Novo')
      fireEvent.click(formTab)
      
      await waitFor(() => {
        expect(screen.getByTestId('estudante-form')).toBeInTheDocument()
      })
    })

    it('should switch to qualifications tab', async () => {
      renderWithRouter(<EstudantesPage />)
      
      const qualificationsTab = screen.getByText('Qualificações')
      fireEvent.click(qualificationsTab)
      
      await waitFor(() => {
        expect(screen.getByText('Qualificações dos Estudantes')).toBeInTheDocument()
      })
    })

    it('should switch to import tab', async () => {
      renderWithRouter(<EstudantesPage />)
      
      const importTab = screen.getByText('Importar')
      fireEvent.click(importTab)
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-student-import')).toBeInTheDocument()
      })
    })
  })

  describe('Enhanced Functionality', () => {
    it('should display student cards in list view', () => {
      renderWithRouter(<EstudantesPage />)
      
      expect(screen.getByTestId('estudante-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('estudante-card-2')).toBeInTheDocument()
      expect(screen.getByTestId('estudante-card-3')).toBeInTheDocument()
    })

    it('should show filters section', () => {
      renderWithRouter(<EstudantesPage />)
      
      expect(screen.getByText('Filtros')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Buscar por nome...')).toBeInTheDocument()
    })

    it('should display statistics in stats tab', async () => {
      renderWithRouter(<EstudantesPage />)
      
      const statsTab = screen.getByText('Estatísticas')
      fireEvent.click(statsTab)
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument() // Total
        expect(screen.getByText('2')).toBeInTheDocument() // Ativos
        expect(screen.getByText('1')).toBeInTheDocument() // Inativos
      })
    })

    it('should show qualifications for each student', async () => {
      renderWithRouter(<EstudantesPage />)
      
      const qualificationsTab = screen.getByText('Qualificações')
      fireEvent.click(qualificationsTab)
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.getByText('Maria Santos')).toBeInTheDocument()
        expect(screen.getByText('📖 Leitura Bíblica')).toBeInTheDocument()
        expect(screen.getByText('🎭 Demonstrações')).toBeInTheDocument()
      })
    })

    it('should show assignment history when student is selected', async () => {
      renderWithRouter(<EstudantesPage />)
      
      const historyTab = screen.getByText('Histórico')
      fireEvent.click(historyTab)
      
      await waitFor(() => {
        expect(screen.getByText('Histórico de Designações')).toBeInTheDocument()
        expect(screen.getByText('Selecione um estudante')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('should have responsive grid layout for student cards', () => {
      renderWithRouter(<EstudantesPage />)
      
      const studentGrid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3')
      expect(studentGrid).toBeInTheDocument()
    })

    it('should have responsive filter layout', () => {
      renderWithRouter(<EstudantesPage />)
      
      const filterGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2')
      expect(filterGrid).toBeInTheDocument()
    })

    it('should have responsive stats layout', async () => {
      renderWithRouter(<EstudantesPage />)
      
      const statsTab = screen.getByText('Estatísticas')
      fireEvent.click(statsTab)
      
      await waitFor(() => {
        const statsGrid = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4')
        expect(statsGrid).toBeInTheDocument()
      })
    })
  })

  describe('Data Integration', () => {
    it('should handle loading states', () => {
      mockUseEstudantes.mockReturnValue({
        estudantes: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        createEstudante: vi.fn(),
        updateEstudante: vi.fn(),
        deleteEstudante: vi.fn(),
        filterEstudantes: vi.fn().mockReturnValue([]),
        getStatistics: vi.fn().mockReturnValue({ total: 0, ativos: 0, inativos: 0, menores: 0 })
      })
      
      renderWithRouter(<EstudantesPage />)
      
      // Should show skeleton loading
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('should handle error states', () => {
      mockUseEstudantes.mockReturnValue({
        estudantes: [],
        isLoading: false,
        error: 'Failed to load students',
        refetch: vi.fn(),
        createEstudante: vi.fn(),
        updateEstudante: vi.fn(),
        deleteEstudante: vi.fn(),
        filterEstudantes: vi.fn().mockReturnValue([]),
        getStatistics: vi.fn().mockReturnValue({ total: 0, ativos: 0, inativos: 0, menores: 0 })
      })
      
      renderWithRouter(<EstudantesPage />)
      
      expect(screen.getByText('Erro ao carregar estudantes')).toBeInTheDocument()
      expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
    })

    it('should handle empty data states', () => {
      mockUseEstudantes.mockReturnValue({
        estudantes: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        createEstudante: vi.fn(),
        updateEstudante: vi.fn(),
        deleteEstudante: vi.fn(),
        filterEstudantes: vi.fn().mockReturnValue([]),
        getStatistics: vi.fn().mockReturnValue({ total: 0, ativos: 0, inativos: 0, menores: 0 })
      })
      
      renderWithRouter(<EstudantesPage />)
      
      expect(screen.getByText('Nenhum estudante encontrado')).toBeInTheDocument()
      expect(screen.getByText('Cadastrar Estudante')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should handle student creation', async () => {
      const mockCreate = vi.fn().mockResolvedValue({})
      mockUseEstudantes.mockReturnValue({
        ...mockUseEstudantes(),
        createEstudante: mockCreate
      })
      
      renderWithRouter(<EstudantesPage />)
      
      // Switch to form tab
      const formTab = screen.getByText('Novo')
      fireEvent.click(formTab)
      
      await waitFor(() => {
        const submitButton = screen.getByText('Submit')
        fireEvent.click(submitButton)
      })
      
      expect(mockCreate).toHaveBeenCalledWith({ nome: 'Test Student' })
    })

    it('should handle student editing', async () => {
      renderWithRouter(<EstudantesPage />)
      
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('estudante-form')).toBeInTheDocument()
      })
    })

    it('should handle student deletion', async () => {
      const mockDelete = vi.fn().mockResolvedValue({})
      mockUseEstudantes.mockReturnValue({
        ...mockUseEstudantes(),
        deleteEstudante: mockDelete
      })
      
      renderWithRouter(<EstudantesPage />)
      
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)
      
      expect(mockDelete).toHaveBeenCalledWith('1')
    })
  })

  describe('Import Functionality', () => {
    it('should show enhanced import component', async () => {
      renderWithRouter(<EstudantesPage />)
      
      const importTab = screen.getByText('Importar')
      fireEvent.click(importTab)
      
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-student-import')).toBeInTheDocument()
      })
    })

    it('should handle import completion', async () => {
      const mockRefetch = vi.fn()
      mockUseEstudantes.mockReturnValue({
        ...mockUseEstudantes(),
        refetch: mockRefetch
      })
      
      renderWithRouter(<EstudantesPage />)
      
      const importTab = screen.getByText('Importar')
      fireEvent.click(importTab)
      
      await waitFor(() => {
        const importCompleteButton = screen.getByText('Enhanced Import Complete')
        fireEvent.click(importCompleteButton)
      })
      
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('should show legacy import option', async () => {
      renderWithRouter(<EstudantesPage />)
      
      const importTab = screen.getByText('Importar')
      fireEvent.click(importTab)
      
      await waitFor(() => {
        expect(screen.getByText('Mostrar sistema de importação legado (compatibilidade)')).toBeInTheDocument()
      })
    })
  })

  describe('Context Integration', () => {
    it('should use StudentContext for family members', async () => {
      const mockGetFamilyMembers = vi.fn().mockReturnValue([{ id: '4', nome: 'Filho Silva' }])
      mockUseStudentContext.mockReturnValue({
        ...mockUseStudentContext(),
        getFamilyMembers: mockGetFamilyMembers
      })
      
      renderWithRouter(<EstudantesPage />)
      
      const qualificationsTab = screen.getByText('Qualificações')
      fireEvent.click(qualificationsTab)
      
      await waitFor(() => {
        expect(mockGetFamilyMembers).toHaveBeenCalled()
      })
    })

    it('should use AssignmentContext for student history', async () => {
      const mockGetStudentHistory = vi.fn().mockReturnValue([])
      mockUseAssignmentContext.mockReturnValue({
        ...mockUseAssignmentContext(),
        getStudentHistory: mockGetStudentHistory
      })
      
      renderWithRouter(<EstudantesPage />)
      
      const historyTab = screen.getByText('Histórico')
      fireEvent.click(historyTab)
      
      // Should be ready to use assignment context when student is selected
      expect(screen.getByText('Histórico de Designações')).toBeInTheDocument()
    })
  })
})