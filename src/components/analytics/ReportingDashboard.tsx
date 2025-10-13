import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '../ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Download, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { 
  analyticsEngine, 
  ParticipationMetrics, 
  AssignmentDistributionMetrics,
  DateRange as AnalyticsDateRange
} from '@/services/analyticsEngine';
import { ReportExporter } from '@/services/reportExporter';
import { toast } from '@/hooks/use-toast';

interface ReportingDashboardProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ReportingDashboard: React.FC<ReportingDashboardProps> = ({ className }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reportType, setReportType] = useState<string>('participation');
  const [isLoading, setIsLoading] = useState(false);
  const [participationData, setParticipationData] = useState<ParticipationMetrics[]>([]);
  const [distributionData, setDistributionData] = useState<AssignmentDistributionMetrics | null>(null);
  const [frequencyData, setFrequencyData] = useState<any>(null);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const analyticsDateRange: AnalyticsDateRange | undefined = dateRange ? {
        startDate: dateRange.from?.toISOString().split('T')[0] || '',
        endDate: dateRange.to?.toISOString().split('T')[0] || ''
      } : undefined;

      const [participation, distribution, frequency] = await Promise.all([
        analyticsEngine.calculateParticipationMetrics(analyticsDateRange),
        analyticsEngine.calculateAssignmentDistribution(analyticsDateRange),
        analyticsEngine.getAssignmentFrequencyAnalysis(analyticsDateRange)
      ]);

      setParticipationData(participation);
      setDistributionData(distribution);
      setFrequencyData(frequency);

      toast({
        title: "Relatório gerado com sucesso",
        description: "Os dados foram atualizados com as informações mais recentes.",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao processar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!participationData.length) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Gere um relatório primeiro antes de exportar.",
        variant: "destructive",
      });
      return;
    }

    const exportData = {
      participationData,
      distributionData,
      frequencyData,
      dateRange: dateRange ? {
        startDate: dateRange.from?.toISOString().split('T')[0] || '',
        endDate: dateRange.to?.toISOString().split('T')[0] || ''
      } : undefined
    };

    ReportExporter.saveHTMLReport(exportData);
    toast({
      title: "Relatório exportado",
      description: "O arquivo HTML foi salvo. Você pode convertê-lo para PDF usando seu navegador.",
    });
  };

  const exportToExcel = async () => {
    if (!participationData.length) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Gere um relatório primeiro antes de exportar.",
        variant: "destructive",
      });
      return;
    }

    const exportData = {
      participationData,
      distributionData,
      frequencyData,
      dateRange: dateRange ? {
        startDate: dateRange.from?.toISOString().split('T')[0] || '',
        endDate: dateRange.to?.toISOString().split('T')[0] || ''
      } : undefined
    };

    ReportExporter.exportToCSV(exportData);
    toast({
      title: "Dados exportados",
      description: "O arquivo CSV foi salvo e pode ser aberto no Excel.",
    });
  };

  // Transform data for charts
  const participationChartData = participationData.slice(0, 10).map(student => ({
    name: student.studentName.split(' ')[0], // First name only for chart
    assignments: student.totalAssignments,
    participationRate: student.participationRate,
    skillScore: student.skillDevelopmentScore
  }));

  const assignmentTypeData = participationData.length > 0 ? 
    Object.entries(
      participationData.reduce((acc, student) => {
        Object.entries(student.assignmentsByType).forEach(([type, count]) => {
          acc[type] = (acc[type] || 0) + count;
        });
        return acc;
      }, {} as Record<string, number>)
    ).map(([type, count]) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value: count
    })) : [];

  const monthlyTrendData = frequencyData ? 
    Object.entries(frequencyData.byMonth).map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      assignments: count
    })).sort((a, b) => a.month.localeCompare(b.month)) : [];

  const chartConfig = {
    assignments: {
      label: "Designações",
      color: "hsl(var(--chart-1))",
    },
    participationRate: {
      label: "Taxa de Participação (%)",
      color: "hsl(var(--chart-2))",
    },
    skillScore: {
      label: "Pontuação de Habilidade",
      color: "hsl(var(--chart-3))",
    },
  };

  return (
    <div className={className}>
      {/* Header and Controls */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard de Relatórios</h2>
            <p className="text-muted-foreground">
              Análise abrangente de participação e desempenho dos estudantes
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToPDF} variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button onClick={exportToExcel} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Filtros e Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Período</label>
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={setDateRange}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Tipo de Relatório</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="participation">Participação</SelectItem>
                    <SelectItem value="distribution">Distribuição</SelectItem>
                    <SelectItem value="progress">Progresso</SelectItem>
                    <SelectItem value="comprehensive">Abrangente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={generateReport} 
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="w-4 h-4 mr-2" />
                  )}
                  Gerar Relatório
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {distributionData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Estudantes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{distributionData.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  {distributionData.activeStudents} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Média de Designações</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{distributionData.averageAssignmentsPerStudent}</div>
                <p className="text-xs text-muted-foreground">
                  por estudante
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Equilíbrio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {distributionData.assignmentDistributionBalance}
                </div>
                <p className="text-xs text-muted-foreground">
                  {distributionData.assignmentDistributionBalance < 0.5 ? 'Excelente' : 
                   distributionData.assignmentDistributionBalance < 1.0 ? 'Bom' : 'Precisa melhorar'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertas</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {distributionData.underutilizedStudents.length + distributionData.overutilizedStudents.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  estudantes com desequilíbrio
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <Tabs defaultValue="participation" className="space-y-4">
          <TabsList>
            <TabsTrigger value="participation">Participação</TabsTrigger>
            <TabsTrigger value="distribution">Distribuição</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
          </TabsList>

          <TabsContent value="participation" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Estudantes por Designações</CardTitle>
                  <CardDescription>
                    Estudantes com maior número de designações no período
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <BarChart data={participationChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="assignments" fill="var(--color-assignments)" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Participação vs Habilidade</CardTitle>
                  <CardDescription>
                    Correlação entre participação e desenvolvimento de habilidades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <LineChart data={participationChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="participationRate" 
                        stroke="var(--color-participationRate)" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="skillScore" 
                        stroke="var(--color-skillScore)" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Tipo de Designação</CardTitle>
                  <CardDescription>
                    Proporção de cada tipo de designação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <PieChart>
                      <Pie
                        data={assignmentTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assignmentTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {distributionData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Alertas de Distribuição</CardTitle>
                    <CardDescription>
                      Estudantes que precisam de atenção
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {distributionData.underutilizedStudents.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Subutilizados:</strong> {distributionData.underutilizedStudents.length} estudantes 
                          com poucas designações
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {distributionData.overutilizedStudents.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Sobrecarregados:</strong> {distributionData.overutilizedStudents.length} estudantes 
                          com muitas designações
                        </AlertDescription>
                      </Alert>
                    )}

                    {distributionData.underutilizedStudents.length === 0 && 
                     distributionData.overutilizedStudents.length === 0 && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Distribuição equilibrada!</strong> Todos os estudantes têm uma carga 
                          adequada de designações.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendência Mensal de Designações</CardTitle>
                <CardDescription>
                  Evolução do número de designações ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="assignments" 
                      stroke="var(--color-assignments)" 
                      strokeWidth={3}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {!isLoading && participationData.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertDescription>
                  Nenhum dado encontrado para o período selecionado. 
                  Clique em "Gerar Relatório" para carregar os dados.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={generateReport} 
                className="mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <BarChart3 className="w-4 h-4 mr-2" />
                )}
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReportingDashboard;