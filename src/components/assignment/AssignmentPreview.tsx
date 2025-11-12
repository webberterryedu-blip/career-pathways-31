// @ts-nocheck
/**
 * Assignment Preview Component
 * 
 * This component provides a comprehensive preview of generated assignments
 * with validation feedback and approval workflow.
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar,
  Clock,
  Users,
  User,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  Download,
  Share,
  Edit,
  Award,
  BarChart3
} from 'lucide-react';

import type { 
  DesignacaoGerada,
  EstatisticasDesignacao,
  ConflitosDesignacao
} from '@/types/designacoes';

import type { ValidationResult } from '@/services/assignmentValidator';
import type { EstudanteRow } from '@/types/estudantes';

interface AssignmentPreviewProps {
  assignments: DesignacaoGerada[];
  statistics: EstatisticasDesignacao;
  validationResult: ValidationResult;
  students: EstudanteRow[];
  weekDate: string;
  onApprove: () => void;
  onEdit: (assignmentIndex: number) => void;
  onReject: () => void;
  className?: string;
}

interface AssignmentWithStudents extends DesignacaoGerada {
  student: EstudanteRow;
  assistant?: EstudanteRow;
  validationIssues: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

export function AssignmentPreview({
  assignments,
  statistics,
  validationResult,
  students,
  weekDate,
  onApprove,
  onEdit,
  onReject,
  className = ''
}: AssignmentPreviewProps) {
  const [selectedView, setSelectedView] = useState<'list' | 'grid' | 'timeline'>('list');

  // Get student by ID
  const getStudent = (studentId: string) => {
    return students.find(s => s.id === studentId);
  };

  // Enrich assignments with student data and validation issues
  const enrichedAssignments: AssignmentWithStudents[] = useMemo(() => {
    return assignments.map((assignment, index) => {
      const student = getStudent(assignment.id_estudante);
      const assistant = assignment.id_ajudante ? getStudent(assignment.id_ajudante) : undefined;

      // Count validation issues for this assignment
      const assignmentErrors = validationResult.errors.filter(e => 
        e.studentId === assignment.id_estudante && e.partNumber === assignment.numero_parte
      );
      const assignmentWarnings = validationResult.warnings.filter(w => 
        w.studentId === assignment.id_estudante && w.partNumber === assignment.numero_parte
      );
      const assignmentInfos = validationResult.infos.filter(i => 
        i.studentId === assignment.id_estudante && i.partNumber === assignment.numero_parte
      );

      return {
        ...assignment,
        student: student!,
        assistant,
        validationIssues: {
          errors: assignmentErrors.length,
          warnings: assignmentWarnings.length,
          infos: assignmentInfos.length
        }
      };
    }).filter(a => a.student); // Filter out assignments with missing students
  }, [assignments, students, validationResult]);

  // Calculate quality metrics
  const qualityMetrics = useMemo(() => {
    const totalAssignments = enrichedAssignments.length;
    const assignmentsWithErrors = enrichedAssignments.filter(a => a.validationIssues.errors > 0).length;
    const assignmentsWithWarnings = enrichedAssignments.filter(a => a.validationIssues.warnings > 0).length;
    const familyPairs = enrichedAssignments.filter(a => a.assistant).length;
    
    return {
      errorRate: totalAssignments > 0 ? (assignmentsWithErrors / totalAssignments) * 100 : 0,
      warningRate: totalAssignments > 0 ? (assignmentsWithWarnings / totalAssignments) * 100 : 0,
      familyPairRate: totalAssignments > 0 ? (familyPairs / totalAssignments) * 100 : 0,
      overallScore: validationResult.score
    };
  }, [enrichedAssignments, validationResult.score]);

  // Get part type label
  const getPartTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'leitura_biblica': 'Bible Reading',
      'discurso': 'Talk',
      'demonstracao': 'Demonstration',
      'parte_ministerio': 'Ministry Part'
    };
    return labels[tipo] || tipo;
  };

  // Get validation status color
  const getValidationStatusColor = (issues: AssignmentWithStudents['validationIssues']) => {
    if (issues.errors > 0) return 'text-destructive';
    if (issues.warnings > 0) return 'text-amber-600';
    return 'text-green-600';
  };

  // Get validation status icon
  const getValidationStatusIcon = (issues: AssignmentWithStudents['validationIssues']) => {
    if (issues.errors > 0) return <AlertTriangle className="h-4 w-4" />;
    if (issues.warnings > 0) return <Info className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  // Render assignment card
  const renderAssignmentCard = (assignment: AssignmentWithStudents, index: number) => (
    <Card key={index} className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Part {assignment.numero_parte}: {assignment.titulo_parte}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {assignment.tempo_minutos} min
            </Badge>
            <div className={`flex items-center gap-1 ${getValidationStatusColor(assignment.validationIssues)}`}>
              {getValidationStatusIcon(assignment.validationIssues)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Main Student */}
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">{assignment.student.nome}</div>
              <div className="text-sm text-muted-foreground">
                {assignment.student.genero} • {assignment.student.cargo}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(index)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>

          {/* Assistant */}
          {assignment.assistant && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{assignment.assistant.nome}</div>
                  <div className="text-sm text-muted-foreground">
                    Assistant • {assignment.assistant.genero} • {assignment.assistant.cargo}
                  </div>
                </div>
                {/* Family indicator */}
                {assignment.student.familia_id === assignment.assistant.familia_id && (
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Family
                  </Badge>
                )}
              </div>
            </>
          )}

          {/* Part Details */}
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Type</div>
              <div className="font-medium">{getPartTypeLabel(assignment.tipo_parte)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Duration</div>
              <div className="font-medium">{assignment.tempo_minutos} minutes</div>
            </div>
          </div>

          {/* Validation Issues */}
          {(assignment.validationIssues.errors > 0 || assignment.validationIssues.warnings > 0) && (
            <>
              <Separator />
              <div className="space-y-1">
                {assignment.validationIssues.errors > 0 && (
                  <div className="text-sm text-destructive">
                    {assignment.validationIssues.errors} error{assignment.validationIssues.errors !== 1 ? 's' : ''}
                  </div>
                )}
                {assignment.validationIssues.warnings > 0 && (
                  <div className="text-sm text-amber-600">
                    {assignment.validationIssues.warnings} warning{assignment.validationIssues.warnings !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render statistics overview
  const renderStatistics = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{statistics.totalDesignacoes}</div>
          <div className="text-sm text-muted-foreground">Total Assignments</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{statistics.estudantesComAjudante}</div>
          <div className="text-sm text-muted-foreground">With Assistants</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{statistics.paresFamiliares}</div>
          <div className="text-sm text-muted-foreground">Family Pairs</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{Math.round(qualityMetrics.overallScore)}%</div>
          <div className="text-sm text-muted-foreground">Quality Score</div>
        </CardContent>
      </Card>
    </div>
  );

  // Render quality metrics
  const renderQualityMetrics = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Quality Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-destructive">
                {Math.round(qualityMetrics.errorRate)}%
              </div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-amber-600">
                {Math.round(qualityMetrics.warningRate)}%
              </div>
              <div className="text-sm text-muted-foreground">Warning Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {Math.round(qualityMetrics.familyPairRate)}%
              </div>
              <div className="text-sm text-muted-foreground">Family Pairs</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {Math.round(qualityMetrics.overallScore)}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </div>
          </div>

          {/* Distribution by Gender */}
          <Separator />
          <div>
            <div className="text-sm font-medium mb-2">Gender Distribution</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span>Male Students:</span>
                <span className="font-medium">{statistics.distribuicaoPorGenero.masculino}</span>
              </div>
              <div className="flex justify-between">
                <span>Female Students:</span>
                <span className="font-medium">{statistics.distribuicaoPorGenero.feminino}</span>
              </div>
            </div>
          </div>

          {/* Distribution by Position */}
          <Separator />
          <div>
            <div className="text-sm font-medium mb-2">Position Distribution</div>
            <div className="space-y-1">
              {Object.entries(statistics.distribuicaoPorCargo).map(([cargo, count]) => (
                <div key={cargo} className="flex justify-between text-sm">
                  <span className="capitalize">{cargo.replace('_', ' ')}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const hasErrors = validationResult.errors.length > 0;
  const hasWarnings = validationResult.warnings.length > 0;
  const canApprove = !hasErrors;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assignment Preview</h2>
          <p className="text-muted-foreground">
            Week of {new Date(weekDate).toLocaleDateString()} • {enrichedAssignments.length} assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      {renderStatistics()}

      {/* Validation Summary */}
      {(hasErrors || hasWarnings) && (
        <Alert variant={hasErrors ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {hasErrors && (
              <span className="text-destructive font-medium">
                {validationResult.errors.length} error{validationResult.errors.length !== 1 ? 's' : ''} found. 
              </span>
            )}
            {hasWarnings && (
              <span className="text-amber-600 font-medium">
                {validationResult.warnings.length} warning{validationResult.warnings.length !== 1 ? 's' : ''} detected.
              </span>
            )}
            {hasErrors ? ' Please resolve errors before approving.' : ' Review warnings before proceeding.'}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">
            <Eye className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          {/* View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={selectedView === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('list')}
              >
                List
              </Button>
              <Button
                variant={selectedView === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('grid')}
              >
                Grid
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {enrichedAssignments.length} assignment{enrichedAssignments.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Assignments Display */}
          <ScrollArea className="h-96">
            {selectedView === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrichedAssignments.map((assignment, index) => 
                  renderAssignmentCard(assignment, index)
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {enrichedAssignments.map((assignment, index) => 
                  renderAssignmentCard(assignment, index)
                )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="metrics">
          {renderQualityMetrics()}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onReject}>
          Reject & Regenerate
        </Button>
        
        <div className="flex items-center gap-2">
          {!canApprove && (
            <span className="text-sm text-muted-foreground">
              Resolve errors to approve
            </span>
          )}
          <Button 
            onClick={onApprove}
            disabled={!canApprove}
            className="min-w-32"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {canApprove ? 'Approve & Save' : 'Cannot Approve'}
          </Button>
        </div>
      </div>
    </div>
  );
}