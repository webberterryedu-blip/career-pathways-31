// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Download,
  Save,
  Zap,
  Target
} from "lucide-react";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { useEstudantes } from "@/hooks/useEstudantes";
import { useNavigate } from "react-router-dom";
import { useAssignmentContext } from "@/contexts/AssignmentContext";
import { useStudentContext } from "@/contexts/StudentContext";
import { useProgramContext } from "@/contexts/ProgramContext";
import { ProgramSelector } from "@/components/common/ProgramSelector";
import { useAssignmentGeneration } from "@/hooks/useAssignmentGeneration";

const DesignacoesPage = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const { estudantes } = useEstudantes();
  
  // Use centralized contexts - single source of truth
  const { 
    programs,
    selectedProgramId,
    setSelectedProgramId,
    activeProgram,
    loading: programsLoading
  } = useProgramContext();
  
  const { 
    assignments,
    loading: assignmentsLoading
  } = useAssignmentContext();
  
  const { 
    getActiveStudents,
    getQualifiedStudents
  } = useStudentContext();

  // Use S-38 assignment generation hook
  const { 
    generateAssignments: generateAssignmentsWithS38,
    isGenerating: isS38Generating,
    error: s38Error,
    lastResult: s38LastResult
  } = useAssignmentGeneration();

  const activeStudents = getActiveStudents();

  // Navigate to Programas if no program selected
  const handleLoadPrograms = () => {
    navigate('/programas');
    toast({
      title: "Carregar Programas",
      description: "Vá para a página de Programas para importar ou selecionar um programa semanal."
    });
  };

  const handleGenerateAssignments = async () => {
    if (!activeProgram) {
      toast({
        title: "Programa requerido",
        description: "Selecione um programa antes de gerar designações.",
        variant: "destructive"
      });
      return;
    }

    if (activeStudents.length === 0) {
      toast({
        title: "Estudantes requeridos",
        description: "Cadastre estudantes antes de gerar designações.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      toast({
        title: "Gerando Designações",
        description: "O sistema está criando as designações automaticamente seguindo as regras S-38...",
      });
      
      // Call the real S-38 assignment generation
      const result = await generateAssignmentsWithS38(activeProgram.id);
      
      if (!result) {
        throw new Error('Falha ao gerar designações');
      }

      if (!result.sucesso) {
        toast({
          title: "Designações Geradas com Avisos",
          description: `${result.designacoes.length} designações criadas. ${result.erros.length} erros encontrados.`,
          variant: "default"
        });
      } else {
        toast({
          title: "✅ Designações Geradas com Sucesso!",
          description: `${result.designacoes.length} designações criadas seguindo as regras S-38.`,
        });
      }

      // Show detailed statistics
      if (result.estatisticas) {
        setTimeout(() => {
          toast({
            title: "📊 Estatísticas da Geração",
            description: `
              Total: ${result.estatisticas.totalDesignacoes} designações
              Masculino: ${result.estatisticas.distribuicaoPorGenero.masculino}
              Feminino: ${result.estatisticas.distribuicaoPorGenero.feminino}
              Com Ajudante: ${result.estatisticas.estudantesComAjudante}
            `,
          });
        }, 2000);
      }

      // Show any errors or warnings
      if (result.erros.length > 0) {
        setTimeout(() => {
          toast({
            title: "⚠️ Avisos",
            description: result.erros.slice(0, 3).join('\n'),
            variant: "destructive"
          });
        }, 4000);
      }

      // Redirect to preview page after generation
      setTimeout(() => {
        navigate(`/designacoes/preview/${activeProgram.id}`);
      }, 5000);
      
    } catch (error) {
      toast({
        title: "Erro ao gerar designações",
        description: error instanceof Error ? error.message : "Não foi possível gerar as designações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <UnifiedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Designações</h1>
            <p className="text-muted-foreground">
              Gere e gerencie as designações da reunião ministerial
            </p>
          </div>
          <Button onClick={() => navigate('/programas')} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurar Programa
          </Button>
        </div>

        {/* Program Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Programa Selecionado</CardTitle>
            <CardDescription>
              Selecione o programa semanal para gerar designações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {programs.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum programa carregado. Importe um programa na página de Programas.
                </AlertDescription>
              </Alert>
            ) : (
              <ProgramSelector
                programs={programs.map(p => ({
                  id: p.id,
                  semana: p.title,
                  data_inicio: p.weekDate,
                  mes_ano: p.weekDate
                }))}
                selectedProgramId={selectedProgramId}
                onSelect={setSelectedProgramId}
                loading={programsLoading}
              />
            )}

            {activeProgram && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Programa Ativo</p>
                    <p className="text-sm text-green-700">{activeProgram.title}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estudantes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeStudents.length}</div>
              <p className="text-xs text-muted-foreground">Disponíveis para designações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Designações Criadas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignments.length}</div>
              <p className="text-xs text-muted-foreground">Total de designações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Programa Ativo</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProgram ? 'Sim' : 'Não'}</div>
              <p className="text-xs text-muted-foreground">
                {activeProgram ? activeProgram.title : 'Nenhum programa selecionado'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleLoadPrograms}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <Download className="w-8 h-8" />
                <span>Carregar Programas</span>
                <span className="text-xs text-muted-foreground">
                  Importar programa da reunião
                </span>
              </Button>

              <Button
                onClick={handleGenerateAssignments}
                disabled={!activeProgram || isGenerating || activeStudents.length === 0}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-8 h-8" />
                    <span>Gerar Designações</span>
                    <span className="text-xs opacity-80">
                      Automaticamente
                    </span>
                  </>
                )}
              </Button>
            </div>

            {!activeProgram && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Selecione um programa para começar a gerar designações.
                </AlertDescription>
              </Alert>
            )}

            {activeStudents.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Cadastre estudantes na página de Estudantes antes de gerar designações.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Assignment List */}
        {assignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Designações Recentes</CardTitle>
              <CardDescription>
                Visualize e gerencie as designações criadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {assignments.slice(0, 5).map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{assignment.partType}</p>
                      <p className="text-sm text-gray-600">
                        Semana: {assignment.weekDate}
                      </p>
                    </div>
                    <Badge variant={assignment.status === 'confirmed' ? 'default' : 'secondary'}>
                      {assignment.status}
                    </Badge>
                  </div>
                ))}
              </div>
              {assignments.length > 5 && (
                <Button variant="outline" className="w-full mt-4">
                  Ver todas ({assignments.length})
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </UnifiedLayout>
  );
};

export default DesignacoesPage;
