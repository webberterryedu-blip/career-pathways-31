/**
 * Conflict Resolution Panel
 * 
 * This component provides an interface for resolving assignment conflicts
 * with suggestions and automated resolution options.
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  Lightbulb,
  ChevronRight,
  Info
} from 'lucide-react';

import type { 
  ConflitosDesignacao,
  DesignacaoGerada
} from '@/types/designacoes';

import type { ValidationResult, ValidationError } from '@/services/assignmentValidator';
import type { EstudanteRow } from '@/types/estudantes';

interface ConflictResolutionPanelProps {
  conflicts: ConflitosDesignacao[];
  validationResult: ValidationResult;
  assignments: DesignacaoGerada[];
  students: EstudanteRow[];
  onResolveConflict: (conflictIndex: number, resolution: ConflictResolution) => void;
  onAutoResolve: () => void;
  className?: string;
}

interface ConflictResolution {
  type: 'replace_student' | 'replace_assistant' | 'swap_assignments' | 'remove_assignment' | 'ignore';
  newStudentId?: string;
  newAssistantId?: string;
  swapWithIndex?: number;
  reason?: string;
}

interface ConflictSuggestion {
  type: ConflictResolution['type'];
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  details?: string;
  newStudentId?: string;
  newAssistantId?: string;
}

export function ConflictResolutionPanel({
  conflicts,
  validationResult,
  assignments,
  students,
  onResolveConflict,
  onAutoResolve,
  className = ''
}: ConflictResolutionPanelProps) {
  const [selectedConflict, setSelectedConflict] = useState<number | null>(null);
  const [resolutionInProgress, setResolutionInProgress] = useState<Set<number>>(new Set());

  // Get student by ID
  const getStudent = useCallback((studentId: string) => {
    return students.find(s => s.id === studentId);
  }, [students]);

  // Generate suggestions for a conflict
  const generateSuggestions = useCallback((conflict: ConflitosDesignacao, conflictIndex: number): ConflictSuggestion[] => {
    const suggestions: ConflictSuggestion[] = [];
    const assignment = assignments.find(a => 
      a.id_estudante === conflict.estudante_id && a.numero_parte === conflict.numero_parte
    );

    if (!assignment) return suggestions;

    const student = getStudent(conflict.estudante_id);
    if (!student) return suggestions;

    switch (conflict.tipo) {
      case 'sobrecarga':
        // Suggest replacing with less loaded students
        const availableStudents = students.filter(s => 
          s.ativo && 
          s.id !== conflict.estudante_id &&
          s.genero === student.genero && // Same gender for simplicity
          !assignments.some(a => a.id_estudante === s.id) // Not already assigned
        );

        availableStudents.slice(0, 3).forEach(altStudent => {
          suggestions.push({
            type: 'replace_student',
            description: `Replace with ${altStudent.nome}`,
            impact: 'medium',
            confidence: 75,
            details: `${altStudent.nome} has fewer recent assignments`,
            newStudentId: altStudent.id
          });
        });

        suggestions.push({
          type: 'remove_assignment',
          description: 'Remove this assignment',
          impact: 'high',
          confidence: 50,
          details: 'This will leave the part unassigned'
        });
        break;

      case 'inelegibilidade':
        // Suggest qualified replacements
        const qualifiedStudents = students.filter(s => 
          s.ativo && 
          s.id !== conflict.estudante_id &&
          !assignments.some(a => a.id_estudante === s.id)
        );

        // Filter by part requirements
        const eligibleStudents = qualifiedStudents.filter(s => {
          if (assignment.tipo_parte === 'leitura_biblica') {
            return s.genero === 'masculino';
          }
          if (assignment.tipo_parte === 'discurso') {
            return s.genero === 'masculino' && 
                   ['anciao', 'servo_ministerial', 'publicador_batizado'].includes(s.cargo || '');
          }
          return true;
        });

        eligibleStudents.slice(0, 3).forEach(altStudent => {
          suggestions.push({
            type: 'replace_student',
            description: `Replace with ${altStudent.nome}`,
            impact: 'low',
            confidence: 90,
            details: `${altStudent.nome} meets all requirements for this part`,
            newStudentId: altStudent.id
          });
        });
        break;

      case 'pareamento_invalido':
        // Suggest valid assistants
        const validAssistants = students.filter(s => 
          s.ativo && 
          s.id !== conflict.estudante_id &&
          s.id !== assignment.id_ajudante &&
          !assignments.some(a => a.id_estudante === s.id || a.id_ajudante === s.id)
        );

        // Prefer same gender
        const sameGenderAssistants = validAssistants.filter(s => s.genero === student.genero);
        
        sameGenderAssistants.slice(0, 2).forEach(assistant => {
          suggestions.push({
            type: 'replace_assistant',
            description: `Replace assistant with ${assistant.nome}`,
            impact: 'low',
            confidence: 85,
            details: `${assistant.nome} is the same gender and available`,
            newAssistantId: assistant.id
          });
        });

        suggestions.push({
          type: 'remove_assignment',
          description: 'Remove assistant requirement',
          impact: 'medium',
          confidence: 60,
          details: 'Convert to a talk format if possible'
        });
        break;

      case 'falta_ajudante':
        // Suggest available assistants
        const availableAssistants = students.filter(s => 
          s.ativo && 
          s.id !== conflict.estudante_id &&
          !assignments.some(a => a.id_estudante === s.id || a.id_ajudante === s.id)
        );

        // Prefer same gender or family members
        const preferredAssistants = availableAssistants.filter(s => 
          s.genero === student.genero // In real implementation, also check family relationships
        );

        preferredAssistants.slice(0, 3).forEach(assistant => {
          suggestions.push({
            type: 'replace_assistant',
            description: `Assign ${assistant.nome} as assistant`,
            impact: 'low',
            confidence: 80,
            details: `${assistant.nome} is available and suitable`,
            newAssistantId: assistant.id
          });
        });
        break;
    }

    // Always offer ignore option for warnings
    if (conflict.tipo !== 'inelegibilidade') {
      suggestions.push({
        type: 'ignore',
        description: 'Accept this conflict',
        impact: 'low',
        confidence: 30,
        details: 'Proceed with the assignment despite the conflict'
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }, [assignments, students, getStudent]);

  // Handle conflict resolution
  const handleResolveConflict = async (conflictIndex: number, resolution: ConflictResolution) => {
    setResolutionInProgress(prev => new Set(prev).add(conflictIndex));
    
    try {
      await onResolveConflict(conflictIndex, resolution);
    } finally {
      setResolutionInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(conflictIndex);
        return newSet;
      });
    }
  };

  // Get severity color
  const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return 'text-destructive';
      case 'warning': return 'text-amber-600';
      case 'info': return 'text-blue-600';
      default: return 'text-muted-foreground';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  // Get impact color
  const getImpactColor = (impact: 'low' | 'medium' | 'high') => {
    switch (impact) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-amber-600';
      case 'high': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const hasErrors = validationResult.errors.length > 0;
  const hasWarnings = validationResult.warnings.length > 0;
  const totalIssues = validationResult.errors.length + validationResult.warnings.length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Conflict Resolution
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={hasErrors ? 'destructive' : hasWarnings ? 'secondary' : 'outline'}>
                {totalIssues} issue{totalIssues !== 1 ? 's' : ''}
              </Badge>
              {totalIssues > 0 && (
                <Button size="sm" onClick={onAutoResolve}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Auto Resolve
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-destructive">{validationResult.errors.length}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{validationResult.warnings.length}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{validationResult.infos.length}</div>
              <div className="text-sm text-muted-foreground">Info</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      {totalIssues > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Issues Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {/* Errors */}
                {validationResult.errors.map((error, index) => (
                  <div key={`error-${index}`} className="p-3 border rounded-lg bg-destructive/5">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-destructive">{error.message}</div>
                        {error.suggestion && (
                          <div className="text-sm text-muted-foreground mt-1">
                            💡 {error.suggestion}
                          </div>
                        )}
                        {error.studentId && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Student: {getStudent(error.studentId)?.nome || error.studentId}
                            {error.partNumber && ` • Part ${error.partNumber}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Warnings */}
                {validationResult.warnings.map((warning, index) => (
                  <div key={`warning-${index}`} className="p-3 border rounded-lg bg-amber-50">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-amber-800">{warning.message}</div>
                        {warning.suggestion && (
                          <div className="text-sm text-muted-foreground mt-1">
                            💡 {warning.suggestion}
                          </div>
                        )}
                        {warning.studentId && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Student: {getStudent(warning.studentId)?.nome || warning.studentId}
                            {warning.partNumber && ` • Part ${warning.partNumber}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Conflicts with Suggestions */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conflict Resolution Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conflicts.map((conflict, conflictIndex) => {
                const suggestions = generateSuggestions(conflict, conflictIndex);
                const student = getStudent(conflict.estudante_id);
                const isResolving = resolutionInProgress.has(conflictIndex);

                return (
                  <div key={conflictIndex} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium">
                          Part {conflict.numero_parte} - {student?.nome || 'Unknown Student'}
                        </div>
                        <div className="text-sm text-muted-foreground">{conflict.descricao}</div>
                        {conflict.sugestao && (
                          <div className="text-sm text-blue-600 mt-1">💡 {conflict.sugestao}</div>
                        )}
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {conflict.tipo.replace('_', ' ')}
                      </Badge>
                    </div>

                    <Separator className="my-3" />

                    <div className="space-y-2">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Suggested Resolutions
                      </div>
                      
                      {suggestions.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          No automatic suggestions available for this conflict.
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {suggestions.map((suggestion, suggestionIndex) => (
                            <div key={suggestionIndex} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex-1">
                                <div className="text-sm font-medium">{suggestion.description}</div>
                                {suggestion.details && (
                                  <div className="text-xs text-muted-foreground">{suggestion.details}</div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" size="sm" className={getImpactColor(suggestion.impact)}>
                                    {suggestion.impact} impact
                                  </Badge>
                                  <Badge variant="outline" size="sm">
                                    {suggestion.confidence}% confidence
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isResolving}
                                onClick={() => handleResolveConflict(conflictIndex, {
                                  type: suggestion.type,
                                  newStudentId: suggestion.newStudentId,
                                  newAssistantId: suggestion.newAssistantId,
                                  reason: suggestion.description
                                })}
                              >
                                {isResolving ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    Apply
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </>
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No conflicts message */}
      {totalIssues === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            No conflicts detected! All assignments meet S-38 requirements and validation rules.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}