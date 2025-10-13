import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Target, Award, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PerformanceMetrics {
  studentId: string;
  studentName: string;
  totalAssignments: number;
  averageRating: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  commonStrengths: string[];
  commonWeaknesses: string[];
  timingAccuracy: number; // percentage
  lastAssignmentDate: Date;
  nextRecommendedAssignment: string;
  skillAreas: {
    preparation: number;
    delivery: number;
    timing: number;
    interaction: number;
    application: number;
  };
}

interface AssignmentPerformanceAnalyticsProps {
  studentId?: string;
  timeRange?: 'month' | 'quarter' | 'year' | 'all';
  className?: string;
}

/**
 * AssignmentPerformanceAnalytics - Provides detailed performance analytics
 * Shows trends, strengths, weaknesses, and improvement suggestions
 */
export default function AssignmentPerformanceAnalytics({
  studentId,
  timeRange = 'quarter',
  className
}: AssignmentPerformanceAnalyticsProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>(studentId || '');
  const [loading, setLoading] = useState(false);

  // Mock data - in real implementation, this would come from the database
  const mockMetrics: PerformanceMetrics[] = [
    {
      studentId: '1',
      studentName: 'João Silva',
      totalAssignments: 12,
      averageRating: 4.2,
      improvementTrend: 'improving',
      commonStrengths: ['Boa preparação', 'Voz clara', 'Aplicação prática'],
      commonWeaknesses: ['Contato visual', 'Timing'],
      timingAccuracy: 85,
      lastAssignmentDate: new Date('2024-01-15'),
      nextRecommendedAssignment: 'Explicando suas Crenças',
      skillAreas: {
        preparation: 90,
        delivery: 75,
        timing: 60,
        interaction: 80,
        application: 85
      }
    },
    {
      studentId: '2',
      studentName: 'Maria Santos',
      totalAssignments: 8,
      averageRating: 3.8,
      improvementTrend: 'stable',
      commonStrengths: ['Interação natural', 'Postura confiante'],
      commonWeaknesses: ['Preparação', 'Uso das Escrituras'],
      timingAccuracy: 92,
      lastAssignmentDate: new Date('2024-01-10'),
      nextRecommendedAssignment: 'Iniciando Conversas',
      skillAreas: {
        preparation: 65,
        delivery: 85,
        timing: 95,
        interaction: 90,
        application: 70
      }
    }
  ];

  useEffect(() => {
    setMetrics(mockMetrics);
    if (!selectedStudent && mockMetrics.length > 0) {
      setSelectedStudent(mockMetrics[0].studentId);
    }
  }, []);

  const selectedMetrics = metrics.find(m => m.studentId === selectedStudent);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'declining':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'Melhorando';
      case 'declining':
        return 'Precisa atenção';
      default:
        return 'Estável';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSkillColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRecommendations = (metrics: PerformanceMetrics) => {
    const recommendations = [];

    // Based on skill areas
    if (metrics.skillAreas.preparation < 70) {
      recommendations.push({
        type: 'improvement',
        title: 'Melhorar Preparação',
        description: 'Dedique mais tempo ao estudo prévio do material e organize melhor os pontos principais.',
        priority: 'high'
      });
    }

    if (metrics.skillAreas.timing < 70) {
      recommendations.push({
        type: 'improvement',
        title: 'Trabalhar o Timing',
        description: 'Pratique em casa cronometrando suas apresentações para melhorar o controle do tempo.',
        priority: 'medium'
      });
    }

    if (metrics.skillAreas.interaction < 70) {
      recommendations.push({
        type: 'improvement',
        title: 'Melhorar Interação',
        description: 'Trabalhe mais a interação natural com o ajudante e o contato visual.',
        priority: 'medium'
      });
    }

    // Based on trends
    if (metrics.improvementTrend === 'declining') {
      recommendations.push({
        type: 'attention',
        title: 'Atenção Necessária',
        description: 'O desempenho tem mostrado declínio. Considere sessões de treinamento adicional.',
        priority: 'high'
      });
    }

    // Based on assignment frequency
    const daysSinceLastAssignment = Math.floor(
      (new Date().getTime() - metrics.lastAssignmentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastAssignment > 60) {
      recommendations.push({
        type: 'scheduling',
        title: 'Agendar Nova Designação',
        description: 'Já faz mais de 2 meses desde a última designação. Considere agendar uma nova.',
        priority: 'medium'
      });
    }

    // Positive reinforcement
    if (metrics.averageRating >= 4.0 && metrics.improvementTrend === 'improving') {
      recommendations.push({
        type: 'recognition',
        title: 'Excelente Progresso',
        description: 'Continue o ótimo trabalho! Considere designações mais desafiadoras.',
        priority: 'low'
      });
    }

    return recommendations;
  };

  if (!selectedMetrics) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">Selecione um estudante para ver as análises</p>
        </CardContent>
      </Card>
    );
  }

  const recommendations = getRecommendations(selectedMetrics);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análise de Desempenho
            </CardTitle>
            <CardDescription>
              Métricas detalhadas e sugestões de melhoria
            </CardDescription>
          </div>
          
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar estudante" />
            </SelectTrigger>
            <SelectContent>
              {metrics.map((metric) => (
                <SelectItem key={metric.studentId} value={metric.studentId}>
                  {metric.studentName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="skills">Habilidades</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {selectedMetrics.totalAssignments}
                </div>
                <div className="text-sm text-gray-600">Designações</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${getRatingColor(selectedMetrics.averageRating)}`}>
                  {selectedMetrics.averageRating.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Média Geral</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedMetrics.timingAccuracy}%
                </div>
                <div className="text-sm text-gray-600">Precisão Tempo</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {getTrendIcon(selectedMetrics.improvementTrend)}
                  <span className="text-sm font-medium">
                    {getTrendLabel(selectedMetrics.improvementTrend)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">Tendência</div>
              </div>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-green-500" />
                  Pontos Fortes
                </h4>
                <div className="space-y-2">
                  {selectedMetrics.commonStrengths.map((strength, index) => (
                    <Badge key={index} className="bg-green-100 text-green-800 mr-2 mb-2">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  Áreas para Melhoria
                </h4>
                <div className="space-y-2">
                  {selectedMetrics.commonWeaknesses.map((weakness, index) => (
                    <Badge key={index} className="bg-orange-100 text-orange-800 mr-2 mb-2">
                      {weakness}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Next Assignment Recommendation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Próxima Designação Recomendada</h4>
              <p className="text-blue-700">{selectedMetrics.nextRecommendedAssignment}</p>
              <p className="text-sm text-blue-600 mt-1">
                Baseado no histórico e áreas de desenvolvimento
              </p>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div className="space-y-4">
              {Object.entries(selectedMetrics.skillAreas).map(([skill, score]) => (
                <div key={skill} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {skill === 'preparation' && 'Preparação'}
                      {skill === 'delivery' && 'Apresentação'}
                      {skill === 'timing' && 'Controle de Tempo'}
                      {skill === 'interaction' && 'Interação'}
                      {skill === 'application' && 'Aplicação Prática'}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{score}%</span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              ))}
            </div>

            {/* Skill Analysis */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Análise de Habilidades</h4>
              <div className="text-sm text-gray-600 space-y-1">
                {Object.entries(selectedMetrics.skillAreas).map(([skill, score]) => {
                  if (score >= 85) {
                    return (
                      <p key={skill} className="text-green-600">
                        ✓ <strong className="capitalize">{skill}</strong>: Excelente desempenho
                      </p>
                    );
                  } else if (score < 70) {
                    return (
                      <p key={skill} className="text-red-600">
                        ⚠ <strong className="capitalize">{skill}</strong>: Precisa de atenção
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  rec.priority === 'high' 
                    ? 'bg-red-50 border-red-200' 
                    : rec.priority === 'medium'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {rec.type === 'attention' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {rec.type === 'improvement' && <Target className="h-4 w-4 text-orange-500" />}
                    {rec.type === 'scheduling' && <BarChart3 className="h-4 w-4 text-blue-500" />}
                    {rec.type === 'recognition' && <Award className="h-4 w-4 text-green-500" />}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    
                    <Badge 
                      className={`mt-2 ${
                        rec.priority === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : rec.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      Prioridade: {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}

            {recommendations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Excelente! Nenhuma recomendação específica no momento.</p>
                <p className="text-sm mt-1">Continue o ótimo trabalho!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}