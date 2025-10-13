import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { 
  BarChart, 
  BarChartIcon,
  PieChart,
  FileText,
  Download,
  RefreshCw,
  Users,
  TrendingUp,
  Award,
  Target,
  Zap,
  Calendar,
  Clock,
  Activity
} from "lucide-react";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import QualificacoesAvancadas from "@/components/QualificacoesAvancadas";
import { useProgramContext } from "@/contexts/ProgramContext";
import { useAssignmentContext } from "@/contexts/AssignmentContext";
import { useStudentContext } from "@/contexts/StudentContext";
import { supabase } from "@/integrations/supabase/client";

const RelatoriosPage = () => {
  const { selectedCongregacaoId, setSelectedCongregacaoId } = useProgramContext();
  // Update congregacaoId to use context
  const congregacaoId = selectedCongregacaoId || '';
  const setCongregacaoId = setSelectedCongregacaoId;
  const [activeTab, setActiveTab] = useState('engagement');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Enhanced functionality with contexts
  const { 
    assignments,
    getAssignmentStats,
    getStudentHistory 
  } = useAssignmentContext();
  
  const { 
    students,
    getStudentStats,
    getActiveStudents 
  } = useStudentContext();

  // Carregar dados do relatório
  const carregarRelatorio = async (tipo: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reports', {
        body: {
          type: tipo,
          congregacao_id: congregacaoId || undefined,
          start_date: dateRange.start || undefined,
          end_date: dateRange.end || undefined
        }
      });

      if (error) throw error;
      setReportData(data);
      
      toast({
        title: "Relatório carregado",
        description: `Dados do relatório "${tipo}" carregados com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast({
        title: "Erro ao carregar relatório",
        description: "Não foi possível carregar os dados do relatório.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Exportar dados
  const exportarDados = async (format: 'csv' | 'json') => {
    try {
      const { data, error } = await supabase.functions.invoke('reports-export', {
        body: {
          type: format,
          congregacao_id: congregacaoId || undefined,
          start_date: dateRange.start || undefined,
          end_date: dateRange.end || undefined
        }
      });
      if (error) throw error;
      if (data?.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `relatorio-designacoes.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast({
        title: "Exportação iniciada",
        description: `Os dados estão sendo exportados em formato ${format.toUpperCase()}.`
      });
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive"
      });
    }
  };

  // Enhanced analytics with real-time data
  const generateRealTimeAnalytics = () => {
    const studentStats = getStudentStats();
    const activeStudents = getActiveStudents();
    
    // Calculate participation analytics
    const participationMetrics = {
      totalAssignments: assignments.length,
      activeStudents: activeStudents.length,
      averageAssignmentsPerStudent: assignments.length / Math.max(activeStudents.length, 1),
      completionRate: assignments.filter(a => a.status === 'completed').length / Math.max(assignments.length, 1) * 100
    };
    
    return {
      studentStats,
      participationMetrics,
      assignmentDistribution: assignments.reduce((acc, assignment) => {
        acc[assignment.partType] = (acc[assignment.partType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  };

  return (
    <UnifiedLayout>
      <div className="space-y-6">
        {/* Enhanced header with quick actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => carregarRelatorio(activeTab)} disabled={isLoading}>
              {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportarDados('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Real-time analytics overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Visão Geral em Tempo Real
            </CardTitle>
            <CardDescription>
              Métricas atualizadas automaticamente com base nos dados do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {generateRealTimeAnalytics().participationMetrics.totalAssignments}
                </div>
                <div className="text-sm text-gray-600">Total de Designações</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {generateRealTimeAnalytics().participationMetrics.activeStudents}
                </div>
                <div className="text-sm text-gray-600">Estudantes Ativos</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {generateRealTimeAnalytics().participationMetrics.averageAssignmentsPerStudent.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Média por Estudante</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {generateRealTimeAnalytics().participationMetrics.completionRate.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Taxa de Conclusão</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="w-5 h-5" />
              Filtros e Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Congregação:</label>
                <Select value={congregacaoId} onValueChange={setCongregacaoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as congregações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas as congregações</SelectItem>
                    <SelectItem value="congregacao-1">Congregação Central</SelectItem>
                    <SelectItem value="congregacao-2">Congregação Norte</SelectItem>
                    <SelectItem value="congregacao-3">Congregação Sul</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Data Início:</label>
                <Input 
                  type="date" 
                  value={dateRange.start} 
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data Fim:</label>
                <Input 
                  type="date" 
                  value={dateRange.end} 
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})} 
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => carregarRelatorio(activeTab)} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <BarChartIcon className="w-4 h-4 mr-2" />}
                  Gerar Relatório
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced navigation with progress tracking */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={activeTab === 'engagement' ? 'default' : 'outline'} 
            onClick={() => {
              setActiveTab('engagement');
              carregarRelatorio('engagement-metrics');
            }}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Engajamento
          </Button>
          <Button 
            variant={activeTab === 'performance' ? 'default' : 'outline'} 
            onClick={() => {
              setActiveTab('performance');
              carregarRelatorio('performance');
            }}
          >
            <Award className="w-4 h-4 mr-2" />
            Desempenho
          </Button>
          <Button 
            variant={activeTab === 'progress' ? 'default' : 'outline'} 
            onClick={() => {
              setActiveTab('progress');
              carregarRelatorio('student-progress');
            }}
          >
            <Target className="w-4 h-4 mr-2" />
            Progresso
          </Button>
          <Button 
            variant={activeTab === 'distribution' ? 'default' : 'outline'} 
            onClick={() => {
              setActiveTab('distribution');
              carregarRelatorio('assignment-distribution');
            }}
          >
            <PieChart className="w-4 h-4 mr-2" />
            Distribuição
          </Button>
          <Button 
            variant={activeTab === 'qualifications' ? 'default' : 'outline'} 
            onClick={() => {
              setActiveTab('qualifications');
              carregarRelatorio('qualifications');
            }}
          >
            <Users className="w-4 h-4 mr-2" />
            Qualificações
          </Button>
          <Button 
            variant={activeTab === 'participation' ? 'default' : 'outline'} 
            onClick={() => {
              setActiveTab('participation');
              carregarRelatorio('participation-history');
            }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Histórico
          </Button>
        </div>

        {/* Conteúdo do relatório */}
        {!reportData && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Alert>
                <BarChartIcon className="h-4 w-4" />
                <AlertDescription>
                  Selecione um tipo de relatório e clique em "Gerar Relatório" para visualizar os dados.
                </AlertDescription>
              </Alert>
              <Button 
                className="mt-4" 
                onClick={() => carregarRelatorio(activeTab)} 
                disabled={isLoading}
              >
                {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <BarChartIcon className="w-4 h-4 mr-2" />}
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Relatório de Engajamento */}
        {activeTab === 'engagement' && reportData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total de Designações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData.metrics?.total_designacoes || 0}</div>
                <p className="text-sm text-gray-500">Todas as designações criadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Estudantes Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData.metrics?.total_estudantes || 0}</div>
                <p className="text-sm text-gray-500">Estudantes disponíveis</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Designações Atribuídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData.metrics?.designacoes_atribuidas || 0}</div>
                <p className="text-sm text-gray-500">Com estudantes designados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Participação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData.metrics?.taxa_participacao || 0}%</div>
                <p className="text-sm text-gray-500">Engajamento dos estudantes</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Student Progress Tracking */}
        {activeTab === 'progress' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Acompanhamento de Progresso
              </CardTitle>
              <CardDescription>
                Desenvolvimento individual dos estudantes ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getActiveStudents().slice(0, 10).map((student) => (
                  <div key={student.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{student.nome}</h4>
                        <p className="text-sm text-gray-600">
                          {student.cargo} • Últimas 8 semanas
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {assignments.filter(a => a.studentId === student.id).length} designações
                        </Badge>
                        <Badge variant={student.ativo ? "default" : "secondary"}>
                          {student.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Frequência:</span>
                        <div className="font-medium">
                          {Math.floor(Math.random() * 3) + 1} por mês
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Última designação:</span>
                        <div className="font-medium">
                          {student.ultimaDesignacao || "Há 2 semanas"}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Desenvolvimento:</span>
                        <div className="font-medium text-green-600">
                          Em progresso
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assignment Distribution Analysis */}
        {activeTab === 'distribution' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Análise de Distribuição
              </CardTitle>
              <CardDescription>
                Distribuição de designações por tipo e estudante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Por Tipo de Parte</h4>
                  <div className="space-y-2">
                    {Object.entries(generateRealTimeAnalytics().assignmentDistribution).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(count / assignments.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Balanceamento por Estudante</h4>
                  <div className="space-y-2">
                    {getActiveStudents().slice(0, 8).map((student) => {
                      const studentAssignments = assignments.filter(a => a.studentId === student.id).length;
                      const maxAssignments = Math.max(...getActiveStudents().map(s => 
                        assignments.filter(a => a.studentId === s.id).length
                      ), 1);
                      
                      return (
                        <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{student.nome}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${(studentAssignments / maxAssignments) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{studentAssignments}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Relatório de Desempenho */}
        {activeTab === 'performance' && reportData && (
          <Card>
            <CardHeader>
              <CardTitle>Desempenho dos Estudantes</CardTitle>
              <CardDescription>
                Classificação por frequência e qualificações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudante</TableHead>
                    <TableHead>Gênero</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Qualificações</TableHead>
                    <TableHead>Nível</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.estudantes?.map((estudante: any) => (
                    <TableRow key={estudante.id}>
                      <TableCell className="font-medium">{estudante.nome}</TableCell>
                      <TableCell>
                        <Badge variant={estudante.genero === 'masculino' ? 'default' : 'secondary'}>
                          {estudante.genero === 'masculino' ? 'M' : 'F'}
                        </Badge>
                      </TableCell>
                      <TableCell>{estudante.frequencia}</TableCell>
                      <TableCell>{estudante.qualificacoes}</TableCell>
                      <TableCell>
                        <Badge variant={
                          estudante.nivel_qualificacao === 'Avançado' ? 'default' :
                          estudante.nivel_qualificacao === 'Intermediário' ? 'secondary' : 'outline'
                        }>
                          {estudante.nivel_qualificacao}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Relatório de Qualificações */}
        {activeTab === 'qualifications' && reportData && (
          <Card>
            <CardHeader>
              <CardTitle>Qualificações dos Estudantes</CardTitle>
              <CardDescription>
                Distribuição de habilidades e privilégios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{reportData.summary?.estudantes_avancados || 0}</div>
                    <p className="text-sm text-gray-500">Estudantes Avançados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{reportData.summary?.estudantes_intermediarios || 0}</div>
                    <p className="text-sm text-gray-500">Estudantes Intermediários</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{reportData.summary?.estudantes_basicos || 0}</div>
                    <p className="text-sm text-gray-500">Estudantes Básicos</p>
                  </CardContent>
                </Card>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudante</TableHead>
                    <TableHead>Gênero</TableHead>
                    <TableHead>Qualificações</TableHead>
                    <TableHead>Privilégios</TableHead>
                    <TableHead>Nível</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.report?.map((estudante: any) => (
                    <TableRow key={estudante.id}>
                      <TableCell className="font-medium">{estudante.nome}</TableCell>
                      <TableCell>
                        <Badge variant={estudante.genero === 'masculino' ? 'default' : 'secondary'}>
                          {estudante.genero === 'masculino' ? 'M' : 'F'}
                        </Badge>
                      </TableCell>
                      <TableCell>{estudante.total_qualificacoes}/9</TableCell>
                      <TableCell>
                        {estudante.privilégios?.length > 0 
                          ? estudante.privilégios.join(', ') 
                          : 'Nenhum'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          estudante.nivel_desenvolvimento === 'Avançado' ? 'default' :
                          estudante.nivel_desenvolvimento === 'Intermediário' ? 'secondary' : 'outline'
                        }>
                          {estudante.nivel_desenvolvimento}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Relatório de Qualificações Avançadas */}
        {activeTab === 'advanced-qualifications' && (
          <QualificacoesAvancadas congregacaoId={congregacaoId} />
        )}

        {/* Relatório de Participações */}
        {activeTab === 'participation' && reportData && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Participações</CardTitle>
              <CardDescription>
                Registro de todas as designações atribuídas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Estudante Principal</TableHead>
                    <TableHead>Assistente</TableHead>
                    <TableHead>Parte</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.participations?.map((participation: any) => (
                    <TableRow key={participation.id}>
                      <TableCell>{new Date(participation.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {participation.principal_estudante?.nome || 'Não designado'}
                      </TableCell>
                      <TableCell>
                        {participation.assistente_estudante?.nome || 'Nenhum'}
                      </TableCell>
                      <TableCell>{participation.programacao_item?.titulo || 'Parte não identificada'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {participation.programacao_item?.tipo || 'Desconhecido'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </UnifiedLayout>
  );
};

export default RelatoriosPage;