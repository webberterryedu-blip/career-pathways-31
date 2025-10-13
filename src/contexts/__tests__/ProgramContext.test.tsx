import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { ProgramProvider, useProgramContext } from '../ProgramContext'
import { useAuth } from '../AuthContext'
import { supabase } from '@/integrations/supabase/client'

// Mock dependencies
vi.mock('../AuthContext', () => ({
  useAuth: vi.fn()
}))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>
const mockSupabase = supabase as any

// Test component to access context
const TestComponent = ({ onContextReady }: { onContextReady?: (context: any) => void }) => {
  const context = useProgramContext()
  
  if (onContextReady) {
    onContextReady(context)
  }
  
  return (
    <div>
      <div data-testid="programs-count">{context.programs.length}</div>
      <div data-testid="loading">{context.loading.toString()}</div>
      <div data-testid="error">{context.error || 'no-error'}</div>
      <div data-testid="selected-program">{context.selectedProgramId || 'none'}</div>
      <div data-testid="selected-congregation">{context.selectedCongregacaoId || 'none'}</div>
      <div data-testid="selected-week">{context.selectedWeekStart || 'none'}</div>
    </div>
  )
}

const renderWithProvider = (children: React.ReactNode) => {
  return render(
    <ProgramProvider>
      {children}
    </ProgramProvider>
  )
}

describe('ProgramContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    
    // Default auth mock
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id' }
    })
    
    // Default Supabase mocks
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        }),
        neq: vi.fn().mockResolvedValue({ error: null })
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Provider Initialization', () => {
    it('should provide context to children', () => {
      renderWithProvider(<TestComponent />)
      
      expect(screen.getByTestId('programs-count')).toBeInTheDocument()
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.getByTestId('error')).toBeInTheDocument()
    })

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useProgramContext must be used within a ProgramProvider')
      
      consoleSpy.mockRestore()
    })

    it('should initialize with empty state', async () => {
      renderWithProvider(<TestComponent />)
      
      expect(screen.getByTestId('programs-count')).toHaveTextContent('0')
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })
      
      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
      expect(screen.getByTestId('selected-program')).toHaveTextContent('none')
      expect(screen.getByTestId('selected-congregation')).toHaveTextContent('none')
      expect(screen.getByTestId('selected-week')).toHaveTextContent('none')
    })

    it('should restore state from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'selectedCongregacaoId': return 'cong-1'
          case 'selectedProgramId': return 'prog-1'
          case 'selectedWeekStart': return '2024-01-01'
          default: return null
        }
      })

      renderWithProvider(<TestComponent />)
      
      expect(screen.getByTestId('selected-congregation')).toHaveTextContent('cong-1')
      expect(screen.getByTestId('selected-program')).toHaveTextContent('prog-1')
      expect(screen.getByTestId('selected-week')).toHaveTextContent('2024-01-01')
    })
  })

  describe('Program State Management', () => {
    it('should load programs when user is authenticated', async () => {
      const mockPrograms = [
        {
          id: '1',
          arquivo_nome: 'Programa Janeiro 2024',
          mes_ano: '2024-01',
          status: 'ativo',
          user_id: 'test-user-id',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockPrograms, 
            error: null 
          })
        })
      })

      renderWithProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('programs-count')).toHaveTextContent('1')
      })
    })

    it('should handle loading state during data fetch', async () => {
      let resolvePromise: (value: any) => void
      const loadingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue(loadingPromise)
        })
      })

      renderWithProvider(<TestComponent />)

      // Initially should show loading
      expect(screen.getByTestId('loading')).toHaveTextContent('true')

      // Resolve the promise
      act(() => {
        resolvePromise!({ data: [], error: null })
      })

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })
    })

    it('should handle errors during data fetch', async () => {
      const mockError = new Error('Database connection failed')
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(mockError)
        })
      })

      renderWithProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Database connection failed')
      })
    })

    it('should clear programs when user logs out', async () => {
      // First render with user
      const { rerender } = renderWithProvider(<TestComponent />)
      
      await waitFor(() => {
        expect(screen.getByTestId('programs-count')).toHaveTextContent('0')
      })

      // Then simulate logout
      mockUseAuth.mockReturnValue({ user: null })
      
      rerender(
        <ProgramProvider>
          <TestComponent />
        </ProgramProvider>
      )

      expect(screen.getByTestId('programs-count')).toHaveTextContent('0')
    })
  })

  describe('Program CRUD Operations', () => {
    it('should create new program', async () => {
      const mockNewProgram = {
        id: '2',
        arquivo_nome: 'Novo Programa',
        mes_ano: '2024-02',
        status: 'inativo',
        user_id: 'test-user-id',
        created_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: mockNewProgram, 
              error: null 
            })
          })
        })
      })

      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const newProgram = {
        title: 'Novo Programa',
        weekDate: '2024-02',
        isActive: false,
        uploadedBy: 'test-user-id',
        sections: []
      }

      const result = await act(async () => {
        return await contextRef.createProgram(newProgram)
      })

      expect(result).toBeTruthy()
      expect(result?.id).toBe('2')
      
      await waitFor(() => {
        expect(screen.getByTestId('programs-count')).toHaveTextContent('1')
      })
    })

    it('should update existing program', async () => {
      const mockUpdatedProgram = {
        id: '1',
        arquivo_nome: 'Programa Atualizado',
        mes_ano: '2024-01',
        status: 'ativo',
        user_id: 'test-user-id',
        created_at: '2024-01-01T00:00:00Z'
      }

      // Mock initial load with one program
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: [{ ...mockUpdatedProgram, arquivo_nome: 'Programa Original' }], 
            error: null 
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: mockUpdatedProgram, 
                error: null 
              })
            })
          })
        })
      })

      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
        expect(screen.getByTestId('programs-count')).toHaveTextContent('1')
      })

      const result = await act(async () => {
        return await contextRef.updateProgram('1', { title: 'Programa Atualizado' })
      })

      expect(result).toBeTruthy()
      expect(result?.title).toBe('Programa Atualizado')
    })

    it('should delete program', async () => {
      const mockProgram = {
        id: '1',
        arquivo_nome: 'Programa para Deletar',
        mes_ano: '2024-01',
        status: 'inativo',
        user_id: 'test-user-id',
        created_at: '2024-01-01T00:00:00Z'
      }

      // Mock initial load with one program
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: [mockProgram], 
            error: null 
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })

      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
        expect(screen.getByTestId('programs-count')).toHaveTextContent('1')
      })

      const result = await act(async () => {
        return await contextRef.deleteProgram('1')
      })

      expect(result).toBe(true)
      
      await waitFor(() => {
        expect(screen.getByTestId('programs-count')).toHaveTextContent('0')
      })
    })
  })

  describe('Program Activation', () => {
    it('should activate program and deactivate others', async () => {
      const mockPrograms = [
        {
          id: '1',
          arquivo_nome: 'Programa 1',
          mes_ano: '2024-01',
          status: 'inativo',
          user_id: 'test-user-id',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          arquivo_nome: 'Programa 2',
          mes_ano: '2024-02',
          status: 'ativo',
          user_id: 'test-user-id',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockPrograms, 
            error: null 
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
          neq: vi.fn().mockResolvedValue({ error: null })
        })
      })

      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
        expect(screen.getByTestId('programs-count')).toHaveTextContent('2')
      })

      const result = await act(async () => {
        return await contextRef.activateProgram('1')
      })

      expect(result).toBe(true)
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ status: 'inativo' })
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ status: 'ativo' })
    })

    it('should deactivate program', async () => {
      const mockProgram = {
        id: '1',
        arquivo_nome: 'Programa Ativo',
        mes_ano: '2024-01',
        status: 'ativo',
        user_id: 'test-user-id',
        created_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: [mockProgram], 
            error: null 
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })

      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
        expect(screen.getByTestId('programs-count')).toHaveTextContent('1')
      })

      const result = await act(async () => {
        return await contextRef.deactivateProgram('1')
      })

      expect(result).toBe(true)
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ status: 'inativo' })
    })
  })

  describe('Program Validation', () => {
    it('should validate program correctly', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const validProgram = {
        id: '1',
        title: 'Programa Válido',
        weekDate: '2024-01-01',
        isActive: true,
        uploadedBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        sections: [
          {
            id: '1',
            name: 'Tesouros da Palavra',
            totalTime: 10,
            parts: [
              {
                id: '1-1',
                title: 'Discurso',
                type: 'talk',
                timeAllotted: 10,
                assistantRequired: false
              }
            ]
          }
        ]
      }

      const result = contextRef.validateProgram(validProgram)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect validation errors', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const invalidProgram = {
        id: '1',
        title: '',
        weekDate: '',
        isActive: true,
        uploadedBy: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        sections: [
          {
            id: '1',
            name: '',
            totalTime: 10,
            parts: [
              {
                id: '1-1',
                title: '',
                type: 'talk',
                timeAllotted: 0,
                assistantRequired: false
              }
            ]
          }
        ]
      }

      const result = contextRef.validateProgram(invalidProgram)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('title is required'))).toBe(true)
      expect(result.errors.some(e => e.includes('Week date is required'))).toBe(true)
    })
  })

  describe('PDF Parsing', () => {
    it('should parse program from PDF file', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const mockFile = new File(['mock pdf content'], 'programa.pdf', { type: 'application/pdf' })

      const result = await act(async () => {
        return await contextRef.parseProgramFromPDF(mockFile)
      })

      expect(result).toBeTruthy()
      expect(result?.title).toContain('programa.pdf')
      expect(result?.sections).toHaveLength(2) // Mock implementation returns 2 sections
    })

    it('should handle PDF parsing errors', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock user to be null from the start to trigger an error
      mockUseAuth.mockReturnValue({ user: null })

      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const mockFile = new File(['mock pdf content'], 'programa.pdf', { type: 'application/pdf' })

      const result = await act(async () => {
        return await contextRef.parseProgramFromPDF(mockFile)
      })

      expect(result).toBeNull()
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to parse PDF')
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Program Queries', () => {
    it('should get programs by week', async () => {
      const mockPrograms = [
        {
          id: '1',
          arquivo_nome: 'Programa Janeiro',
          mes_ano: '2024-01-01',
          status: 'ativo',
          user_id: 'test-user-id',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          arquivo_nome: 'Programa Fevereiro',
          mes_ano: '2024-02-01',
          status: 'inativo',
          user_id: 'test-user-id',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockPrograms, 
            error: null 
          })
        })
      })

      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
        expect(screen.getByTestId('programs-count')).toHaveTextContent('2')
      })

      const januaryPrograms = contextRef.getProgramsByWeek('2024-01-01')
      expect(januaryPrograms).toHaveLength(1)
      expect(januaryPrograms[0].title).toBe('Programa Janeiro')
    })

    it('should get active programs', async () => {
      const mockPrograms = [
        {
          id: '1',
          arquivo_nome: 'Programa Ativo',
          mes_ano: '2024-01',
          status: 'ativo',
          user_id: 'test-user-id',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          arquivo_nome: 'Programa Inativo',
          mes_ano: '2024-02',
          status: 'inativo',
          user_id: 'test-user-id',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockPrograms, 
            error: null 
          })
        })
      })

      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
        expect(screen.getByTestId('programs-count')).toHaveTextContent('2')
      })

      const activePrograms = contextRef.getActivePrograms()
      expect(activePrograms).toHaveLength(1)
      expect(activePrograms[0].title).toBe('Programa Ativo')
    })
  })

  describe('Selection State Management', () => {
    it('should update selected congregation and persist to localStorage', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      act(() => {
        contextRef.setSelectedCongregacaoId('cong-123')
      })

      expect(screen.getByTestId('selected-congregation')).toHaveTextContent('cong-123')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedCongregacaoId', 'cong-123')
    })

    it('should update selected program and persist to localStorage', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      act(() => {
        contextRef.setSelectedProgramId('prog-456')
      })

      expect(screen.getByTestId('selected-program')).toHaveTextContent('prog-456')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedProgramId', 'prog-456')
    })

    it('should update selected week and persist to localStorage', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      act(() => {
        contextRef.setSelectedWeekStart('2024-01-15')
      })

      expect(screen.getByTestId('selected-week')).toHaveTextContent('2024-01-15')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedWeekStart', '2024-01-15')
    })

    it('should clear context and localStorage', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      // First set some values
      act(() => {
        contextRef.setSelectedCongregacaoId('cong-123')
        contextRef.setSelectedProgramId('prog-456')
        contextRef.setSelectedWeekStart('2024-01-15')
      })

      // Then clear context
      act(() => {
        contextRef.clearContext()
      })

      expect(screen.getByTestId('selected-congregation')).toHaveTextContent('none')
      expect(screen.getByTestId('selected-program')).toHaveTextContent('none')
      expect(screen.getByTestId('selected-week')).toHaveTextContent('none')
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedCongregacaoId')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedProgramId')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedWeekStart')
    })
  })

  describe('Utility Functions', () => {
    it('should refresh programs', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      await act(async () => {
        await contextRef.refreshPrograms()
      })

      // Should trigger another load
      expect(mockSupabase.from).toHaveBeenCalled()
    })

    it('should clear error', async () => {
      // First set an error
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(new Error('Test error'))
        })
      })

      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
        expect(screen.getByTestId('error')).toHaveTextContent('Test error')
      })

      // Clear the error
      act(() => {
        contextRef.clearError()
      })

      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
    })
  })

  describe('Material Management', () => {
    it('should add material to program', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const material = {
        id: 'mat-1',
        title: 'Video Material',
        type: 'video' as const,
        url: 'https://example.com/video.mp4',
        description: 'Educational video'
      }

      const result = await act(async () => {
        return await contextRef.addMaterialToProgram('prog-1', 'part-1', material)
      })

      expect(result).toBe(true)
    })

    it('should remove material from program', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const result = await act(async () => {
        return await contextRef.removeMaterialFromProgram('prog-1', 'part-1', 'mat-1')
      })

      expect(result).toBe(true)
    })
  })
})