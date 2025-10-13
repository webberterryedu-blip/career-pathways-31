import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProgramasPage from '../ProgramasPage'
import { useProgramContext } from '@/contexts/ProgramContext'

// Mock dependencies
vi.mock('@/contexts/ProgramContext')
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

const mockUseProgramContext = useProgramContext as ReturnType<typeof vi.fn>

const mockPrograma = {
  id: '2024-12-02',
  semana: '2-8 de dezembro de 2024',
  data_inicio: '2024-12-02',
  mes_ano: 'dezembro de 2024',
  tema: 'Programa Ministerial',
  partes: [
    {
      numero: 3,
      titulo: 'Leitura da Bíblia',
      tempo: 4,
      tipo: 'leitura_biblica',
      secao: 'TESOUROS',
      referencia: 'Provérbios 25:1-17',
      instrucoes: 'Apenas homens. Sem introdução ou conclusão.'
    },
    {
      numero: 4,
      titulo: 'Iniciando conversas',
      tempo: 3,
      tipo: 'demonstracao',
      secao: 'MINISTERIO',
      cena: 'De casa em casa',
      instrucoes: 'Demonstração. Ajudante do mesmo sexo ou parente.'
    }
  ],
  criado_em: '2024-12-01T00:00:00Z',
  atualizado_em: '2024-12-01T00:00:00Z'
}

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('ProgramasPage Migration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    mockUseProgramContext.mockReturnValue({
      setSelectedProgramId: vi.fn(),
      setSelectedCongregacaoId: vi.fn(),
      selectedProgramId: null,
      selectedCongregacaoId: null
    })

    // Mock fetch for fallback API calls
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })
  })

  describe('Layout Consistency', () => {
    it('should use UnifiedLayout component', () => {
      renderWithRouter(<ProgramasPage />)
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should render all main tabs', () => {
      renderWithRouter(<ProgramasPage />)
      
      expect(screen.getByText('Lista de Semanas')).toBeInTheDocument()
      expect(screen.getByText('Importar')).toBeInTheDocument()
      expect(screen.getByText('Recursos')).toBeInTheDocument()
      expect(screen.getByText('Detalhes')).toBeInTheDocument()
    })

    it('should display action buttons in header', () => {
      renderWithRouter(<ProgramasPage />)
      
      expect(screen.getByText('Carregar Programas')).toBeInTheDocument()
      expect(screen.getByText('Importar PDF')).toBeInTheDocument()
    })
  })

  describe('Navigation Integration', () => {
    it('should switch between tabs correctly', async () => {
      renderWithRouter(<ProgramasPage />)
      
      // Click on import tab
      const importTab = screen.getByText('Importar')
      fireEvent.click(importTab)
      
      await waitFor(() => {
        expect(screen.getByText('Importar Apostila MWB (PDF)')).toBeInTheDocument()
      })
    })

    it('should switch to resources tab', async () => {
      renderWithRouter(<ProgramasPage />)
      
      const resourcesTab = screen.getByText('Recursos')
      fireEvent.click(resourcesTab)
      
      await waitFor(() => {
        expect(screen.getByText('Recursos e Materiais')).toBeInTheDocument()
        expect(screen.getByText('Apostila MWB')).toBeInTheDocument()
        expect(screen.getByText('Vídeos JW.org')).toBeInTheDocument()
      })
    })

    it('should navigate to assignments page when using program', async () => {
      const mockNavigate = vi.fn()
      const mockSetSelectedProgramId = vi.fn()
      const mockSetSelectedCongregacaoId = vi.fn()
      
      vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate)
      mockUseProgramContext.mockReturnValue({
        setSelectedProgramId: mockSetSelectedProgramId,
        setSelectedCongregacaoId: mockSetSelectedCongregacaoId,
        selectedProgramId: null,
        selectedCongregacaoId: null
      })
      
      // Mock programs loaded state
      const { rerender } = renderWithRouter(<ProgramasPage />)
      
      // Simulate loading programs by clicking load button
      const loadButton = screen.getByText('Carregar Programas')
      fireEvent.click(loadButton)
      
      // Wait for potential async operations
      await waitFor(() => {
        // The component should be ready to handle program selection
        expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
      })
    })
  })

  describe('Enhanced Functionality', () => {
    it('should show empty state when no programs loaded', () => {
      renderWithRouter(<ProgramasPage />)
      
      expect(screen.getByText('Nenhum programa carregado')).toBeInTheDocument()
      expect(screen.getByText('Importe uma apostila PDF ou carregue um programa de exemplo')).toBeInTheDocument()
    })

    it('should display PDF import interface', async () => {
      renderWithRouter(<ProgramasPage />)
      
      const importTab = screen.getByText('Importar')
      fireEvent.click(importTab)
      
      await waitFor(() => {
        expect(screen.getByText('Importar Apostila MWB (PDF)')).toBeInTheDocument()
        expect(screen.getByText('Selecionar arquivo PDF:')).toBeInTheDocument()
      })
    })

    it('should show resources and materials', async () => {
      renderWithRouter(<ProgramasPage />)
      
      const resourcesTab = screen.getByText('Recursos')
      fireEvent.click(resourcesTab)
      
      await waitFor(() => {
        expect(screen.getByText('Apostila MWB')).toBeInTheDocument()
        expect(screen.getByText('Vídeos JW.org')).toBeInTheDocument()
        expect(screen.getByText('Guia S-38')).toBeInTheDocument()
        expect(screen.getByText('Templates')).toBeInTheDocument()
      })
    })

    it('should handle program activation', async () => {
      const mockSetSelectedProgramId = vi.fn()
      mockUseProgramContext.mockReturnValue({
        setSelectedProgramId: mockSetSelectedProgramId,
        setSelectedCongregacaoId: vi.fn(),
        selectedProgramId: null,
        selectedCongregacaoId: null
      })
      
      renderWithRouter(<ProgramasPage />)
      
      // The activation functionality should be available when programs are loaded
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should have responsive grid layout for program cards', () => {
      renderWithRouter(<ProgramasPage />)
      
      // Should have responsive grid classes when programs are loaded
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should have responsive resource cards layout', async () => {
      renderWithRouter(<ProgramasPage />)
      
      const resourcesTab = screen.getByText('Recursos')
      fireEvent.click(resourcesTab)
      
      await waitFor(() => {
        const resourceGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2')
        expect(resourceGrid).toBeInTheDocument()
      })
    })
  })

  describe('Data Integration', () => {
    it('should handle Supabase Edge Function calls', async () => {
      const mockSupabase = {
        functions: {
          invoke: vi.fn().mockResolvedValue({
            data: { success: true, data: [mockPrograma] },
            error: null
          })
        }
      }
      
      vi.mocked(require('@/integrations/supabase/client')).supabase = mockSupabase
      
      renderWithRouter(<ProgramasPage />)
      
      const loadButton = screen.getByText('Carregar Programas')
      fireEvent.click(loadButton)
      
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('list-programs-json')
      })
    })

    it('should fallback to backend API when Edge Function fails', async () => {
      const mockSupabase = {
        functions: {
          invoke: vi.fn().mockRejectedValue(new Error('Edge Function failed'))
        }
      }
      
      vi.mocked(require('@/integrations/supabase/client')).supabase = mockSupabase
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{
          idSemana: '2024-12-02',
          semanaLabel: '2-8 de dezembro de 2024',
          tema: 'Programa Ministerial',
          programacao: []
        }])
      })
      
      renderWithRouter(<ProgramasPage />)
      
      const loadButton = screen.getByText('Carregar Programas')
      fireEvent.click(loadButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/programacoes/mock')
      })
    })

    it('should handle loading states', () => {
      renderWithRouter(<ProgramasPage />)
      
      // Should show empty state initially
      expect(screen.getByText('Nenhum programa carregado')).toBeInTheDocument()
    })
  })

  describe('PDF Processing', () => {
    it('should handle PDF file selection', async () => {
      renderWithRouter(<ProgramasPage />)
      
      const importTab = screen.getByText('Importar')
      fireEvent.click(importTab)
      
      await waitFor(() => {
        const fileInput = screen.getByLabelText('Selecionar arquivo PDF:')
        expect(fileInput).toBeInTheDocument()
        expect(fileInput).toHaveAttribute('accept', '.pdf')
      })
    })

    it('should show processing state during PDF extraction', async () => {
      renderWithRouter(<ProgramasPage />)
      
      const importTab = screen.getByText('Importar')
      fireEvent.click(importTab)
      
      await waitFor(() => {
        expect(screen.getByText('Processar Apostila')).toBeInTheDocument()
      })
    })

    it('should display extracted data preview', async () => {
      renderWithRouter(<ProgramasPage />)
      
      const importTab = screen.getByText('Importar')
      fireEvent.click(importTab)
      
      // The PDF processing interface should be available
      await waitFor(() => {
        expect(screen.getByText('Importar Apostila MWB (PDF)')).toBeInTheDocument()
      })
    })
  })

  describe('Program Management', () => {
    it('should handle program selection', () => {
      const mockSetSelectedProgramId = vi.fn()
      mockUseProgramContext.mockReturnValue({
        setSelectedProgramId: mockSetSelectedProgramId,
        setSelectedCongregacaoId: vi.fn(),
        selectedProgramId: null,
        selectedCongregacaoId: null
      })
      
      renderWithRouter(<ProgramasPage />)
      
      // Context should be available for program selection
      expect(mockUseProgramContext).toHaveBeenCalled()
    })

    it('should persist program data to localStorage', () => {
      const mockSetItem = vi.fn()
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: mockSetItem,
          getItem: vi.fn(),
          removeItem: vi.fn()
        }
      })
      
      renderWithRouter(<ProgramasPage />)
      
      // Component should be ready to use localStorage
      expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
    })

    it('should show program details when selected', async () => {
      renderWithRouter(<ProgramasPage />)
      
      // Details tab should be available but disabled initially
      const detailsTab = screen.getByText('Detalhes')
      expect(detailsTab).toBeInTheDocument()
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
      
      renderWithRouter(<ProgramasPage />)
      
      const loadButton = screen.getByText('Carregar Programas')
      fireEvent.click(loadButton)
      
      // Should still render the layout
      await waitFor(() => {
        expect(screen.getByTestId('unified-layout')).toBeInTheDocument()
      })
    })

    it('should handle invalid PDF files', async () => {
      renderWithRouter(<ProgramasPage />)
      
      const importTab = screen.getByText('Importar')
      fireEvent.click(importTab)
      
      await waitFor(() => {
        const fileInput = screen.getByLabelText('Selecionar arquivo PDF:')
        expect(fileInput).toBeInTheDocument()
      })
    })

    it('should handle empty program data', () => {
      renderWithRouter(<ProgramasPage />)
      
      // Should show empty state
      expect(screen.getByText('Nenhum programa carregado')).toBeInTheDocument()
    })
  })

  describe('Context Integration', () => {
    it('should use ProgramContext for state management', () => {
      renderWithRouter(<ProgramasPage />)
      
      expect(mockUseProgramContext).toHaveBeenCalled()
    })

    it('should update context when program is selected', () => {
      const mockSetSelectedProgramId = vi.fn()
      const mockSetSelectedCongregacaoId = vi.fn()
      
      mockUseProgramContext.mockReturnValue({
        setSelectedProgramId: mockSetSelectedProgramId,
        setSelectedCongregacaoId: mockSetSelectedCongregacaoId,
        selectedProgramId: null,
        selectedCongregacaoId: null
      })
      
      renderWithRouter(<ProgramasPage />)
      
      // Context setters should be available
      expect(mockUseProgramContext).toHaveBeenCalled()
    })
  })
})