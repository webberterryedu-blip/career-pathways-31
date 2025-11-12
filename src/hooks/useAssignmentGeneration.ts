// @ts-nocheck
/**
 * Hook for generating assignments using S-38 algorithm
 * 
 * This hook integrates the assignment engine with the application,
 * handling data preparation, validation, and result processing.
 */

import { useState, useCallback } from 'react';
import { useStudentContext } from '@/contexts/StudentContext';
import { useProgramContext } from '@/contexts/ProgramContext';
import { generateAssignments } from '@/services/assignmentEngine';
import { validateAssignments } from '@/services/assignmentValidator';
import type { 
  OpcoesDegeracao, 
  ResultadoGeracao,
  ParteProgramaS38T,
  HistoricoDesignacao,
  TipoParteS38T
} from '@/types/designacoes';
import type { StudentQualifications } from '@/types/estudantes';
import { supabase } from '@/integrations/supabase/client';

interface UseAssignmentGenerationResult {
  generateAssignments: (programId: string, options?: Partial<OpcoesDegeracao>) => Promise<ResultadoGeracao | null>;
  isGenerating: boolean;
  error: string | null;
  lastResult: ResultadoGeracao | null;
}

export function useAssignmentGeneration(): UseAssignmentGenerationResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ResultadoGeracao | null>(null);

  const { students, getActiveStudents } = useStudentContext();
  const { activeProgram } = useProgramContext();

  /**
   * Extract qualifications from student record
   */
  const getStudentQualifications = useCallback((student: any): StudentQualifications => {
    return {
      bible_reading: student.reading || false,
      initial_call: student.starting || false,
      return_visit: student.following || false,
      bible_study: student.explaining || false,
      talk: student.talk || false,
      demonstration: student.starting || student.following || student.making || false,
      can_be_helper: student.ativo && !student.menor,
      can_teach_others: ['anciao', 'servo_ministerial'].includes(student.cargo)
    };
  }, []);

  /**
   * Load assignment history from database
   */
  const loadAssignmentHistory = useCallback(async (studentId: string): Promise<HistoricoDesignacao> => {
    try {
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

      const { data, error: historyError } = await supabase
        .from('assignment_history')
        .select('*')
        .eq('student_id', studentId)
        .gte('meeting_date', eightWeeksAgo.toISOString().split('T')[0])
        .order('meeting_date', { ascending: false });

      if (historyError) {
        console.error('Error loading assignment history:', historyError);
        return {
          estudante_id: studentId,
          designacoes_recentes: [],
          total_designacoes_8_semanas: 0,
          ultima_designacao: undefined
        };
      }

      return {
        estudante_id: studentId,
        designacoes_recentes: data || [],
        total_designacoes_8_semanas: data?.length || 0,
        ultima_designacao: data?.[0]?.meeting_date
      };
    } catch (err) {
      console.error('Error loading assignment history:', err);
      return {
        estudante_id: studentId,
        designacoes_recentes: [],
        total_designacoes_8_semanas: 0,
        ultima_designacao: undefined
      };
    }
  }, []);

  /**
   * Load family relationships from database
   */
  const loadFamilyRelationships = useCallback(async (): Promise<Map<string, string[]>> => {
    const relationships = new Map<string, string[]>();

    try {
      // Group students by family_id
      const activeStudents = students.filter(s => s.ativo);
      const familyGroups = new Map<string, string[]>();

      activeStudents.forEach(student => {
        if (student.family_id) {
          if (!familyGroups.has(student.family_id)) {
            familyGroups.set(student.family_id, []);
          }
          familyGroups.get(student.family_id)!.push(student.id);
        }
      });

      // Create bidirectional relationships
      familyGroups.forEach((familyMembers) => {
        familyMembers.forEach(studentId => {
          const otherMembers = familyMembers.filter(id => id !== studentId);
          relationships.set(studentId, otherMembers);
        });
      });

      return relationships;
    } catch (err) {
      console.error('Error loading family relationships:', err);
      return relationships;
    }
  }, [students]);

  /**
   * Parse program sections into S-38 parts
   */
  const parseProgramParts = useCallback((program: any): ParteProgramaS38T[] => {
    const parts: ParteProgramaS38T[] = [];
    let partNumber = 1;

    if (!program || !program.sections) {
      return parts;
    }

    program.sections.forEach((section: any) => {
      section.parts?.forEach((part: any) => {
        const partType = mapPartTypeToS38(part.type);
        
        parts.push({
          numero_parte: partNumber++,
          titulo_parte: part.title || '',
          tipo_parte: partType,
          tempo_minutos: part.timeAllotted || 5,
          cena: part.studyPoint,
          requer_ajudante: part.assistantRequired || false,
          restricao_genero: part.genderRequirement
        });
      });
    });

    return parts;
  }, []);

  /**
   * Map part type from program to S-38 type
   */
  const mapPartTypeToS38 = (partType: string): TipoParteS38T => {
    const typeMap: Record<string, TipoParteS38T> = {
      'bible_reading': 'leitura_biblica',
      'talk': 'discurso',
      'demonstration': 'demonstracao',
      'initial_call': 'primeira_conversa',
      'return_visit': 'revisita',
      'bible_study': 'estudo_biblico',
      'ministry_part': 'parte_ministerio'
    };

    return typeMap[partType] || 'parte_ministerio';
  };

  /**
   * Generate assignments for a program
   */
  const generate = useCallback(async (
    programId: string,
    options?: Partial<OpcoesDegeracao>
  ): Promise<ResultadoGeracao | null> => {
    try {
      setIsGenerating(true);
      setError(null);

      // Validate program
      if (!activeProgram || activeProgram.id !== programId) {
        throw new Error('Programa não encontrado ou não está ativo');
      }

      // Get active students
      const activeStudents = getActiveStudents();
      if (activeStudents.length === 0) {
        throw new Error('Nenhum estudante ativo disponível para designações');
      }

      // Prepare student qualifications
      const studentQualifications = new Map<string, StudentQualifications>();
      activeStudents.forEach(student => {
        studentQualifications.set(student.id, getStudentQualifications(student));
      });

      // Load assignment histories
      const assignmentHistories = new Map<string, HistoricoDesignacao>();
      await Promise.all(
        activeStudents.map(async student => {
          const history = await loadAssignmentHistory(student.id);
          assignmentHistories.set(student.id, history);
        })
      );

      // Load family relationships
      const familyRelationships = await loadFamilyRelationships();

      // Parse program parts
      const parts = parseProgramParts(activeProgram);
      if (parts.length === 0) {
        throw new Error('Programa não contém partes para designação');
      }

      // Prepare generation options
      const generationOptions: OpcoesDegeracao = {
        data_inicio_semana: activeProgram.weekDate,
        partes: parts,
        excluir_estudante_ids: options?.excluir_estudante_ids || [],
        preferencias: options?.preferencias || {}
      };

      // Generate assignments using S-38 algorithm
      const result = await generateAssignments(
        activeStudents,
        studentQualifications,
        assignmentHistories,
        familyRelationships,
        generationOptions
      );

      // Save successful assignments to database
      if (result.sucesso && result.designacoes.length > 0) {
        // Get or create the program in programas table
        let realProgramId = programId;
        
        // Check if program exists in programas table
        const { data: existingProgram, error: checkError } = await supabase
          .from('programas')
          .select('id')
          .eq('id_semana', activeProgram.weekDate)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking program:', checkError);
        }

        if (!existingProgram) {
          // Create program entry
          const { data: newProgram, error: createError } = await supabase
            .from('programas')
            .insert({
              id_semana: activeProgram.weekDate,
              data_reuniao: activeProgram.weekDate,
              tema: activeProgram.title,
              ativo: true
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating program:', createError);
          } else if (newProgram) {
            realProgramId = newProgram.id;
          }
        } else {
          realProgramId = existingProgram.id;
        }

        // Now get or create parts for each assignment
        const insertPromises = result.designacoes.map(async (designacao) => {
          // Find or create the part
          const { data: existingPart } = await supabase
            .from('partes')
            .select('id')
            .eq('programa_id', realProgramId)
            .eq('titulo', designacao.titulo_parte)
            .single();

          let parteId = existingPart?.id;

          if (!parteId) {
            // Create the part
            const { data: newPart, error: partError } = await supabase
              .from('partes')
              .insert({
                programa_id: realProgramId,
                titulo: designacao.titulo_parte,
                duracao_min: designacao.tempo_minutos,
                ordem: designacao.numero_parte,
                secao: 'ministerio',
                requer_assistente: !!designacao.id_ajudante
              })
              .select()
              .single();

            if (partError) {
              console.error('Error creating part:', partError);
              return;
            }
            parteId = newPart?.id;
          }

          if (!parteId) {
            console.error('Failed to create or find part');
            return;
          }

          // Map to database schema (using correct field names)
          const dbDesignacao = {
            parte_id: parteId,
            estudante_id: designacao.id_estudante,
            assistente_id: designacao.id_ajudante,
            data_designacao: designacao.data_inicio_semana,
            status: 'designado' as const,
            observacoes: `Parte ${designacao.numero_parte}: ${designacao.tipo_parte}`
          };

          const { error: insertError } = await supabase
            .from('designacoes')
            .insert(dbDesignacao);

          if (insertError) {
            console.error('Error saving assignment:', insertError);
          }
        });

        await Promise.all(insertPromises);

        // Also save to assignment_history for tracking
        const historyPromises = result.designacoes.map(async (designacao) => {
          const historyRecord = {
            student_id: designacao.id_estudante,
            assignment_type: designacao.tipo_parte,
            assignment_title: designacao.titulo_parte,
            assignment_duration: designacao.tempo_minutos,
            week: designacao.data_inicio_semana,
            meeting_date: designacao.data_inicio_semana,
            assistant_id: designacao.id_ajudante,
            status: 'confirmed',
            student_name: activeStudents.find(s => s.id === designacao.id_estudante)?.nome || '',
            assistant_name: designacao.id_ajudante 
              ? activeStudents.find(s => s.id === designacao.id_ajudante)?.nome 
              : null
          };

          const { error: historyError } = await supabase
            .from('assignment_history')
            .insert(historyRecord);

          if (historyError) {
            console.error('Error saving assignment history:', historyError);
          }
        });

        await Promise.all(historyPromises);
      }

      setLastResult(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar designações';
      console.error('Error generating assignments:', err);
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [
    activeProgram,
    getActiveStudents,
    getStudentQualifications,
    loadAssignmentHistory,
    loadFamilyRelationships,
    parseProgramParts
  ]);

  return {
    generateAssignments: generate,
    isGenerating,
    error,
    lastResult
  };
}
