import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Award, 
  Target, 
  Calendar,
  BookOpen,
  Users,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { 
  analyticsEngine, 
  StudentProgressMetrics,
  DateRange as AnalyticsDateRange
} from '@/services/analyticsEngine';
import { toast } from '@/hooks/use-toast';

interface StudentProgressTrackerProps {
  studentId?: string;
  className?: string;
}

const StudentProgressTracker: React.FC<StudentProgressTrackerProps> = ({ 
  studentId, 
  className 
}) => {
  const [progressData, setProgressData] = useState<StudentProgressMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'3months' | '6months' | '1year'>('6months');

  const loadStudentProgress = async (id: string) => {
    setIsLoading(true);
    try {
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const dateRange: AnalyticsDateRange = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };

      const progress = await analyticsEngine.calculateStudentProgress(id, dateRange);
      setProgressData(progress);
    } catch (error) {
      console.error('Error loading student progress:', error);
      toast({
        title: "Erro ao carregar progresso",
        description: "Não foi possível carregar os dados de progresso do estudante.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      loadStudentProgress(studentId);
    }
  }, [studentId, selectedPeriod]);

  if (!studentId) {
    return (
      <Card className={className}>
        <CardContent className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Selecione um Estudante</h3>
          <p className="text-muted-foreground">
            Escolha um estudante para visualizar seu progresso e desenvolvimento.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados de progresso...</p>
        </CardContent>
      </Card>
    );
  }

  if (!progressData) {
    return (
      <Card className={className}>
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Dados não encontrados</h3>
          <p className="text-muted-foreground">
            Não foi possível carregar os dados de progresso para este estudante.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Transform assignment history for charts
  const assignmentTrendData = progressData.assignmentHistory
    .slice(0, 10)
    .reverse()
    .map((assignment, index) => ({
      assignment: `#${index + 1}`,
      date: new Date(assignment.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      performance: assignment.performanceScore || 50,
      duration: assignment.duration || 0
    }));

  // Transform skill progression for radar chart
  const skillData = progressData.skillProgression.map(skill => ({
    skill: skill.skill.charAt(0).toUpperCase() + skill.skill.slice(1),
    current: skill.currentLevel,
    previous: skill.previousLevel,
    trend: skill.improvementTrend
  }));

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'declining':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const chartConfig = {
    performance: {
      label: "Desempenho",
      color: "hsl(var(--chart-1))",
    },
    duration: {
      label: "Duração (min)",
      color: "hsl(var(--chart-2))",
    },
    current: {
      label: "Nível Atual",
      color: "hsl(var(--chart-3))",
    },
    previous: {
      label: "Nível Anterior",
      color: "hsl(var(--chart-4))",
    },
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback>
                <AvatarInitials name={progressData.studentName} />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{progressData.studentName}</h2>
              <p className="text-muted-foreground">Progresso e Desenvolvimento</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === '3months' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('3months')}
            >
              3 meses
            </Button>
            <Button
              variant={selectedPeriod === '6months' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('6months')}
            >
              6 meses
            </Button>
            <Button
              variant={selectedPeriod === '1year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('1year')}
            >
              1 ano
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Designações</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progressData.assignmentHistory.length}</div>
              <p className="text-xs text-muted-foreground">
                no período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Desempenho Médio</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  progressData.assignmentHistory.reduce((sum, a) => sum + (a.performanceScore || 50), 0) / 
                  Math.max(progressData.assignmentHistory.length, 1)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                pontuação média
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Habilidades em Melhoria</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progressData.skillProgression.filter(s => s.improvementTrend === 'improving').length}
              </div>
              <p className="text-xs text-muted-foreground">
                de {progressData.skillProgression.length} habilidades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próxima Recomendação</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {progressData.nextRecommendedAssignment ? 
                  progressData.nextRecommendedAssignment.replace('_', ' ').toUpperCase() : 
                  'Nenhuma'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                tipo de designação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">Desempenho</TabsTrigger>
            <TabsTrigger value="skills">Habilidades</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Desempenho</CardTitle>
                  <CardDescription>
                    Evolução da pontuação de desempenho nas últimas designações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <LineChart data={assignmentTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="assignment" />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="performance" 
                        stroke="var(--color-performance)" 
                        strokeWidth={3}
                        dot={{ fill: "var(--color-performance)", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Duração das Apresentações</CardTitle>
                  <CardDescription>
                    Tempo gasto em cada designação (em minutos)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <BarChart data={assignmentTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="assignment" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="duration" fill="var(--color-duration)" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Progressão de Habilidades</CardTitle>
                  <CardDescription>
                    Comparação entre níveis atual e anterior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <BarChart data={skillData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="skill" type="category" width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="previous" fill="var(--color-previous)" />
                      <Bar dataKey="current" fill="var(--color-current)" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status das Habilidades</CardTitle>
                  <CardDescription>
                    Tendência de desenvolvimento por habilidade
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {progressData.skillProgression.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTrendIcon(skill.improvementTrend)}
                        <div>
                          <p className="font-medium capitalize">{skill.skill}</p>
                          <p className="text-sm text-muted-foreground">
                            {skill.previousLevel} → {skill.currentLevel}
                          </p>
                        </div>
                      </div>
                      <Badge className={getTrendColor(skill.improvementTrend)}>
                        {skill.improvementTrend === 'improving' ? 'Melhorando' :
                         skill.improvementTrend === 'declining' ? 'Precisa atenção' : 'Estável'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Designações</CardTitle>
                <CardDescription>
                  Todas as designações no período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progressData.assignmentHistory.map((assignment, index) => (
                    <div key={assignment.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {progressData.assignmentHistory.length - index}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{assignment.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {assignment.partType.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(assignment.date).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {assignment.counselNotes && (
                          <p className="text-sm bg-muted p-2 rounded">
                            <strong>Conselho:</strong> {assignment.counselNotes}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {assignment.duration && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <Clock className="w-3 h-3" />
                            {assignment.duration} min
                          </div>
                        )}
                        {assignment.performanceScore && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium">{assignment.performanceScore}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-500" />
                    Pontos Fortes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {progressData.strengths.length > 0 ? (
                    <div className="space-y-2">
                      {progressData.strengths.map((strength, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm capitalize">{strength}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Continue participando para identificar seus pontos fortes.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-500" />
                    Áreas para Melhoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {progressData.improvementAreas.length > 0 ? (
                    <div className="space-y-2">
                      {progressData.improvementAreas.map((area, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm capitalize">{area}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Excelente! Não foram identificadas áreas específicas para melhoria.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {progressData.nextRecommendedAssignment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Próxima Designação Recomendada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      Com base no seu histórico e desenvolvimento, recomendamos uma designação do tipo{' '}
                      <strong>{progressData.nextRecommendedAssignment.replace('_', ' ').toUpperCase()}</strong>.
                      Isso ajudará a diversificar sua experiência e continuar seu crescimento.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentProgressTracker;