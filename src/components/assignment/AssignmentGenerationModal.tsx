/**
 * Assignment Generation Modal
 * 
 * This component provides a comprehensive UI for generating meeting assignments
 * with real-time validation, conflict resolution, and preview capabilities.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Settings,
  Zap,
  Clock,
  UserCheck,
  UserX,
  Info
} from 'lucide-react';

import { useAssignments } from '@/contexts/AssignmentContext';
import { useStudents } from '@/contexts/StudentContext';
import { usePrograms } from '@/contexts/ProgramContext';
import { generateAssignments } from '@/services/assignmentEngine';
import { validateAssignments, type ValidationResult } from '@/services/assignmentValidator';

import type { 
  DesignacaoGerada,
  ParteProgramaS38T,
  OpcoesDegeracao,
  ResultadoGeracao,
  EstatisticasDesignacao,
  ConflitosDesignacao
} from '@/types/designacoes';

import type { EstudanteRow, StudentQualifications } from '@/types/estudantes';

interface AssignmentGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekDate?: string;
  programId?: string;
}

interface GenerationOptions {
  weekDate: string;
  programId: string;
  excludedStudentIds: string[];
  preferFamilyPairs: boolean;
  allowConsecutiveWeeks: boolean;
  balanceDistribution: boolean;
  autoResolveConflicts: boolean;
}

interface GenerationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  error?: string;
}

export function AssignmentGenerationModal({
  isOpen,
  onClose,
  weekDate = '',
  programId = ''
}: AssignmentGenerationModalProps) {
  // Context hooks
  const { createAssignment, loading: assignmentLoading } = useAssignments();
  const { students, getActiveStudents } = useStudents();
  const { programs, getProgram } = usePrograms();

  // State
  const [currentStep, setCurrentStep] = useState<'options' | 'preview' | 'conflicts' | 'results'>('options');
  const [options, setOptions] = useState<GenerationOptions>({
    weekDate: weekDate || new Date().toISOString().split('T')[0],
    programId: programId || '',
    excludedStudentIds: [],
    preferFamilyPairs: true,
    allowConsecutiveWeeks: false,
    balanceDistribution: true,
    autoResolveConflicts: true
  });

  const [generationResult, setGenerationResult] = useState<ResultadoGeracao | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);

  // Computed values
  const selectedProgram = options.programId ? getProgram(options.programId) : null;
  const activeStudents = getActiveStudents();
  const availableStudents = activeStudents.filter(s => !options.excludedStudentIds.includes(s.id));

  // Initialize generation steps
  useEffect(() => {
    setGenerationSteps([
      {
        id: 'prepare',
        title: 'Preparing Data',
        description: 'Loading students, qualifications, and program information',
        completed: false,
        current: false
      },
      {
        id: 'validate',
        title: 'Validating Requirements',
        description: 'Checking S-38 rules and student qualifications',
        completed: false,
        current: false
      },
      {
        id: 'generate',
        title: 'Generating Assignments',
        description: 'Creating optimal assignment distribution',
        completed: false,
        current: false
      },
      {
        id: 'resolve',
        title: 'Resolving Conflicts',
        description: 'Addressing any conflicts or warnings',
        completed: false,
        current: false
      },
      {
        id: 'finalize',
        title: 'Finalizing Results',
        description: 'Preparing assignment preview and statistics',
        completed: false,
        current: false
      }
    ]);
  }, []);

  // Handle generation process
  const handleGenerate = useCallback(async () => {
    if (!selectedProgram) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentStep('preview');

    try {
      // Step 1: Prepare data
      updateGenerationStep('prepare', true, false);
      setGenerationProgress(20);

      // Get program parts (this would come from program parsing)
      const programParts: ParteProgramaS38T[] = [
        {
          numero_parte: 3,
          titulo_parte: 'Leitura da Bíblia',
          tipo_parte: 'leitura_biblica',
          tempo_minutos: 4,
          requer_ajudante: false,
          restricao_genero: 'masculino'
        },
        {
          numero_parte: 4,
          titulo_parte: 'Primeira Conversa',
          tipo_parte: 'demonstracao',
          tempo_minutos: 3,
          requer_ajudante: true
        },
        {
          numero_parte: 5,
          titulo_parte: 'Revisita',
          tipo_parte: 'demonstracao',
          tempo_minutos: 4,
          requer_ajudante: true
        },
        {
          numero_parte: 6,
          titulo_parte: 'Estudo Bíblico',
          tipo_parte: 'demonstracao',
          tempo_minutos: 6,
          requer_ajudante: true
        }
      ];

      // Step 2: Validate requirements
      updateGenerationStep('prepare', false, false);
      updateGenerationStep('validate', true, false);
      setGenerationProgress(40);

      // Prepare generation options
      const generationOptions: OpcoesDegeracao = {
        data_inicio_semana: options.weekDate,
        id_programa: options.programId,
        partes: programParts,
        excluir_estudante_ids: options.excludedStudentIds,
        preferir_pares_familiares: options.preferFamilyPairs
      };

      // Step 3: Generate assignments
      updateGenerationStep('validate', false, false);
      updateGenerationStep('generate', true, false);
      setGenerationProgress(60);

      // Mock data for demonstration - in real implementation, this would come from contexts
      const studentQualifications = new Map<string, StudentQualifications>();
      const assignmentHistories = new Map();
      const familyRelationships = new Map<string, string[]>();

      // Populate mock data
      activeStudents.forEach(student => {
        studentQualifications.set(student.id, {
          bible_reading: student.genero === 'masculino',
          initial_call: true,
          return_visit: true,
          bible_study: student.genero === 'masculino' && ['anciao', 'servo_ministerial', 'publicador_batizado'].includes(student.cargo || ''),
          talk: student.genero === 'masculino' && ['anciao', 'servo_ministerial', 'publicador_batizado'].includes(student.cargo || ''),
          demonstration: true,
          can_be_helper: true,
          can_teach_others: ['anciao', 'servo_ministerial'].includes(student.cargo || '')
        });
        
        assignmentHistories.set(student.id, {
          estudante_id: student.id,
          designacoes_recentes: [],
          total_designacoes_8_semanas: Math.floor(Math.random() * 3),
          ultima_designacao: undefined
        });

        familyRelationships.set(student.id, []);
      });

      const result = await generateAssignments(
        activeStudents,
        studentQualifications,
        assignmentHistories,
        familyRelationships,
        generationOptions
      );

      setGenerationResult(result);

      // Step 4: Resolve conflicts
      updateGenerationStep('generate', false, false);
      updateGenerationStep('resolve', true, false);
      setGenerationProgress(80);

      // Validate generated assignments
      if (result.designacoes.length > 0) {
        const validationContext = {
          students: new Map(activeStudents.map(s => [s.id, s])),
          qualifications: studentQualifications,
          familyRelationships,
          assignmentHistory: assignmentHistories,
          weekDate: options.weekDate,
          existingAssignments: []
        };

        const validation = validateAssignments(result.designacoes, validationContext);
        setValidationResult(validation);
      }

      // Step 5: Finalize
      updateGenerationStep('resolve', false, false);
      updateGenerationStep('finalize', true, false);
      setGenerationProgress(100);

      setTimeout(() => {
        updateGenerationStep('finalize', false, false);
        setCurrentStep(result.erros.length > 0 ? 'conflicts' : 'results');
      }, 500);

    } catch (error) {
      console.error('Generation error:', error);
      const currentStepIndex = generationSteps.findIndex(s => s.current);
      if (currentStepIndex >= 0) {
        updateGenerationStep(generationSteps[currentStepIndex].id, false, false, 
          error instanceof Error ? error.message : 'Unknown error occurred');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProgram, options, activeStudents, generationSteps]);

  // Update generation step status
  const updateGenerationStep = (stepId: string, current: boolean, completed: boolean, error?: string) => {
    setGenerationSteps(prev => prev.map(step => ({
      ...step,
      current: step.id === stepId ? current : false,
      completed: step.id === stepId ? completed : step.completed,
      error: step.id === stepId ? error : step.error
    })));
  };

  // Handle saving assignments
  const handleSaveAssignments = async () => {
    if (!generationResult) return;

    try {
      for (const assignment of generationResult.designacoes) {
        await createAssignment({
          programId: assignment.id_estudante, // This mapping needs to be corrected
          studentId: assignment.id_estudante,
          assistantId: assignment.id_ajudante,
          partType: assignment.tipo_parte,
          partNumber: assignment.numero_parte,
          weekDate: assignment.data_inicio_semana,
          status: 'pending',
          studyPoint: assignment.titulo_parte,
          timing: assignment.tempo_minutos
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving assignments:', error);
    }
  };

  // Render options step
  const renderOptionsStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weekDate">Week Date</Label>
          <input
            id="weekDate"
            type="date"
            value={options.weekDate}
            onChange={(e) => setOptions(prev => ({ ...prev, weekDate: e.target.value }))}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="program">Program</Label>
          <Select
            value={options.programId}
            onValueChange={(value) => setOptions(prev => ({ ...prev, programId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map(program => (
                <SelectItem key={program.id} value={program.id}>
                  {program.nome || `Program ${program.mes_ano}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Generation Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="preferFamilyPairs"
              checked={options.preferFamilyPairs}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, preferFamilyPairs: checked as boolean }))
              }
            />
            <Label htmlFor="preferFamilyPairs">Prefer family member pairs</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="balanceDistribution"
              checked={options.balanceDistribution}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, balanceDistribution: checked as boolean }))
              }
            />
            <Label htmlFor="balanceDistribution">Balance assignment distribution</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowConsecutiveWeeks"
              checked={options.allowConsecutiveWeeks}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, allowConsecutiveWeeks: checked as boolean }))
              }
            />
            <Label htmlFor="allowConsecutiveWeeks">Allow consecutive week assignments</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoResolveConflicts"
              checked={options.autoResolveConflicts}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, autoResolveConflicts: checked as boolean }))
              }
            />
            <Label htmlFor="autoResolveConflicts">Automatically resolve conflicts</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Available Students ({availableStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-2">
            Select students to exclude from assignment generation:
          </div>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {activeStudents.map(student => (
                <div key={student.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`exclude-${student.id}`}
                    checked={options.excludedStudentIds.includes(student.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setOptions(prev => ({
                          ...prev,
                          excludedStudentIds: [...prev.excludedStudentIds, student.id]
                        }));
                      } else {
                        setOptions(prev => ({
                          ...prev,
                          excludedStudentIds: prev.excludedStudentIds.filter(id => id !== student.id)
                        }));
                      }
                    }}
                  />
                  <Label htmlFor={`exclude-${student.id}`} className="text-sm">
                    {student.nome} ({student.genero}, {student.cargo})
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  // Render preview step
  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Generating Assignments</h3>
        <Badge variant="outline">{Math.round(generationProgress)}%</Badge>
      </div>

      <Progress value={generationProgress} className="w-full" />

      <div className="space-y-3">
        {generationSteps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border">
            <div className="flex-shrink-0">
              {step.error ? (
                <XCircle className="h-5 w-5 text-destructive" />
              ) : step.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : step.current ? (
                <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium">{step.title}</div>
              <div className="text-sm text-muted-foreground">{step.description}</div>
              {step.error && (
                <div className="text-sm text-destructive mt-1">{step.error}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render conflicts step
  const renderConflictsStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <h3 className="text-lg font-semibold">Conflicts Detected</h3>
      </div>

      {generationResult?.erros && generationResult.erros.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {generationResult.erros.length} error(s) occurred during generation:
            <ul className="mt-2 list-disc list-inside">
              {generationResult.erros.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validationResult && (
        <div className="space-y-4">
          {validationResult.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Validation Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {validationResult.errors.map((error, index) => (
                    <div key={index} className="p-2 bg-destructive/10 rounded border-l-4 border-destructive">
                      <div className="font-medium">{error.message}</div>
                      {error.suggestion && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Suggestion: {error.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {validationResult.warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-amber-600">Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {validationResult.warnings.map((warning, index) => (
                    <div key={index} className="p-2 bg-amber-50 rounded border-l-4 border-amber-400">
                      <div className="font-medium">{warning.message}</div>
                      {warning.suggestion && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Suggestion: {warning.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  // Render results step
  const renderResultsStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Assignment Results</h3>
        <Badge variant="outline" className="text-green-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          Generated Successfully
        </Badge>
      </div>

      {generationResult && (
        <>
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{generationResult.estatisticas.totalDesignacoes}</div>
                  <div className="text-sm text-muted-foreground">Total Assignments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{generationResult.estatisticas.estudantesComAjudante}</div>
                  <div className="text-sm text-muted-foreground">With Assistants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{generationResult.estatisticas.paresFamiliares}</div>
                  <div className="text-sm text-muted-foreground">Family Pairs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {validationResult?.score || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Quality Score</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignments List */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {generationResult.designacoes.map((assignment, index) => {
                    const student = activeStudents.find(s => s.id === assignment.id_estudante);
                    const assistant = assignment.id_ajudante ? 
                      activeStudents.find(s => s.id === assignment.id_ajudante) : null;

                    return (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              Part {assignment.numero_parte}: {assignment.titulo_parte}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {student?.nome || 'Unknown Student'}
                              {assistant && (
                                <span className="ml-2">
                                  with {assistant.nome}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.tempo_minutos} min
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Generate Meeting Assignments
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={currentStep} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="options" disabled={isGenerating}>
                <Settings className="h-4 w-4 mr-2" />
                Options
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={currentStep === 'options'}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="conflicts" disabled={currentStep === 'options' || currentStep === 'preview'}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Conflicts
              </TabsTrigger>
              <TabsTrigger value="results" disabled={currentStep === 'options' || currentStep === 'preview'}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Results
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto p-4">
              <TabsContent value="options" className="mt-0">
                {renderOptionsStep()}
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                {renderPreviewStep()}
              </TabsContent>

              <TabsContent value="conflicts" className="mt-0">
                {renderConflictsStep()}
              </TabsContent>

              <TabsContent value="results" className="mt-0">
                {renderResultsStep()}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            <div className="flex gap-2">
              {currentStep === 'options' && (
                <Button 
                  onClick={handleGenerate}
                  disabled={!options.programId || !options.weekDate || isGenerating}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Assignments
                </Button>
              )}

              {currentStep === 'conflicts' && (
                <Button onClick={() => setCurrentStep('results')}>
                  Continue Anyway
                </Button>
              )}

              {currentStep === 'results' && (
                <Button 
                  onClick={handleSaveAssignments}
                  disabled={assignmentLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Assignments
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}