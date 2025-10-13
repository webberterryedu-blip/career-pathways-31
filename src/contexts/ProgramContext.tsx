import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Program {
  id: string;
  title: string;
  weekDate: string;
  isActive: boolean;
  uploadedBy: string;
  createdAt: string;
  sections: ProgramSection[];
}

interface ProgramSection {
  id: string;
  name: string;
  parts: ProgramPart[];
  totalTime: number;
}

interface ProgramPart {
  id: string;
  title: string;
  type: string;
  timeAllotted: number;
  studyPoint?: string;
  genderRequirement?: 'masculino' | 'feminino';
  assistantRequired: boolean;
  materials?: ProgramMaterial[];
}

interface ProgramMaterial {
  id: string;
  title: string;
  type: 'video' | 'publication' | 'link' | 'document';
  url?: string;
  description?: string;
}

interface ProgramValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ProgramContextType {
  // State
  programs: Program[];
  loading: boolean;
  error: string | null;
  
  // Congregação selecionada
  selectedCongregacaoId: string | null;
  setSelectedCongregacaoId: (id: string | null) => void;
  
  // Programa selecionado
  selectedProgramId: string | null;
  setSelectedProgramId: (id: string | null) => void;
  activeProgram: Program | null;
  
  // Semana selecionada
  selectedWeekStart: string | null;
  setSelectedWeekStart: (date: string | null) => void;
  
  // Program management
  createProgram: (program: Omit<Program, 'id' | 'createdAt'>) => Promise<Program | null>;
  updateProgram: (id: string, updates: Partial<Program>) => Promise<Program | null>;
  deleteProgram: (id: string) => Promise<boolean>;
  activateProgram: (id: string) => Promise<boolean>;
  deactivateProgram: (id: string) => Promise<boolean>;
  
  // Program parsing and validation
  parseProgramFromPDF: (file: File) => Promise<Program | null>;
  validateProgram: (program: Program) => ProgramValidationResult;
  
  // Program queries
  getProgramsByWeek: (weekDate: string) => Program[];
  getActivePrograms: () => Program[];
  
  // Material management
  addMaterialToProgram: (programId: string, partId: string, material: ProgramMaterial) => Promise<boolean>;
  removeMaterialFromProgram: (programId: string, partId: string, materialId: string) => Promise<boolean>;
  
  // Utility functions
  refreshPrograms: () => Promise<void>;
  clearError: () => void;
  
  // Funções para limpar contexto
  clearContext: () => void;
}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

export function ProgramProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCongregacaoId, setSelectedCongregacaoId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);

  // Get active program
  const activeProgram = programs.find(p => p.id === selectedProgramId) || null;

  // Load programs from database
  const loadPrograms = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('programas_ministeriais')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Map database rows to Program interface
      const mappedPrograms: Program[] = (data || []).map(row => ({
        id: row.id,
        title: row.arquivo_nome || 'Programa sem título',
        weekDate: row.mes_ano || '',
        isActive: row.status === 'ativo',
        uploadedBy: row.user_id || '',
        createdAt: row.created_at || '',
        sections: [] // This would need to be parsed from the program data
      }));

      setPrograms(mappedPrograms);
    } catch (err) {
      console.error('Error loading programs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create new program
  const createProgram = useCallback(async (
    program: Omit<Program, 'id' | 'createdAt'>
  ): Promise<Program | null> => {
    try {
      setError(null);
      
      const { data, error: insertError } = await supabase
        .from('programas_ministeriais')
        .insert({
          arquivo_nome: program.title,
          mes_ano: program.weekDate,
          status: program.isActive ? 'ativo' : 'inativo',
          user_id: program.uploadedBy
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const newProgram: Program = {
        id: data.id,
        title: data.arquivo_nome || '',
        weekDate: data.mes_ano || '',
        isActive: data.status === 'ativo',
        uploadedBy: data.user_id || '',
        createdAt: data.created_at || '',
        sections: program.sections
      };

      setPrograms(prev => [newProgram, ...prev]);
      return newProgram;
    } catch (err) {
      console.error('Error creating program:', err);
      setError(err instanceof Error ? err.message : 'Failed to create program');
      return null;
    }
  }, []);

  // Update program
  const updateProgram = useCallback(async (
    id: string, 
    updates: Partial<Program>
  ): Promise<Program | null> => {
    try {
      setError(null);
      
      const updateData: any = {};
      if (updates.title) updateData.arquivo_nome = updates.title;
      if (updates.weekDate) updateData.mes_ano = updates.weekDate;
      if (updates.isActive !== undefined) updateData.status = updates.isActive ? 'ativo' : 'inativo';

      const { data, error: updateError } = await supabase
        .from('programas_ministeriais')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedProgram: Program = {
        id: data.id,
        title: data.arquivo_nome || '',
        weekDate: data.mes_ano || '',
        isActive: data.status === 'ativo',
        uploadedBy: data.user_id || '',
        createdAt: data.created_at || '',
        sections: updates.sections || []
      };

      setPrograms(prev => prev.map(p => p.id === id ? updatedProgram : p));
      return updatedProgram;
    } catch (err) {
      console.error('Error updating program:', err);
      setError(err instanceof Error ? err.message : 'Failed to update program');
      return null;
    }
  }, []);

  // Delete program
  const deleteProgram = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('programas_ministeriais')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setPrograms(prev => prev.filter(p => p.id !== id));
      
      // Clear selection if deleted program was selected
      if (selectedProgramId === id) {
        setSelectedProgramId(null);
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting program:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete program');
      return false;
    }
  }, [selectedProgramId]);

  // Activate program
  const activateProgram = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      // First deactivate all other programs
      await supabase
        .from('programas_ministeriais')
        .update({ status: 'inativo' })
        .neq('id', id);

      // Then activate the selected program
      const { error: activateError } = await supabase
        .from('programas_ministeriais')
        .update({ status: 'ativo' })
        .eq('id', id);

      if (activateError) {
        throw activateError;
      }

      // Update local state
      setPrograms(prev => prev.map(p => ({
        ...p,
        isActive: p.id === id
      })));

      setSelectedProgramId(id);
      return true;
    } catch (err) {
      console.error('Error activating program:', err);
      setError(err instanceof Error ? err.message : 'Failed to activate program');
      return false;
    }
  }, []);

  // Deactivate program
  const deactivateProgram = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const { error: deactivateError } = await supabase
        .from('programas_ministeriais')
        .update({ status: 'inativo' })
        .eq('id', id);

      if (deactivateError) {
        throw deactivateError;
      }

      setPrograms(prev => prev.map(p => 
        p.id === id ? { ...p, isActive: false } : p
      ));

      if (selectedProgramId === id) {
        setSelectedProgramId(null);
      }

      return true;
    } catch (err) {
      console.error('Error deactivating program:', err);
      setError(err instanceof Error ? err.message : 'Failed to deactivate program');
      return false;
    }
  }, [selectedProgramId]);

  // Parse program from PDF (placeholder implementation)
  const parseProgramFromPDF = useCallback(async (file: File): Promise<Program | null> => {
    try {
      setError(null);
      setLoading(true);

      // This would integrate with a PDF parsing service or Edge Function
      // For now, return a mock program structure
      const mockProgram: Program = {
        id: '', // Will be set when saved
        title: `Programa da semana - ${file.name}`,
        weekDate: new Date().toISOString().split('T')[0],
        isActive: false,
        uploadedBy: user?.id || '',
        createdAt: '',
        sections: [
          {
            id: '1',
            name: 'Tesouros da Palavra de Deus',
            totalTime: 10,
            parts: [
              {
                id: '1-1',
                title: 'Discurso',
                type: 'talk',
                timeAllotted: 10,
                genderRequirement: 'masculino',
                assistantRequired: false
              }
            ]
          },
          {
            id: '2',
            name: 'Faça Seu Melhor no Ministério',
            totalTime: 15,
            parts: [
              {
                id: '2-1',
                title: 'Leitura da Bíblia',
                type: 'bible_reading',
                timeAllotted: 4,
                genderRequirement: 'masculino',
                assistantRequired: false
              }
            ]
          }
        ]
      };

      return mockProgram;
    } catch (err) {
      console.error('Error parsing PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse PDF');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Validate program
  const validateProgram = useCallback((program: Program): ProgramValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!program.title) {
      errors.push('Program title is required');
    }

    if (!program.weekDate) {
      errors.push('Week date is required');
    }

    if (program.sections.length === 0) {
      warnings.push('Program has no sections');
    }

    program.sections.forEach((section, sectionIndex) => {
      if (!section.name) {
        errors.push(`Section ${sectionIndex + 1} is missing a name`);
      }

      if (section.parts.length === 0) {
        warnings.push(`Section "${section.name}" has no parts`);
      }

      section.parts.forEach((part, partIndex) => {
        if (!part.title) {
          errors.push(`Part ${partIndex + 1} in section "${section.name}" is missing a title`);
        }

        if (!part.timeAllotted || part.timeAllotted <= 0) {
          errors.push(`Part "${part.title}" has invalid time allocation`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  // Query programs by week
  const getProgramsByWeek = useCallback((weekDate: string): Program[] => {
    return programs.filter(p => p.weekDate === weekDate);
  }, [programs]);

  // Get active programs
  const getActivePrograms = useCallback((): Program[] => {
    return programs.filter(p => p.isActive);
  }, [programs]);

  // Add material to program (placeholder)
  const addMaterialToProgram = useCallback(async (
    programId: string, 
    partId: string, 
    material: ProgramMaterial
  ): Promise<boolean> => {
    // This would update the program's materials in the database
    console.log('Adding material to program:', { programId, partId, material });
    return true;
  }, []);

  // Remove material from program (placeholder)
  const removeMaterialFromProgram = useCallback(async (
    programId: string, 
    partId: string, 
    materialId: string
  ): Promise<boolean> => {
    // This would remove the material from the database
    console.log('Removing material from program:', { programId, partId, materialId });
    return true;
  }, []);

  // Refresh programs
  const refreshPrograms = useCallback(async () => {
    await loadPrograms();
  }, [loadPrograms]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load programs on mount and when user changes
  useEffect(() => {
    if (user) {
      loadPrograms();
    } else {
      setPrograms([]);
    }
  }, [user, loadPrograms]);

  // Carregar contexto do localStorage ao iniciar
  useEffect(() => {
    const savedCongregacaoId = localStorage.getItem('selectedCongregacaoId');
    const savedProgramId = localStorage.getItem('selectedProgramId');
    const savedWeekStart = localStorage.getItem('selectedWeekStart');
    
    if (savedCongregacaoId) setSelectedCongregacaoId(savedCongregacaoId);
    if (savedProgramId) setSelectedProgramId(savedProgramId);
    if (savedWeekStart) setSelectedWeekStart(savedWeekStart);
  }, []);

  // Salvar contexto no localStorage quando mudar
  useEffect(() => {
    if (selectedCongregacaoId) {
      localStorage.setItem('selectedCongregacaoId', selectedCongregacaoId);
    } else {
      localStorage.removeItem('selectedCongregacaoId');
    }
  }, [selectedCongregacaoId]);

  useEffect(() => {
    if (selectedProgramId) {
      localStorage.setItem('selectedProgramId', selectedProgramId);
    } else {
      localStorage.removeItem('selectedProgramId');
    }
  }, [selectedProgramId]);

  useEffect(() => {
    if (selectedWeekStart) {
      localStorage.setItem('selectedWeekStart', selectedWeekStart);
    } else {
      localStorage.removeItem('selectedWeekStart');
    }
  }, [selectedWeekStart]);

  const clearContext = () => {
    setSelectedCongregacaoId(null);
    setSelectedProgramId(null);
    setSelectedWeekStart(null);
    localStorage.removeItem('selectedCongregacaoId');
    localStorage.removeItem('selectedProgramId');
    localStorage.removeItem('selectedWeekStart');
  };

  const contextValue: ProgramContextType = {
    // State
    programs,
    loading,
    error,
    
    // Selection state
    selectedCongregacaoId,
    setSelectedCongregacaoId,
    selectedProgramId,
    setSelectedProgramId,
    activeProgram,
    selectedWeekStart,
    setSelectedWeekStart,
    
    // Program management
    createProgram,
    updateProgram,
    deleteProgram,
    activateProgram,
    deactivateProgram,
    
    // Program parsing and validation
    parseProgramFromPDF,
    validateProgram,
    
    // Program queries
    getProgramsByWeek,
    getActivePrograms,
    
    // Material management
    addMaterialToProgram,
    removeMaterialFromProgram,
    
    // Utility functions
    refreshPrograms,
    clearError,
    clearContext
  };

  return (
    <ProgramContext.Provider value={contextValue}>
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgramContext() {
  const context = useContext(ProgramContext);
  if (context === undefined) {
    throw new Error('useProgramContext must be used within a ProgramProvider');
  }
  return context;
}