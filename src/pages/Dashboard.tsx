// @ts-nocheck
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
  Plus
} from "lucide-react";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { useNavigate } from "react-router-dom";
import { useEstudantes } from "@/hooks/useEstudantes";
import { useDesignacoesPendentes } from "@/hooks/useDesignacoesPendentes";
import { useAssignmentContext } from "@/contexts/AssignmentContext";
import { useStudentContext } from "@/contexts/StudentContext";
import { useProgramContext } from "@/contexts/ProgramContext";
import { StatsCard } from "@/components/common/StatsCard";

const Dashboard = () => {
  const navigate = useNavigate();

  const { estudantes, isLoading: estudantesLoading } = useEstudantes();
  const { stats: designacoesStats, isLoading: designacoesLoading } = useDesignacoesPendentes();
  const { assignments } = useAssignmentContext();
  const { getAvailableStudents } = useStudentContext();
  const { programs, activeProgram } = useProgramContext();
  
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
        {/* Consolidated statistics cards using reusable StatsCard component */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Estudantes"
            value={stats.totalEstudantes}
            description="Cadastrados no sistema"
            icon={Users}
          />
          
          <StatsCard
            title="Estudantes Disponíveis"
            value={stats.availableStudents}
            description="Disponíveis para designações"
            icon={CheckCircle}
            iconColor="text-green-600"
            valueColor="text-green-600"
          />
          
          <StatsCard
            title="Próximas Designações"
            value={stats.upcomingAssignments}
            description="Nas próximas semanas"
            icon={ClipboardList}
            iconColor="text-blue-600"
            valueColor="text-blue-600"
          />
          
          <StatsCard
            title="Programas Ativos"
            value={programs.filter(p => p.isActive).length}
            description={activeProgram ? activeProgram.title : 'Nenhum programa ativo'}
            icon={Calendar}
            iconColor="text-purple-600"
            valueColor="text-purple-600"
          />
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
                  {assignments
                    .filter(a => {
                      const assignmentDate = new Date(a.weekDate);
                      const today = new Date();
                      const twoWeeksFromNow = new Date();
                      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
                      return assignmentDate >= today && assignmentDate <= twoWeeksFromNow;
                    })
                    .slice(0, 3)
                    .map((assignment, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{assignment.partTitle}</p>
                          <p className="text-sm text-gray-600">
                            {assignment.studentName} - {new Date(assignment.weekDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant="outline">{assignment.duration || 5} min</Badge>
                      </div>
                    ))}
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
                    {estudantes?.filter((e: any) => e.talk && e.ativo).length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Com Qualificações</span>
                  <Badge variant="outline">
                    {estudantes?.filter((e: any) => 
                      e.ativo && (e.chairman || e.pray || e.treasures || e.reading || 
                      e.starting || e.following || e.making || e.talk)
                    ).length || 0}
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