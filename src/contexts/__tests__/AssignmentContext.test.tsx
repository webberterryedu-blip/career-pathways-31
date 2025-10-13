import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import React from 'react'
import { AssignmentProvider, useAssignmentContext } from '../AssignmentContext'
import { useAuth } from '../AuthContext'
import { supabase } from '@/integrations/supabase/client'

// Mock dependencies
vi.mock('../AuthContext', () => ({
  useAuth: vi.fn()
}))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn()
    },
    channel: vi.fn()
  }
}))

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>
const mockSupabase = supabase as any

// Test component to access context
const TestComponent = ({ onContextReady }: { onContextReady?: (context: any) => void }) => {
  const context = useAssignmentContext()
  
  React.useEffect(() => {
    if (onContextReady) {
      onContextReady(context)
    }
  }, [context, onContextReady])
  
  return (
    <div>
      <div data-testid="assignments-count">{context.assignments.length}</div>
      <div data-testid="loading">{context.loading.toString()}</div>
      <div data-testid="error">{context.error || 'no-error'}</div>
    </div>
  )
}

const renderWithProvider = (children: React.ReactNode) => {
  return render(
    <AssignmentProvider>
      {children}
    </AssignmentProvider>
  )
}

describe('AssignmentContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default auth mock
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id' }
    })
    
    // Default Supabase mocks
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          then: vi.fn().mockResolvedValue({ data: [], error: null })
        })
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
        })
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    })
    
    mockSupabase.channel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn()
      })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Provider Initialization', () => {
    it('should provide context to children', () => {
      renderWithProvider(<TestComponent />)
      
      expect(screen.getByTestId('assignments-count')).toBeInTheDocument()
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.getByTestId('error')).toBeInTheDocument()
    })

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAssignmentContext must be used within an AssignmentProvider')
      
      consoleSpy.mockRestore()
    })

    it('should initialize with empty state', async () => {
      renderWithProvider(<TestComponent />)
      
      expect(screen.getByTestId('assignments-count')).toHaveTextContent('0')
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })
      
      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
    })
  })

  describe('Assignment State Management', () => {
    it('should load assignments when user is authenticated', async () => {
      const mockAssignments = [
        {
          id: '1',
          programa_id: 'prog-1',
          estudante_id: 'student-1',
          titulo_parte: 'Bible Reading',
          data_designacao: '2024-01-01',
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockAssignments, 
            error: null 
          })
        })
      })

      renderWithProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('assignments-count')).toHaveTextContent('1')
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

    it('should clear assignments when user logs out', async () => {
      // First render with user
      const { rerender } = renderWithProvider(<TestComponent />)
      
      await waitFor(() => {
        expect(screen.getByTestId('assignments-count')).toHaveTextContent('0')
      })

      // Then simulate logout
      mockUseAuth.mockReturnValue({ user: null })
      
      rerender(
        <AssignmentProvider>
          <TestComponent />
        </AssignmentProvider>
      )

      expect(screen.getByTestId('assignments-count')).toHaveTextContent('0')
    })
  })

  describe('Assignment CRUD Operations', () => {
    it('should create new assignment', async () => {
      const mockNewAssignment = {
        id: '2',
        programa_id: 'prog-1',
        estudante_id: 'student-1',
        titulo_parte: 'Initial Call',
        data_designacao: '2024-01-08',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: mockNewAssignment, 
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

      const newAssignment = {
        programId: 'prog-1',
        studentId: 'student-1',
        partType: 'Initial Call',
        partNumber: 1,
        weekDate: '2024-01-08',
        status: 'pending' as const
      }

      const result = await act(async () => {
        return await contextRef.createAssignment(newAssignment)
      })

      expect(result).toBeTruthy()
      expect(result?.id).toBe('2')
      
      await waitFor(() => {
        expect(screen.getByTestId('assignments-count')).toHaveTextContent('1')
      })
    })

    it('should update existing assignment', async () => {
      const mockUpdatedAssignment = {
        id: '1',
        programa_id: 'prog-1',
        estudante_id: 'student-1',
        titulo_parte: 'Bible Reading',
        data_designacao: '2024-01-01',
        status: 'confirmed',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // Mock initial load with one assignment
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: [{ ...mockUpdatedAssignment, status: 'pending' }], 
            error: null 
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: mockUpdatedAssignment, 
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
        expect(screen.getByTestId('assignments-count')).toHaveTextContent('1')
      })

      const result = await act(async () => {
        return await contextRef.updateAssignment('1', { status: 'confirmed' })
      })

      expect(result).toBeTruthy()
      expect(result?.status).toBe('confirmed')
    })

    it('should delete assignment', async () => {
      const mockAssignment = {
        id: '1',
        programa_id: 'prog-1',
        estudante_id: 'student-1',
        titulo_parte: 'Bible Reading',
        data_designacao: '2024-01-01',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // Mock initial load with one assignment
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: [mockAssignment], 
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
        expect(screen.getByTestId('assignments-count')).toHaveTextContent('1')
      })

      const result = await act(async () => {
        return await contextRef.deleteAssignment('1')
      })

      expect(result).toBe(true)
      
      await waitFor(() => {
        expect(screen.getByTestId('assignments-count')).toHaveTextContent('0')
      })
    })
  })

  describe('Assignment Validation', () => {
    it('should validate assignments correctly', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const validAssignment = {
        id: '1',
        programId: 'prog-1',
        studentId: 'student-1',
        partType: 'Bible Reading',
        partNumber: 1,
        weekDate: '2024-01-01',
        status: 'pending' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      const result = contextRef.validateAssignments([validAssignment])

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

      const invalidAssignment = {
        id: '1',
        programId: '',
        studentId: '',
        partType: '',
        partNumber: 1,
        weekDate: '',
        status: 'pending' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      const result = contextRef.validateAssignments([invalidAssignment])

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.field === 'studentId')).toBe(true)
      expect(result.errors.some(e => e.field === 'partType')).toBe(true)
      expect(result.errors.some(e => e.field === 'weekDate')).toBe(true)
    })
  })

  describe('Real-time Updates', () => {
    it('should set up real-time subscription', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const mockCallback = vi.fn()
      const unsubscribe = contextRef.subscribeToAssignments(mockCallback)

      expect(mockSupabase.channel).toHaveBeenCalledWith('assignments')
      expect(typeof unsubscribe).toBe('function')

      // Test unsubscribe
      unsubscribe()
    })

    it('should handle real-time updates', async () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn()
        })
      }

      mockSupabase.channel.mockReturnValue(mockChannel)

      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const mockCallback = vi.fn()
      contextRef.subscribeToAssignments(mockCallback)

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'designacoes' },
        expect.any(Function)
      )
    })
  })

  describe('Assignment Generation', () => {
    it('should generate assignments using edge function', async () => {
      const mockGenerationResult = {
        success: true,
        assignments: [],
        conflicts: []
      }

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockGenerationResult,
        error: null
      })

      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      }, { timeout: 10000 })

      const options = {
        programa_id: 'prog-1',
        data_inicio: '2024-01-01',
        data_fim: '2024-01-31'
      }

      const result = await act(async () => {
        return await contextRef.generateAssignments(options)
      })

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('generate-assignments', {
        body: options
      })
      expect(result).toEqual(mockGenerationResult)
    }, 10000)

    it('should handle generation errors', async () => {
      const mockError = new Error('Generation failed')
      
      mockSupabase.functions.invoke.mockRejectedValue(mockError)

      let contextRef: any
      const { rerender } = renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const options = {
        programa_id: 'prog-1',
        data_inicio: '2024-01-01',
        data_fim: '2024-01-31'
      }

      const result = await act(async () => {
        return await contextRef.generateAssignments(options)
      })

      expect(result).toBeNull()
      
      // Force re-render to update error state
      rerender(
        <AssignmentProvider>
          <TestComponent onContextReady={(context) => { contextRef = context }} />
        </AssignmentProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Generation failed')
      })
    })
  })

  describe('Conflict Detection', () => {
    it('should detect assignment conflicts', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      // Create assignments with conflicts (same student, same week)
      const conflictingAssignments = [
        {
          id: '1',
          programId: 'prog-1',
          studentId: 'student-1',
          partType: 'Bible Reading',
          partNumber: 1,
          weekDate: '2024-01-01',
          status: 'pending' as const,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          programId: 'prog-1',
          studentId: 'student-1',
          partType: 'Initial Call',
          partNumber: 2,
          weekDate: '2024-01-01',
          status: 'pending' as const,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]

      const conflicts = contextRef.detectConflicts(conflictingAssignments)

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].tipo).toBe('sobrecarga')
      expect(conflicts[0].estudante_id).toBe('student-1')
    })

    it('should not detect conflicts for different students or weeks', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const nonConflictingAssignments = [
        {
          id: '1',
          programId: 'prog-1',
          studentId: 'student-1',
          partType: 'Bible Reading',
          partNumber: 1,
          weekDate: '2024-01-01',
          status: 'pending' as const,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          programId: 'prog-1',
          studentId: 'student-2',
          partType: 'Initial Call',
          partNumber: 2,
          weekDate: '2024-01-01',
          status: 'pending' as const,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]

      const conflicts = contextRef.detectConflicts(nonConflictingAssignments)

      expect(conflicts).toHaveLength(0)
    })
  })

  describe('Utility Functions', () => {
    it('should refresh assignments', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      await act(async () => {
        await contextRef.refreshAssignments()
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
})