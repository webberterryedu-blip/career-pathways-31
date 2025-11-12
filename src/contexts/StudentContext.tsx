// @ts-nocheck
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { 
  EstudanteRow, 
  EstudanteInsert, 
  EstudanteUpdate,
  EstudanteWithProgress,
  StudentQualifications,
  StudentProgress,
  ProgressLevel,
  EstudanteFormData,
  EstudanteFilters
} from '@/types/estudantes';

interface Student {
  id: string;
  nome: string;
  genero: 'masculino' | 'feminino';
  cargo: string;
  ativo: boolean;
  menor: boolean;
  familiaId: string;
  qualificacoes: StudentQualifications;
  ultimaDesignacao?: string;
  contadorDesignacoes: number;
  dataNascimento?: string;
  responsavelPrimario?: string;
  responsavelSecundario?: string;
  createdAt: string;
  updatedAt: string;
}

interface FamilyRelationship {
  id: string;
  studentId: string;
  relatedStudentId: string;
  relationshipType: 'pai' | 'mae' | 'filho' | 'filha' | 'conjuge' | 'irmao' | 'irma';
  createdAt: string;
}

interface StudentAvailability {
  studentId: string;
  weekDate: string;
  available: boolean;
  reason?: string;
  updatedAt: string;
}

interface StudentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface StudentContextType {
  // State
  students: Student[];
  loading: boolean;
  error: string | null;
  
  // Student CRUD operations
  createStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Student | null>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<Student | null>;
  deleteStudent: (id: string) => Promise<boolean>;
  getStudent: (id: string) => Student | null;
  
  // Student queries
  getStudentsByFamily: (familyId: string) => Student[];
  getActiveStudents: () => Student[];
  getQualifiedStudents: (qualification: keyof StudentQualifications) => Student[];
  searchStudents: (filters: EstudanteFilters) => Student[];
  
  // Qualification management
  updateStudentQualifications: (studentId: string, qualifications: Partial<StudentQualifications>) => Promise<boolean>;
  validateStudentQualifications: (student: Student) => StudentValidationResult;
  
  // Family relationship management
  familyRelationships: FamilyRelationship[];
  createFamilyRelationship: (relationship: Omit<FamilyRelationship, 'id' | 'createdAt'>) => Promise<FamilyRelationship | null>;
  deleteFamilyRelationship: (id: string) => Promise<boolean>;
  getFamilyMembers: (studentId: string) => Student[];
  validateFamilyRelationship: (studentId: string, relatedStudentId: string, type: string) => boolean;
  
  // Availability management
  studentAvailability: StudentAvailability[];
  setStudentAvailability: (studentId: string, weekDate: string, available: boolean, reason?: string) => Promise<boolean>;
  getStudentAvailability: (studentId: string, weekDate: string) => StudentAvailability | null;
  getAvailableStudents: (weekDate: string) => Student[];
  
  // Assignment history
  getStudentAssignmentHistory: (studentId: string, weeks?: number) => Promise<any[]>;
  getStudentAssignmentCount: (studentId: string, weeks?: number) => Promise<number>;
  
  // Statistics and analytics
  getStudentStats: () => {
    total: number;
    active: number;
    byGender: Record<string, number>;
    byCargo: Record<string, number>;
    byQualifications: Record<string, number>;
  };
  
  // Bulk operations
  importStudents: (students: EstudanteFormData[]) => Promise<{ success: Student[]; errors: string[] }>;
  exportStudents: () => Promise<Blob>;
  
  // Utility functions
  refreshStudents: () => Promise<void>;
  clearError: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [familyRelationships, setFamilyRelationships] = useState<FamilyRelationship[]>([]);
  const [studentAvailability, setStudentAvailabilityState] = useState<StudentAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert database row to Student interface
  const mapEstudanteToStudent = (estudante: EstudanteRow): Student => ({
    id: estudante.id,
    nome: estudante.nome,
    genero: (estudante.genero as 'masculino' | 'feminino') || 'masculino',
    cargo: estudante.cargo || 'publicador_nao_batizado',
    ativo: estudante.ativo || false,
    menor: estudante.menor || false,
    familiaId: estudante.familia_id || '',
    qualificacoes: {
      bible_reading: true, // Default qualifications - would be parsed from estudante.qualificacoes
      initial_call: true,
      return_visit: true,
      bible_study: estudante.genero === 'masculino',
      talk: estudante.genero === 'masculino' && ['anciao', 'servo_ministerial', 'publicador_batizado'].includes(estudante.cargo || ''),
      demonstration: true,
      can_be_helper: true,
      can_teach_others: ['anciao', 'servo_ministerial'].includes(estudante.cargo || '')
    },
    ultimaDesignacao: estudante.ultima_designacao || undefined,
    contadorDesignacoes: estudante.contador_designacoes || 0,
    dataNascimento: estudante.data_nascimento || undefined,
    responsavelPrimario: estudante.responsavel_primario || undefined,
    responsavelSecundario: estudante.responsavel_secundario || undefined,
    createdAt: estudante.created_at,
    updatedAt: estudante.updated_at
  });

  // Convert Student to database insert
  const mapStudentToInsert = (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): EstudanteInsert => ({
    nome: student.nome,
    genero: student.genero,
    cargo: student.cargo,
    ativo: student.ativo,
    menor: student.menor,
    familia_id: student.familiaId,
    ultima_designacao: student.ultimaDesignacao,
    contador_designacoes: student.contadorDesignacoes,
    data_nascimento: student.dataNascimento,
    responsavel_primario: student.responsavelPrimario,
    responsavel_secundario: student.responsavelSecundario,
    qualificacoes: student.qualificacoes as any, // Serialize as JSON
    user_id: user?.id
  });

  // Load students from database
  const loadStudents = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('estudantes')
        .select('*')
        .order('nome', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const mappedStudents = (data || []).map(mapEstudanteToStudent);
      setStudents(mappedStudents);
    } catch (err) {
      console.error('Error loading students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create new student
  const createStudent = useCallback(async (
    student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Student | null> => {
    try {
      setError(null);
      
      const insertData = mapStudentToInsert(student);
      
      const { data, error: insertError } = await supabase
        .from('estudantes')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const newStudent = mapEstudanteToStudent(data);
      setStudents(prev => [...prev, newStudent]);
      
      return newStudent;
    } catch (err) {
      console.error('Error creating student:', err);
      setError(err instanceof Error ? err.message : 'Failed to create student');
      return null;
    }
  }, [user]);

  // Update student
  const updateStudent = useCallback(async (
    id: string, 
    updates: Partial<Student>
  ): Promise<Student | null> => {
    try {
      setError(null);
      
      const updateData: EstudanteUpdate = {};
      
      if (updates.nome) updateData.nome = updates.nome;
      if (updates.genero) updateData.genero = updates.genero;
      if (updates.cargo) updateData.cargo = updates.cargo;
      if (updates.ativo !== undefined) updateData.ativo = updates.ativo;
      if (updates.menor !== undefined) updateData.menor = updates.menor;
      if (updates.familiaId) updateData.familia_id = updates.familiaId;
      if (updates.ultimaDesignacao !== undefined) updateData.ultima_designacao = updates.ultimaDesignacao;
      if (updates.contadorDesignacoes !== undefined) updateData.contador_designacoes = updates.contadorDesignacoes;
      if (updates.dataNascimento !== undefined) updateData.data_nascimento = updates.dataNascimento;
      if (updates.responsavelPrimario !== undefined) updateData.responsavel_primario = updates.responsavelPrimario;
      if (updates.responsavelSecundario !== undefined) updateData.responsavel_secundario = updates.responsavelSecundario;
      if (updates.qualificacoes) updateData.qualificacoes = updates.qualificacoes as any;

      const { data, error: updateError } = await supabase
        .from('estudantes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedStudent = mapEstudanteToStudent(data);
      setStudents(prev => prev.map(s => s.id === id ? updatedStudent : s));
      
      return updatedStudent;
    } catch (err) {
      console.error('Error updating student:', err);
      setError(err instanceof Error ? err.message : 'Failed to update student');
      return null;
    }
  }, []);

  // Delete student
  const deleteStudent = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('estudantes')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setStudents(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting student:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete student');
      return false;
    }
  }, []);

  // Get student by ID
  const getStudent = useCallback((id: string): Student | null => {
    return students.find(s => s.id === id) || null;
  }, [students]);

  // Query students by family
  const getStudentsByFamily = useCallback((familyId: string): Student[] => {
    return students.filter(s => s.familiaId === familyId);
  }, [students]);

  // Get active students
  const getActiveStudents = useCallback((): Student[] => {
    return students.filter(s => s.ativo);
  }, [students]);

  // Get qualified students
  const getQualifiedStudents = useCallback((qualification: keyof StudentQualifications): Student[] => {
    return students.filter(s => s.ativo && s.qualificacoes[qualification]);
  }, [students]);

  // Search students with filters
  const searchStudents = useCallback((filters: EstudanteFilters): Student[] => {
    return students.filter(student => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        if (!student.nome.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Cargo filter
      if (filters.cargo && filters.cargo !== 'todos') {
        if (student.cargo !== filters.cargo) {
          return false;
        }
      }

      // Gender filter
      if (filters.genero && filters.genero !== 'todos') {
        if (student.genero !== filters.genero) {
          return false;
        }
      }

      // Active filter
      if (filters.ativo !== undefined && filters.ativo !== 'todos') {
        if (student.ativo !== filters.ativo) {
          return false;
        }
      }

      return true;
    });
  }, [students]);

  // Update student qualifications
  const updateStudentQualifications = useCallback(async (
    studentId: string, 
    qualifications: Partial<StudentQualifications>
  ): Promise<boolean> => {
    const student = getStudent(studentId);
    if (!student) return false;

    const updatedQualifications = { ...student.qualificacoes, ...qualifications };
    const result = await updateStudent(studentId, { qualificacoes: updatedQualifications });
    return result !== null;
  }, [getStudent, updateStudent]);

  // Validate student qualifications
  const validateStudentQualifications = useCallback((student: Student): StudentValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Gender-based validation
    if (student.genero === 'feminino') {
      if (student.qualificacoes.talk) {
        errors.push('Women cannot give talks according to S-38 guidelines');
      }
      if (student.qualificacoes.bible_study && student.cargo !== 'anciao') {
        warnings.push('Women typically do not conduct Bible studies unless in special circumstances');
      }
    }

    // Age-based validation
    if (student.menor) {
      if (student.qualificacoes.can_teach_others) {
        warnings.push('Minors typically should not teach others without supervision');
      }
    }

    // Cargo-based validation
    if (!['anciao', 'servo_ministerial', 'publicador_batizado'].includes(student.cargo)) {
      if (student.qualificacoes.talk) {
        errors.push('Only qualified brothers can give talks');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  // Create family relationship
  const createFamilyRelationship = useCallback(async (
    relationship: Omit<FamilyRelationship, 'id' | 'createdAt'>
  ): Promise<FamilyRelationship | null> => {
    // This would be implemented with a family_relationships table
    // For now, return a mock relationship
    const newRelationship: FamilyRelationship = {
      id: Date.now().toString(),
      ...relationship,
      createdAt: new Date().toISOString()
    };
    
    setFamilyRelationships(prev => [...prev, newRelationship]);
    return newRelationship;
  }, []);

  // Delete family relationship
  const deleteFamilyRelationship = useCallback(async (id: string): Promise<boolean> => {
    setFamilyRelationships(prev => prev.filter(r => r.id !== id));
    return true;
  }, []);

  // Get family members
  const getFamilyMembers = useCallback((studentId: string): Student[] => {
    const relationships = familyRelationships.filter(r => 
      r.studentId === studentId || r.relatedStudentId === studentId
    );
    
    const memberIds = relationships.map(r => 
      r.studentId === studentId ? r.relatedStudentId : r.studentId
    );
    
    return students.filter(s => memberIds.includes(s.id));
  }, [students, familyRelationships]);

  // Validate family relationship
  const validateFamilyRelationship = useCallback((
    studentId: string, 
    relatedStudentId: string, 
    type: string
  ): boolean => {
    // Basic validation - no self-relationships
    if (studentId === relatedStudentId) return false;
    
    // Check if relationship already exists
    const existingRelationship = familyRelationships.find(r =>
      (r.studentId === studentId && r.relatedStudentId === relatedStudentId) ||
      (r.studentId === relatedStudentId && r.relatedStudentId === studentId)
    );
    
    return !existingRelationship;
  }, [familyRelationships]);

  // Set student availability
  const setStudentAvailability = useCallback(async (
    studentId: string, 
    weekDate: string, 
    available: boolean, 
    reason?: string
  ): Promise<boolean> => {
    const availability: StudentAvailability = {
      studentId,
      weekDate,
      available,
      reason,
      updatedAt: new Date().toISOString()
    };
    
    setStudentAvailabilityState(prev => {
      const filtered = prev.filter(a => !(a.studentId === studentId && a.weekDate === weekDate));
      return [...filtered, availability];
    });
    
    return true;
  }, []);

  // Get student availability
  const getStudentAvailability = useCallback((
    studentId: string, 
    weekDate: string
  ): StudentAvailability | null => {
    return studentAvailability.find(a => 
      a.studentId === studentId && a.weekDate === weekDate
    ) || null;
  }, [studentAvailability]);

  // Get available students for a week
  const getAvailableStudents = useCallback((weekDate: string): Student[] => {
    const unavailableIds = studentAvailability
      .filter(a => a.weekDate === weekDate && !a.available)
      .map(a => a.studentId);
    
    return students.filter(s => s.ativo && !unavailableIds.includes(s.id));
  }, [students, studentAvailability]);

  // Get student assignment history (placeholder)
  const getStudentAssignmentHistory = useCallback(async (
    studentId: string, 
    weeks: number = 8
  ): Promise<any[]> => {
    // This would query the assignments table
    return [];
  }, []);

  // Get student assignment count (placeholder)
  const getStudentAssignmentCount = useCallback(async (
    studentId: string, 
    weeks: number = 8
  ): Promise<number> => {
    // This would count assignments from the assignments table
    return 0;
  }, []);

  // Get student statistics
  const getStudentStats = useCallback(() => {
    const active = students.filter(s => s.ativo);
    
    return {
      total: students.length,
      active: active.length,
      byGender: students.reduce((acc, s) => {
        acc[s.genero] = (acc[s.genero] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCargo: students.reduce((acc, s) => {
        acc[s.cargo] = (acc[s.cargo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byQualifications: {
        bible_reading: students.filter(s => s.qualificacoes.bible_reading).length,
        talk: students.filter(s => s.qualificacoes.talk).length,
        demonstration: students.filter(s => s.qualificacoes.demonstration).length
      }
    };
  }, [students]);

  // Import students (placeholder)
  const importStudents = useCallback(async (
    studentsData: EstudanteFormData[]
  ): Promise<{ success: Student[]; errors: string[] }> => {
    const success: Student[] = [];
    const errors: string[] = [];
    
    // This would process the import data and create students
    console.log('Importing students:', studentsData);
    
    return { success, errors };
  }, []);

  // Export students (placeholder)
  const exportStudents = useCallback(async (): Promise<Blob> => {
    const csvContent = students.map(s => 
      `${s.nome},${s.genero},${s.cargo},${s.ativo ? 'Ativo' : 'Inativo'}`
    ).join('\n');
    
    return new Blob([csvContent], { type: 'text/csv' });
  }, [students]);

  // Refresh students
  const refreshStudents = useCallback(async () => {
    await loadStudents();
  }, [loadStudents]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load students on mount and when user changes
  useEffect(() => {
    if (user) {
      loadStudents();
    } else {
      setStudents([]);
    }
  }, [user, loadStudents]);

  const contextValue: StudentContextType = {
    // State
    students,
    loading,
    error,
    
    // CRUD operations
    createStudent,
    updateStudent,
    deleteStudent,
    getStudent,
    
    // Queries
    getStudentsByFamily,
    getActiveStudents,
    getQualifiedStudents,
    searchStudents,
    
    // Qualifications
    updateStudentQualifications,
    validateStudentQualifications,
    
    // Family relationships
    familyRelationships,
    createFamilyRelationship,
    deleteFamilyRelationship,
    getFamilyMembers,
    validateFamilyRelationship,
    
    // Availability
    studentAvailability,
    setStudentAvailability,
    getStudentAvailability,
    getAvailableStudents,
    
    // Assignment history
    getStudentAssignmentHistory,
    getStudentAssignmentCount,
    
    // Statistics
    getStudentStats,
    
    // Bulk operations
    importStudents,
    exportStudents,
    
    // Utilities
    refreshStudents,
    clearError
  };

  return (
    <StudentContext.Provider value={contextValue}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudentContext() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudentContext must be used within a StudentProvider');
  }
  return context;
}

// Convenience hook for student operations
export function useStudents() {
  return useStudentContext();
}