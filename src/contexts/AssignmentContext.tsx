// @ts-nocheck
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { 
  DesignacaoRow, 
  DesignacaoInsert, 
  DesignacaoUpdate,
  DesignacaoComEstudantes,
  ResultadoGeracao,
  OpcoesDegeracao,
  ValidacaoS38T,
  ConflitosDesignacao,
  HistoricoDesignacao
} from '@/types/designacoes';

interface Assignment {
  id: string;
  programId: string;
  studentId: string;
  assistantId?: string;
  partType: string;
  partNumber: number;
  weekDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  studyPoint?: string;
  counselNotes?: string;
  timing?: number;
  createdAt: string;
  updatedAt: string;
}

interface AssignmentValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

interface OptimisticUpdate {
  id: string;
  type: 'create' | 'update' | 'delete';
  assignment?: Assignment;
  originalAssignment?: Assignment;
  timestamp: number;
}

interface AssignmentContextType {
  // State
  assignments: Assignment[];
  loading: boolean;
  error: string | null;
  isRealTimeConnected: boolean;
  optimisticUpdates: OptimisticUpdate[];
  
  // Assignment CRUD operations with optimistic updates
  createAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Assignment | null>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<Assignment | null>;
  deleteAssignment: (id: string) => Promise<boolean>;
  getAssignment: (id: string) => Assignment | null;
  
  // Assignment queries
  getAssignmentsByWeek: (weekDate: string) => Assignment[];
  getAssignmentsByStudent: (studentId: string) => Assignment[];
  getAssignmentsByProgram: (programId: string) => Assignment[];
  
  // Assignment generation
  generateAssignments: (options: OpcoesDegeracao) => Promise<ResultadoGeracao | null>;
  validateAssignments: (assignments: Assignment[]) => AssignmentValidationResult;
  
  // Real-time subscriptions and conflict resolution
  subscribeToAssignments: (callback: (assignments: Assignment[]) => void) => () => void;
  resolveConflict: (optimisticId: string, resolution: 'accept' | 'reject') => Promise<void>;
  
  // Assignment status management
  confirmAssignment: (id: string) => Promise<boolean>;
  completeAssignment: (id: string, counselNotes?: string, timing?: number) => Promise<boolean>;
  cancelAssignment: (id: string, reason?: string) => Promise<boolean>;
  
  // Conflict detection
  detectConflicts: (assignments: Assignment[]) => ConflitosDesignacao[];
  
  // Statistics and analytics
  getAssignmentStats: (startDate: string, endDate: string) => Promise<any>;
  getStudentHistory: (studentId: string) => Promise<HistoricoDesignacao | null>;
  
  // Utility functions
  refreshAssignments: () => Promise<void>;
  clearError: () => void;
  retryFailedUpdates: () => Promise<void>;
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

export function AssignmentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdate[]>([]);
  
  // Refs for managing subscriptions and preventing memory leaks
  const subscriptionRef = useRef<any>(null);
  const callbacksRef = useRef<Set<(assignments: Assignment[]) => void>>(new Set());

  // Generate optimistic ID for temporary assignments
  const generateOptimisticId = useCallback(() => {
    return `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Apply optimistic update
  const applyOptimisticUpdate = useCallback((update: OptimisticUpdate) => {
    setOptimisticUpdates(prev => [...prev, update]);
    
    switch (update.type) {
      case 'create':
        if (update.assignment) {
          setAssignments(prev => [...prev, update.assignment!]);
        }
        break;
      case 'update':
        if (update.assignment) {
          setAssignments(prev => prev.map(a => 
            a.id === update.assignment!.id ? update.assignment! : a
          ));
        }
        break;
      case 'delete':
        setAssignments(prev => prev.filter(a => a.id !== update.id));
        break;
    }
  }, []);

  // Rollback optimistic update
  const rollbackOptimisticUpdate = useCallback((updateId: string) => {
    const update = optimisticUpdates.find(u => u.id === updateId);
    if (!update) return;

    setOptimisticUpdates(prev => prev.filter(u => u.id !== updateId));
    
    switch (update.type) {
      case 'create':
        if (update.assignment) {
          setAssignments(prev => prev.filter(a => a.id !== update.assignment!.id));
        }
        break;
      case 'update':
        if (update.originalAssignment) {
          setAssignments(prev => prev.map(a => 
            a.id === update.originalAssignment!.id ? update.originalAssignment! : a
          ));
        }
        break;
      case 'delete':
        if (update.originalAssignment) {
          setAssignments(prev => [...prev, update.originalAssignment!]);
        }
        break;
    }
  }, [optimisticUpdates]);

  // Confirm optimistic update (remove from pending list)
  const confirmOptimisticUpdate = useCallback((updateId: string) => {
    setOptimisticUpdates(prev => prev.filter(u => u.id !== updateId));
  }, []);

  // Convert database row to Assignment interface
  const mapDesignacaoToAssignment = (designacao: any): Assignment => ({
    id: designacao.id,
    programId: designacao.parte_id || '',
    studentId: designacao.estudante_id || '',
    assistantId: designacao.assistente_id || undefined,
    partType: designacao.observacoes || '',
    partNumber: 0,
    weekDate: designacao.data_designacao || '',
    status: (designacao.status as Assignment['status']) || 'pending',
    studyPoint: designacao.observacoes || undefined,
    counselNotes: designacao.observacoes || undefined,
    timing: 0,
    createdAt: designacao.created_at || '',
    updatedAt: designacao.updated_at || ''
  });

  // Convert Assignment to database insert
  const mapAssignmentToInsert = (assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): any => ({
    parte_id: assignment.programId,
    estudante_id: assignment.studentId,
    assistente_id: assignment.assistantId,
    data_designacao: assignment.weekDate,
    status: assignment.status,
    observacoes: assignment.studyPoint || assignment.counselNotes
  });

  // Load assignments from database
  const loadAssignments = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('designacoes')
        .select('*')
        .order('data_designacao', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const mappedAssignments = (data || []).map(mapDesignacaoToAssignment);
      setAssignments(mappedAssignments);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create new assignment with optimistic updates
  const createAssignment = useCallback(async (
    assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Assignment | null> => {
    const optimisticId = generateOptimisticId();
    const now = new Date().toISOString();
    
    // Create optimistic assignment
    const optimisticAssignment: Assignment = {
      ...assignment,
      id: optimisticId,
      createdAt: now,
      updatedAt: now
    };

    // Apply optimistic update
    const updateId = generateOptimisticId();
    applyOptimisticUpdate({
      id: updateId,
      type: 'create',
      assignment: optimisticAssignment,
      timestamp: Date.now()
    });

    try {
      setError(null);
      
      const insertData = mapAssignmentToInsert(assignment);
      
      const { data, error: insertError } = await supabase
        .from('designacoes')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const newAssignment = mapDesignacaoToAssignment(data);
      
      // Replace optimistic assignment with real one
      setAssignments(prev => prev.map(a => 
        a.id === optimisticId ? newAssignment : a
      ));
      
      // Confirm optimistic update
      confirmOptimisticUpdate(updateId);
      
      return newAssignment;
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
      
      // Rollback optimistic update
      rollbackOptimisticUpdate(updateId);
      
      return null;
    }
  }, [generateOptimisticId, applyOptimisticUpdate, confirmOptimisticUpdate, rollbackOptimisticUpdate]);

  // Update assignment with optimistic updates
  const updateAssignment = useCallback(async (
    id: string, 
    updates: Partial<Assignment>
  ): Promise<Assignment | null> => {
    const originalAssignment = assignments.find(a => a.id === id);
    if (!originalAssignment) {
      setError('Assignment not found');
      return null;
    }

    // Create optimistic updated assignment
    const optimisticAssignment: Assignment = {
      ...originalAssignment,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Apply optimistic update
    const updateId = generateOptimisticId();
    applyOptimisticUpdate({
      id: updateId,
      type: 'update',
      assignment: optimisticAssignment,
      originalAssignment,
      timestamp: Date.now()
    });

    try {
      setError(null);
      
      const updateData: any = {};
      
      if (updates.programId) updateData.parte_id = updates.programId;
      if (updates.studentId) updateData.estudante_id = updates.studentId;
      if (updates.assistantId !== undefined) updateData.assistente_id = updates.assistantId;
      if (updates.weekDate) updateData.data_designacao = updates.weekDate;
      if (updates.status) updateData.status = updates.status;
      if (updates.studyPoint !== undefined || updates.counselNotes !== undefined) {
        updateData.observacoes = updates.studyPoint || updates.counselNotes;
      }

      const { data, error: updateError } = await supabase
        .from('designacoes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedAssignment = mapDesignacaoToAssignment(data);
      
      // Replace optimistic assignment with real one
      setAssignments(prev => prev.map(a => a.id === id ? updatedAssignment : a));
      
      // Confirm optimistic update
      confirmOptimisticUpdate(updateId);
      
      return updatedAssignment;
    } catch (err) {
      console.error('Error updating assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to update assignment');
      
      // Rollback optimistic update
      rollbackOptimisticUpdate(updateId);
      
      return null;
    }
  }, [assignments, generateOptimisticId, applyOptimisticUpdate, confirmOptimisticUpdate, rollbackOptimisticUpdate]);

  // Delete assignment with optimistic updates
  const deleteAssignment = useCallback(async (id: string): Promise<boolean> => {
    const originalAssignment = assignments.find(a => a.id === id);
    if (!originalAssignment) {
      setError('Assignment not found');
      return false;
    }

    // Apply optimistic update
    const updateId = generateOptimisticId();
    applyOptimisticUpdate({
      id: updateId,
      type: 'delete',
      originalAssignment,
      timestamp: Date.now()
    });

    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('designacoes')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Confirm optimistic update
      confirmOptimisticUpdate(updateId);
      
      return true;
    } catch (err) {
      console.error('Error deleting assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete assignment');
      
      // Rollback optimistic update
      rollbackOptimisticUpdate(updateId);
      
      return false;
    }
  }, [assignments, generateOptimisticId, applyOptimisticUpdate, confirmOptimisticUpdate, rollbackOptimisticUpdate]);

  // Get assignment by ID
  const getAssignment = useCallback((id: string): Assignment | null => {
    return assignments.find(a => a.id === id) || null;
  }, [assignments]);

  // Query assignments by week
  const getAssignmentsByWeek = useCallback((weekDate: string): Assignment[] => {
    return assignments.filter(a => a.weekDate === weekDate);
  }, [assignments]);

  // Query assignments by student
  const getAssignmentsByStudent = useCallback((studentId: string): Assignment[] => {
    return assignments.filter(a => a.studentId === studentId || a.assistantId === studentId);
  }, [assignments]);

  // Query assignments by program
  const getAssignmentsByProgram = useCallback((programId: string): Assignment[] => {
    return assignments.filter(a => a.programId === programId);
  }, [assignments]);

  // Generate assignments using Supabase Edge Function
  const generateAssignments = useCallback(async (
    options: OpcoesDegeracao
  ): Promise<ResultadoGeracao | null> => {
    try {
      setError(null);
      setLoading(true);

      const { data, error: functionError } = await supabase.functions.invoke('generate-assignments', {
        body: options
      });

      if (functionError) {
        throw functionError;
      }

      // Refresh assignments after generation
      await loadAssignments();

      return data as ResultadoGeracao;
    } catch (err) {
      console.error('Error generating assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate assignments');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAssignments]);

  // Validate assignments against S-38 rules
  const validateAssignments = useCallback((assignments: Assignment[]): AssignmentValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    assignments.forEach(assignment => {
      // Basic validation
      if (!assignment.studentId) {
        errors.push({
          field: 'studentId',
          message: 'Student is required',
          severity: 'error'
        });
      }

      if (!assignment.partType) {
        errors.push({
          field: 'partType',
          message: 'Part type is required',
          severity: 'error'
        });
      }

      if (!assignment.weekDate) {
        errors.push({
          field: 'weekDate',
          message: 'Week date is required',
          severity: 'error'
        });
      }

      // S-38 specific validations would go here
      // This is a simplified version - full implementation would check all S-38 rules
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  // Enhanced real-time subscription with conflict detection
  const subscribeToAssignments = useCallback((
    callback: (assignments: Assignment[]) => void
  ) => {
    // Add callback to the set
    callbacksRef.current.add(callback);

    // If this is the first subscription, set up the real-time channel
    if (callbacksRef.current.size === 1) {
      subscriptionRef.current = supabase
        .channel('assignments_realtime')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'designacoes' },
          async (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            try {
              // Handle different event types
              switch (eventType) {
                case 'INSERT':
                  if (newRecord) {
                    const newAssignment = mapDesignacaoToAssignment(newRecord as DesignacaoRow);
                    
                    // Check if this is our own optimistic update
                    const isOptimistic = optimisticUpdates.some(u => 
                      u.type === 'create' && 
                      u.assignment?.studentId === newAssignment.studentId &&
                      u.assignment?.weekDate === newAssignment.weekDate &&
                      u.assignment?.partType === newAssignment.partType
                    );
                    
                    if (!isOptimistic) {
                      setAssignments(prev => {
                        // Avoid duplicates
                        if (prev.some(a => a.id === newAssignment.id)) {
                          return prev;
                        }
                        return [...prev, newAssignment];
                      });
                    }
                  }
                  break;
                  
                case 'UPDATE':
                  if (newRecord) {
                    const updatedAssignment = mapDesignacaoToAssignment(newRecord as DesignacaoRow);
                    
                    // Check for conflicts with optimistic updates
                    const conflictingUpdate = optimisticUpdates.find(u => 
                      u.type === 'update' && 
                      u.assignment?.id === updatedAssignment.id &&
                      u.timestamp > Date.now() - 5000 // Within last 5 seconds
                    );
                    
                    if (conflictingUpdate) {
                      // Handle conflict - for now, server wins
                      console.warn('Conflict detected, server version will be used');
                      rollbackOptimisticUpdate(conflictingUpdate.id);
                    }
                    
                    setAssignments(prev => prev.map(a => 
                      a.id === updatedAssignment.id ? updatedAssignment : a
                    ));
                  }
                  break;
                  
                case 'DELETE':
                  if (oldRecord) {
                    const deletedId = (oldRecord as DesignacaoRow).id;
                    
                    // Check if this is our own optimistic delete
                    const isOptimistic = optimisticUpdates.some(u => 
                      u.type === 'delete' && 
                      u.originalAssignment?.id === deletedId
                    );
                    
                    if (!isOptimistic) {
                      setAssignments(prev => prev.filter(a => a.id !== deletedId));
                    }
                  }
                  break;
              }
              
              // Notify all callbacks
              callbacksRef.current.forEach(cb => {
                try {
                  cb(assignments);
                } catch (err) {
                  console.error('Error in assignment callback:', err);
                }
              });
              
            } catch (err) {
              console.error('Error handling real-time assignment change:', err);
              setError('Error processing real-time update');
            }
          }
        )
        .on('system', {}, (status) => {
          setIsRealTimeConnected(status === 'SUBSCRIBED');
        })
        .subscribe();
    }

    // Return unsubscribe function
    return () => {
      callbacksRef.current.delete(callback);
      
      // If no more callbacks, unsubscribe from the channel
      if (callbacksRef.current.size === 0 && subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
        setIsRealTimeConnected(false);
      }
    };
  }, [assignments, optimisticUpdates, rollbackOptimisticUpdate]);

  // Resolve conflicts between optimistic updates and server state
  const resolveConflict = useCallback(async (
    optimisticId: string, 
    resolution: 'accept' | 'reject'
  ): Promise<void> => {
    const update = optimisticUpdates.find(u => u.id === optimisticId);
    if (!update) return;

    if (resolution === 'accept') {
      // Keep the optimistic update, push to server
      if (update.type === 'update' && update.assignment) {
        await updateAssignment(update.assignment.id, update.assignment);
      }
    } else {
      // Reject the optimistic update, revert to server state
      rollbackOptimisticUpdate(optimisticId);
    }
  }, [optimisticUpdates, updateAssignment, rollbackOptimisticUpdate]);

  // Retry failed optimistic updates
  const retryFailedUpdates = useCallback(async (): Promise<void> => {
    const failedUpdates = optimisticUpdates.filter(u => 
      Date.now() - u.timestamp > 10000 // Older than 10 seconds
    );

    for (const update of failedUpdates) {
      try {
        switch (update.type) {
          case 'create':
            if (update.assignment) {
              const { id, createdAt, updatedAt, ...assignmentData } = update.assignment;
              await createAssignment(assignmentData);
            }
            break;
          case 'update':
            if (update.assignment) {
              await updateAssignment(update.assignment.id, update.assignment);
            }
            break;
          case 'delete':
            if (update.originalAssignment) {
              await deleteAssignment(update.originalAssignment.id);
            }
            break;
        }
      } catch (err) {
        console.error('Error retrying failed update:', err);
      }
    }
  }, [optimisticUpdates, createAssignment, updateAssignment, deleteAssignment]);

  // Confirm assignment
  const confirmAssignment = useCallback(async (id: string): Promise<boolean> => {
    const result = await updateAssignment(id, { status: 'confirmed' });
    return result !== null;
  }, [updateAssignment]);

  // Complete assignment
  const completeAssignment = useCallback(async (
    id: string, 
    counselNotes?: string, 
    timing?: number
  ): Promise<boolean> => {
    const updates: Partial<Assignment> = { status: 'completed' };
    if (counselNotes) updates.counselNotes = counselNotes;
    if (timing) updates.timing = timing;
    
    const result = await updateAssignment(id, updates);
    return result !== null;
  }, [updateAssignment]);

  // Cancel assignment
  const cancelAssignment = useCallback(async (id: string, reason?: string): Promise<boolean> => {
    const updates: Partial<Assignment> = { status: 'cancelled' };
    if (reason) updates.counselNotes = reason;
    
    const result = await updateAssignment(id, updates);
    return result !== null;
  }, [updateAssignment]);

  // Detect conflicts in assignments
  const detectConflicts = useCallback((assignments: Assignment[]): ConflitosDesignacao[] => {
    const conflicts: ConflitosDesignacao[] = [];
    
    // Group assignments by week and student
    const weeklyAssignments = assignments.reduce((acc, assignment) => {
      const key = `${assignment.weekDate}-${assignment.studentId}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(assignment);
      return acc;
    }, {} as Record<string, Assignment[]>);

    // Check for overloaded students (more than 1 assignment per week)
    Object.entries(weeklyAssignments).forEach(([key, studentAssignments]) => {
      if (studentAssignments.length > 1) {
        const [weekDate, studentId] = key.split('-');
        conflicts.push({
          tipo: 'sobrecarga',
          estudante_id: studentId,
          numero_parte: studentAssignments[0].partNumber,
          descricao: `Student has ${studentAssignments.length} assignments in week ${weekDate}`,
          sugestao: 'Consider redistributing assignments'
        });
      }
    });

    return conflicts;
  }, []);

  // Get assignment statistics
  const getAssignmentStats = useCallback(async (startDate: string, endDate: string) => {
    try {
      const { data, error: statsError } = await supabase
        .from('designacoes')
        .select('*')
        .gte('data_designacao', startDate)
        .lte('data_designacao', endDate);

      if (statsError) {
        throw statsError;
      }

      // Calculate statistics
      const stats = {
        total: data?.length || 0,
        byStatus: data?.reduce((acc, d) => {
          acc[d.status || 'unknown'] = (acc[d.status || 'unknown'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        byPartType: data?.reduce((acc, d) => {
          acc[d.titulo_parte || 'unknown'] = (acc[d.titulo_parte || 'unknown'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      };

      return stats;
    } catch (err) {
      console.error('Error getting assignment stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to get assignment statistics');
      return null;
    }
  }, []);

  // Get student assignment history
  const getStudentHistory = useCallback(async (studentId: string): Promise<HistoricoDesignacao | null> => {
    try {
      const { data, error: historyError } = await supabase
        .from('designacoes')
        .select('*')
        .or(`estudante_id.eq.${studentId},ajudante_id.eq.${studentId}`)
        .order('data_designacao', { ascending: false })
        .limit(20);

      if (historyError) {
        throw historyError;
      }

      const designacoes_recentes = (data || []).map(d => ({
        data_inicio_semana: d.data_designacao || '',
        numero_parte: 0, // This field doesn't exist in current schema
        tipo_parte: d.titulo_parte || '',
        foi_ajudante: d.ajudante_id === studentId
      }));

      // Calculate recent assignments (last 8 weeks)
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
      const recentAssignments = designacoes_recentes.filter(d => 
        new Date(d.data_inicio_semana) >= eightWeeksAgo
      );

      return {
        estudante_id: studentId,
        designacoes_recentes,
        total_designacoes_8_semanas: recentAssignments.length,
        ultima_designacao: designacoes_recentes[0]?.data_inicio_semana
      };
    } catch (err) {
      console.error('Error getting student history:', err);
      setError(err instanceof Error ? err.message : 'Failed to get student history');
      return null;
    }
  }, []);

  // Refresh assignments
  const refreshAssignments = useCallback(async () => {
    await loadAssignments();
  }, [loadAssignments]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load assignments on mount and when user changes
  useEffect(() => {
    if (user) {
      loadAssignments();
    } else {
      setAssignments([]);
      setOptimisticUpdates([]);
    }
  }, [user, loadAssignments]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      callbacksRef.current.clear();
    };
  }, []);

  const contextValue: AssignmentContextType = {
    // State
    assignments,
    loading,
    error,
    isRealTimeConnected,
    optimisticUpdates,
    
    // CRUD operations with optimistic updates
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignment,
    
    // Queries
    getAssignmentsByWeek,
    getAssignmentsByStudent,
    getAssignmentsByProgram,
    
    // Generation and validation
    generateAssignments,
    validateAssignments,
    
    // Real-time and conflict resolution
    subscribeToAssignments,
    resolveConflict,
    
    // Status management
    confirmAssignment,
    completeAssignment,
    cancelAssignment,
    
    // Conflict detection
    detectConflicts,
    
    // Analytics
    getAssignmentStats,
    getStudentHistory,
    
    // Utilities
    refreshAssignments,
    clearError,
    retryFailedUpdates
  };

  return (
    <AssignmentContext.Provider value={contextValue}>
      {children}
    </AssignmentContext.Provider>
  );
}

export function useAssignmentContext() {
  const context = useContext(AssignmentContext);
  if (context === undefined) {
    throw new Error('useAssignmentContext must be used within an AssignmentProvider');
  }
  return context;
}

// Convenience hook for assignment operations
export function useAssignments() {
  return useAssignmentContext();
}