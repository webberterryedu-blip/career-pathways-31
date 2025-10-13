import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  BookOpen, 
  ClipboardList, 
  BarChart2, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Plus,
  ArrowRight
} from "lucide-react";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { useNavigate } from "react-router-dom";
import { useEstudantes } from "@/hooks/useEstudantes";
import { useDesignacoesPendentes } from "@/hooks/useDesignacoesPendentes";
import { useAssignmentContext } from "@/contexts/AssignmentContext";
import { useStudentContext } from "@/contexts/StudentContext";

const Dashboard = () => {
  const navigate = useNavigate();

  const { estudantes, isLoading: estudantesLoading } = useEstudantes();
  const { stats: designacoesStats, isLoading: designacoesLoading } = useDesignacoesPendentes();
  const { assignments } = useAssignmentContext();
  const { getAvailableStudents } = useStudentContext();
  
  // Enhanced statistics with assignment overview and student status
  const stats = useMemo(() => {
    const total = estudantes?.length || 0;
    const ativos = estudantes?.filter((e: any) => e.ativo)?.length || 0;
    
    // Get upcoming assignments for next 2 weeks
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const weekAfter = new Date();
    weekAfter.setDate(weekAfter.getDate() + 14);
    
    const upcomingAssignments = assignments.filter(a => {
      const assignmentDate = new Date(a.weekDate);
      return assignmentDate >= new Date() && assignmentDate <= weekAfter;
    });
    
    // Get available students for next week
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    const availableStudents = getAvailableStudents(nextWeekStr);
    
    return {
      totalEstudantes: total,
      estudantesAtivos: ativos,
      designacoesPendentes: designacoesStats.pendentes,
      proximaReuniao: "2025-07-07",
      upcomingAssignments: upcomingAssignments.length,
      availableStudents: availableStudents.length
    };
  }, [estudantes, designacoesStats.pendentes, assignments, getAvailableStudents]);

  return (
    <UnifiedLayout>
      <div className="space-y-6">
        {/* Enhanced statistics cards with assignment overview and student status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Estudantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEstudantes}</div>
              <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estudantes Disponíveis</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.availableStudents}</div>
              <p className="text-xs text-muted-foreground">Disponíveis para designações</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximas Designações</CardTitle>
              <ClipboardList className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.upcomingAssignments}</div>
              <p className="text-xs text-muted-foreground">Nas próximas semanas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próxima Reunião</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">12/12</div>
              <p className="text-xs text-muted-foreground">Quinta-feira</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced quick actions with centralized dashboard functionality */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesso direto às principais funcionalidades do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/estudantes')}
              >
                <Users className="w-8 h-8" />
                <span>Gerenciar Estudantes</span>
                <Badge variant="secondary" className="text-xs">
                  {stats.estudantesAtivos} ativos
                </Badge>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/programas')}
              >
                <BookOpen className="w-8 h-8" />
                <span>Importar Programa</span>
                <Badge variant="secondary" className="text-xs">
                  Semanal
                </Badge>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/designacoes')}
              >
                <ClipboardList className="w-8 h-8" />
                <span>Gerar Designações</span>
                <Badge variant="secondary" className="text-xs">
                  {stats.upcomingAssignments} próximas
                </Badge>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/relatorios')}
              >
                <BarChart2 className="w-8 h-8" />
                <span>Ver Relatórios</span>
                <Badge variant="secondary" className="text-xs">
                  Analytics
                </Badge>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Próximas Designações
              </CardTitle>
              <CardDescription>
                Designações programadas para as próximas semanas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.upcomingAssignments > 0 ? (
                <div className="space-y-3">
                  {/* Mock upcoming assignments - in real implementation, this would come from context */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Leitura da Bíblia</p>
                      <p className="text-sm text-gray-600">João Silva - 12/12/2024</p>
                    </div>
                    <Badge variant="outline">4 min</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Iniciando Conversas</p>
                      <p className="text-sm text-gray-600">Maria Santos - 12/12/2024</p>
                    </div>
                    <Badge variant="outline">3 min</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/designacoes')}>
                    Ver todas as designações
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Nenhuma designação programada</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/designacoes')}>
                    Gerar Designações
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Status dos Estudantes
              </CardTitle>
              <CardDescription>
                Disponibilidade e qualificações dos estudantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Disponíveis</span>
                  <Badge variant="default">{stats.availableStudents}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Ativos</span>
                  <Badge variant="secondary">{stats.estudantesAtivos}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Qualificados para Discursos</span>
                  <Badge variant="outline">
                    {Math.floor(stats.estudantesAtivos * 0.6)} {/* Mock calculation */}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/estudantes')}>
                  Gerenciar Estudantes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default Dashboard;