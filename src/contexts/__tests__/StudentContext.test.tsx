import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { StudentProvider, useStudentContext } from '../StudentContext'
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

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>
const mockSupabase = supabase as any

// Test component to access context
const TestComponent = ({ onContextReady }: { onContextReady?: (context: any) => void }) => {
  const context = useStudentContext()
  
  if (onContextReady) {
    onContextReady(context)
  }
  
  return (
    <div>
      <div data-testid="students-count">{context.students.length}</div>
      <div data-testid="loading">{context.loading.toString()}</div>
      <div data-testid="error">{context.error || 'no-error'}</div>
      <div data-testid="family-relationships-count">{context.familyRelationships.length}</div>
      <div data-testid="availability-count">{context.studentAvailability.length}</div>
    </div>
  )
}

const renderWithProvider = (children: React.ReactNode) => {
  return render(
    <StudentProvider>
      {children}
    </StudentProvider>
  )
}

describe('StudentContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
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
        })
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
      
      expect(screen.getByTestId('students-count')).toBeInTheDocument()
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.getByTestId('error')).toBeInTheDocument()
      expect(screen.getByTestId('family-relationships-count')).toBeInTheDocument()
      expect(screen.getByTestId('availability-count')).toBeInTheDocument()
    })

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useStudentContext must be used within a StudentProvider')
      
      consoleSpy.mockRestore()
    })

    it('should initialize with empty state', async () => {
      renderWithProvider(<TestComponent />)
      
      expect(screen.getByTestId('students-count')).toHaveTextContent('0')
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })
      
      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
      expect(screen.getByTestId('family-relationships-count')).toHaveTextContent('0')
      expect(screen.getByTestId('availability-count')).toHaveTextContent('0')
    })
  })

  describe('Student State Management', () => {
    it('should load students when user is authenticated', async () => {
      const mockStudents = [
        {
          id: '1',
          nome: 'João Silva',
          genero: 'masculino',
          cargo: 'publicador_batizado',
          ativo: true,
          menor: false,
          familia_id: 'fam-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockStudents, 
            error: null 
          })
        })
      })

      renderWithProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('students-count')).toHaveTextContent('1')
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

    it('should clear students when user logs out', async () => {
      // First render with user
      const { rerender } = renderWithProvider(<TestComponent />)
      
      await waitFor(() => {
        expect(screen.getByTestId('students-count')).toHaveTextContent('0')
      })

      // Then simulate logout
      mockUseAuth.mockReturnValue({ user: null })
      
      rerender(
        <StudentProvider>
          <TestComponent />
        </StudentProvider>
      )

      expect(screen.getByTestId('students-count')).toHaveTextContent('0')
    })
  })

  describe('Student CRUD Operations', () => {
    it('should create new student', async () => {
      const mockNewStudent = {
        id: '2',
        nome: 'Maria Santos',
        genero: 'feminino',
        cargo: 'publicador_nao_batizado',
        ativo: true,
        menor: false,
        familia_id: 'fam-2',
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
              data: mockNewStudent, 
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

      const newStudent = {
        nome: 'Maria Santos',
        genero: 'feminino' as const,
        cargo: 'publicador_nao_batizado',
        ativo: true,
        menor: false,
        familiaId: 'fam-2',
        qualificacoes: {
          bible_reading: true,
          initial_call: true,
          return_visit: true,
          bible_study: false,
          talk: false,
          demonstration: true,
          can_be_helper: true,
          can_teach_others: false
        },
        contadorDesignacoes: 0
      }

      const result = await act(async () => {
        return await contextRef.createStudent(newStudent)
      })

      expect(result).toBeTruthy()
      expect(result?.id).toBe('2')
      
      await waitFor(() => {
        expect(screen.getByTestId('students-count')).toHaveTextContent('1')
      })
    })

    it('should update existing student', async () => {
      const mockUpdatedStudent = {
        id: '1',
        nome: 'João Silva Atualizado',
        genero: 'masculino',
        cargo: 'servo_ministerial',
        ativo: true,
        menor: false,
        familia_id: 'fam-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // Mock initial load with one student
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: [{ ...mockUpdatedStudent, nome: 'João Silva', cargo: 'publicador_batizado' }], 
            error: null 
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: mockUpdatedStudent, 
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
        expect(screen.getByTestId('students-count')).toHaveTextContent('1')
      })

      const result = await act(async () => {
        return await contextRef.updateStudent('1', { 
          nome: 'João Silva Atualizado',
          cargo: 'servo_ministerial'
        })
      })

      expect(result).toBeTruthy()
      expect(result?.nome).toBe('João Silva Atualizado')
      expect(result?.cargo).toBe('servo_ministerial')
    })

    it('should delete student', async () => {
      const mockStudent = {
        id: '1',
        nome: 'João Silva',
        genero: 'masculino',
        cargo: 'publicador_batizado',
        ativo: true,
        menor: false,
        familia_id: 'fam-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // Mock initial load with one student
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: [mockStudent], 
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
        expect(screen.getByTestId('students-count')).toHaveTextContent('1')
      })

      const result = await act(async () => {
        return await contextRef.deleteStudent('1')
      })

      expect(result).toBe(true)
      
      await waitFor(() => {
        expect(screen.getByTestId('students-count')).toHaveTextContent('0')
      })
    })
  })

  describe('Student Qualification Management', () => {
    it('should validate student qualifications correctly', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const validMaleStudent = {
        id: '1',
        nome: 'João Silva',
        genero: 'masculino' as const,
        cargo: 'anciao',
        ativo: true,
        menor: false,
        familiaId: 'fam-1',
        qualificacoes: {
          bible_reading: true,
          initial_call: true,
          return_visit: true,
          bible_study: true,
          talk: true,
          demonstration: true,
          can_be_helper: true,
          can_teach_others: true
        },
        contadorDesignacoes: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      const result = contextRef.validateStudentQualifications(validMaleStudent)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect qualification violations for female students', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const invalidFemaleStudent = {
        id: '2',
        nome: 'Maria Santos',
        genero: 'feminino' as const,
        cargo: 'publicador_batizado',
        ativo: true,
        menor: false,
        familiaId: 'fam-2',
        qualificacoes: {
          bible_reading: true,
          initial_call: true,
          return_visit: true,
          bible_study: true,
          talk: true, // This should cause an error
          demonstration: true,
          can_be_helper: true,
          can_teach_others: false
        },
        contadorDesignacoes: 3,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      const result = contextRef.validateStudentQualifications(invalidFemaleStudent)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('Women cannot give talks'))).toBe(true)
    })

    it('should detect qualification violations for unqualified students', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const unqualifiedStudent = {
        id: '3',
        nome: 'Pedro Jovem',
        genero: 'masculino' as const,
        cargo: 'publicador_nao_batizado',
        ativo: true,
        menor: false,
        familiaId: 'fam-3',
        qualificacoes: {
          bible_reading: true,
          initial_call: true,
          return_visit: true,
          bible_study: false,
          talk: true, // This should cause an error for unbaptized publisher
          demonstration: true,
          can_be_helper: true,
          can_teach_others: false
        },
        contadorDesignacoes: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      const result = contextRef.validateStudentQualifications(unqualifiedStudent)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('Only qualified brothers can give talks'))).toBe(true)
    })

    it('should update student qualifications', async () => {
      const mockStudent = {
        id: '1',
        nome: 'João Silva',
        genero: 'masculino',
        cargo: 'publicador_batizado',
        ativo: true,
        menor: false,
        familia_id: 'fam-1',
        qualificacoes: {
          bible_reading: true,
          initial_call: true,
          return_visit: true,
          bible_study: false,
          talk: false,
          demonstration: true,
          can_be_helper: true,
          can_teach_others: false
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: [mockStudent], 
            error: null 
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: {
                  ...mockStudent,
                  qualificacoes: {
                    ...mockStudent.qualificacoes,
                    talk: true
                  }
                }, 
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
        expect(screen.getByTestId('students-count')).toHaveTextContent('1')
      })

      const result = await act(async () => {
        return await contextRef.updateStudentQualifications('1', { talk: true })
      })

      expect(result).toBe(true)
    })
  })

  describe('Student Queries', () => {
    it('should get students by family', async () => {
      const mockStudents = [
        {
          id: '1',
          nome: 'João Silva',
          genero: 'masculino',
          cargo: 'anciao',
          ativo: true,
          menor: false,
          familia_id: 'fam-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          nome: 'Maria Silva',
          genero: 'feminino',
          cargo: 'publicador_batizado',
          ativo: true,
          menor: false,
          familia_id: 'fam-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          nome: 'Pedro Santos',
          genero: 'masculino',
          cargo: 'publicador_batizado',
          ativo: true,
          menor: false,
          familia_id: 'fam-2',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockStudents, 
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
        expect(screen.getByTestId('students-count')).toHaveTextContent('3')
      })

      const familyMembers = contextRef.getStudentsByFamily('fam-1')
      expect(familyMembers).toHaveLength(2)
      expect(familyMembers.map((s: any) => s.nome)).toEqual(['João Silva', 'Maria Silva'])
    })

    it('should get active students', async () => {
      const mockStudents = [
        {
          id: '1',
          nome: 'João Ativo',
          genero: 'masculino',
          cargo: 'publicador_batizado',
          ativo: true,
          menor: false,
          familia_id: 'fam-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          nome: 'Maria Inativa',
          genero: 'feminino',
          cargo: 'publicador_batizado',
          ativo: false,
          menor: false,
          familia_id: 'fam-2',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockStudents, 
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
        expect(screen.getByTestId('students-count')).toHaveTextContent('2')
      })

      const activeStudents = contextRef.getActiveStudents()
      expect(activeStudents).toHaveLength(1)
      expect(activeStudents[0].nome).toBe('João Ativo')
    })

    it('should get qualified students', async () => {
      const mockStudents = [
        {
          id: '1',
          nome: 'João Qualificado',
          genero: 'masculino',
          cargo: 'anciao',
          ativo: true,
          menor: false,
          familia_id: 'fam-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          nome: 'Pedro Não Qualificado',
          genero: 'masculino',
          cargo: 'publicador_nao_batizado',
          ativo: true,
          menor: false,
          familia_id: 'fam-2',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockStudents, 
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
        expect(screen.getByTestId('students-count')).toHaveTextContent('2')
      })

      const qualifiedForTalks = contextRef.getQualifiedStudents('talk')
      expect(qualifiedForTalks).toHaveLength(1)
      expect(qualifiedForTalks[0].nome).toBe('João Qualificado')
    })

    it('should search students with filters', async () => {
      const mockStudents = [
        {
          id: '1',
          nome: 'João Silva',
          genero: 'masculino',
          cargo: 'anciao',
          ativo: true,
          menor: false,
          familia_id: 'fam-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          nome: 'Maria Santos',
          genero: 'feminino',
          cargo: 'publicador_batizado',
          ativo: true,
          menor: false,
          familia_id: 'fam-2',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockStudents, 
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
        expect(screen.getByTestId('students-count')).toHaveTextContent('2')
      })

      // Search by name
      const searchResults = contextRef.searchStudents({ searchTerm: 'João' })
      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].nome).toBe('João Silva')

      // Filter by gender
      const femaleStudents = contextRef.searchStudents({ genero: 'feminino' })
      expect(femaleStudents).toHaveLength(1)
      expect(femaleStudents[0].nome).toBe('Maria Santos')

      // Filter by cargo
      const elders = contextRef.searchStudents({ cargo: 'anciao' })
      expect(elders).toHaveLength(1)
      expect(elders[0].nome).toBe('João Silva')
    })
  })

  describe('Family Relationship Management', () => {
    it('should create family relationship', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const relationship = {
        studentId: 'student-1',
        relatedStudentId: 'student-2',
        relationshipType: 'conjuge' as const
      }

      const result = await act(async () => {
        return await contextRef.createFamilyRelationship(relationship)
      })

      expect(result).toBeTruthy()
      expect(result?.relationshipType).toBe('conjuge')
      
      await waitFor(() => {
        expect(screen.getByTestId('family-relationships-count')).toHaveTextContent('1')
      })
    })

    it('should validate family relationships', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      // Valid relationship
      const isValid = contextRef.validateFamilyRelationship('student-1', 'student-2', 'conjuge')
      expect(isValid).toBe(true)

      // Invalid self-relationship
      const isSelfValid = contextRef.validateFamilyRelationship('student-1', 'student-1', 'conjuge')
      expect(isSelfValid).toBe(false)
    })

    it('should get family members', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      // First create a relationship
      await act(async () => {
        await contextRef.createFamilyRelationship({
          studentId: 'student-1',
          relatedStudentId: 'student-2',
          relationshipType: 'conjuge'
        })
      })

      // Mock students data
      const mockStudents = [
        {
          id: 'student-1',
          nome: 'João Silva',
          genero: 'masculino',
          cargo: 'anciao',
          ativo: true,
          menor: false,
          familia_id: 'fam-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'student-2',
          nome: 'Maria Silva',
          genero: 'feminino',
          cargo: 'publicador_batizado',
          ativo: true,
          menor: false,
          familia_id: 'fam-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockStudents, 
            error: null 
          })
        })
      })

      // Trigger students load
      await act(async () => {
        await contextRef.refreshStudents()
      })

      await waitFor(() => {
        expect(screen.getByTestId('students-count')).toHaveTextContent('2')
      })

      const familyMembers = contextRef.getFamilyMembers('student-1')
      expect(familyMembers).toHaveLength(1)
      expect(familyMembers[0].id).toBe('student-2')
    })
  })

  describe('Student Availability Management', () => {
    it('should set student availability', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      const result = await act(async () => {
        return await contextRef.setStudentAvailability('student-1', '2024-01-01', false, 'Viagem')
      })

      expect(result).toBe(true)
      
      await waitFor(() => {
        expect(screen.getByTestId('availability-count')).toHaveTextContent('1')
      })
    })

    it('should get student availability', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      // First set availability
      await act(async () => {
        await contextRef.setStudentAvailability('student-1', '2024-01-01', false, 'Viagem')
      })

      const availability = contextRef.getStudentAvailability('student-1', '2024-01-01')
      expect(availability).toBeTruthy()
      expect(availability?.available).toBe(false)
      expect(availability?.reason).toBe('Viagem')
    })

    it('should get available students for a week', async () => {
      const mockStudents = [
        {
          id: 'student-1',
          nome: 'João Silva',
          genero: 'masculino',
          cargo: 'anciao',
          ativo: true,
          menor: false,
          familia_id: 'fam-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'student-2',
          nome: 'Maria Silva',
          genero: 'feminino',
          cargo: 'publicador_batizado',
          ativo: true,
          menor: false,
          familia_id: 'fam-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockStudents, 
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
        expect(screen.getByTestId('students-count')).toHaveTextContent('2')
      })

      // Set one student as unavailable
      await act(async () => {
        await contextRef.setStudentAvailability('student-1', '2024-01-01', false, 'Viagem')
      })

      const availableStudents = contextRef.getAvailableStudents('2024-01-01')
      expect(availableStudents).toHaveLength(1)
      expect(availableStudents[0].id).toBe('student-2')
    })
  })

  describe('Student Statistics', () => {
    it('should calculate student statistics', async () => {
      const mockStudents = [
        {
          id: '1',
          nome: 'João Silva',
          genero: 'masculino',
          cargo: 'anciao',
          ativo: true,
          menor: false,
          familia_id: 'fam-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          nome: 'Maria Silva',
          genero: 'feminino',
          cargo: 'publicador_batizado',
          ativo: true,
          menor: false,
          familia_id: 'fam-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          nome: 'Pedro Santos',
          genero: 'masculino',
          cargo: 'publicador_batizado',
          ativo: false,
          menor: false,
          familia_id: 'fam-2',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockStudents, 
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
        expect(screen.getByTestId('students-count')).toHaveTextContent('3')
      })

      const stats = contextRef.getStudentStats()
      
      expect(stats.total).toBe(3)
      expect(stats.active).toBe(2)
      expect(stats.byGender.masculino).toBe(2)
      expect(stats.byGender.feminino).toBe(1)
      expect(stats.byCargo.anciao).toBe(1)
      expect(stats.byCargo.publicador_batizado).toBe(2)
    })
  })

  describe('Utility Functions', () => {
    it('should refresh students', async () => {
      let contextRef: any
      renderWithProvider(
        <TestComponent onContextReady={(context) => { contextRef = context }} />
      )

      await waitFor(() => {
        expect(contextRef).toBeDefined()
      })

      await act(async () => {
        await contextRef.refreshStudents()
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