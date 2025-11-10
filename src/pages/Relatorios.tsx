import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Download, TrendingUp, Users, Award, Calendar } from 'lucide-react';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useEstudantes } from '@/hooks/useEstudantes';
import { useAssignmentContext } from '@/contexts/AssignmentContext';
import { toast } from 'sonner';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function Relatorios() {
  const { estudantes, isLoading } = useEstudantes();
  const { assignments } = useAssignmentContext();

  // Calculate real statistics from data
  const stats = useMemo(() => {
    if (!estudantes) return null;

    // Role distribution
    const roleDistribution = estudantes.reduce((acc: any, student: any) => {
      const role = student.cargo || 'publicador';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const roleData = Object.entries(roleDistribution).map(([name, value]) => ({
      name: name === 'anciao' ? 'Anciãos' : 
            name === 'servo_ministerial' ? 'Servos Ministeriais' :
            name === 'publicador_batizado' ? 'Publicadores Batizados' :
            name === 'pioneiro_regular' ? 'Pioneiros Regulares' : 'Publicadores',
      value
    }));

    // Gender distribution
    const genderData = [
      { name: 'Masculino', value: estudantes.filter((e: any) => e.genero === 'masculino').length },
      { name: 'Feminino', value: estudantes.filter((e: any) => e.genero === 'feminino').length }
    ];

    // Qualifications overview
    const qualifications = {
      chairman: estudantes.filter((e: any) => e.chairman).length,
      pray: estudantes.filter((e: any) => e.pray).length,
      treasures: estudantes.filter((e: any) => e.treasures).length,
      reading: estudantes.filter((e: any) => e.reading).length,
      starting: estudantes.filter((e: any) => e.starting).length,
      following: estudantes.filter((e: any) => e.following).length,
      making: estudantes.filter((e: any) => e.making).length,
      talk: estudantes.filter((e: any) => e.talk).length
    };

    const qualificationsData = [
      { name: 'Presidente', value: qualifications.chairman },
      { name: 'Oração', value: qualifications.pray },
      { name: 'Tesouros', value: qualifications.treasures },
      { name: 'Leitura', value: qualifications.reading },
      { name: 'Iniciando', value: qualifications.starting },
      { name: 'Revisitas', value: qualifications.following },
      { name: 'Discípulos', value: qualifications.making },
      { name: 'Discursos', value: qualifications.talk }
    ];

    // Assignment history (last 8 weeks)
    const last8Weeks = Array.from({ length: 8 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      return date.toISOString().split('T')[0];
    }).reverse();

    const assignmentTrend = last8Weeks.map(week => {
      const weekAssignments = assignments.filter(a => a.weekDate === week);
      return {
        week: new Date(week).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        designacoes: weekAssignments.length,
        estudantes: new Set(weekAssignments.map(a => a.studentId)).size
      };
    });

    return {
      roleData,
      genderData,
      qualificationsData,
      assignmentTrend,
      totalActive: estudantes.filter((e: any) => e.ativo).length,
      totalQualified: estudantes.filter((e: any) => 
        e.chairman || e.pray || e.treasures || e.reading || 
        e.starting || e.following || e.making || e.talk
      ).length
    };
  }, [estudantes, assignments]);

  const handleExportPDF = () => {
    toast.info('Exportação de PDF em desenvolvimento');
  };

  const handleExportExcel = () => {
    toast.info('Exportação de Excel em desenvolvimento');
  };

  if (isLoading) {
    return (
      <UnifiedLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando relatórios...</p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  if (!stats) {
    return (
      <UnifiedLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="space-y-6">
        {/* Header with export actions */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Relatórios e Análises</h1>
            <p className="text-muted-foreground mt-1">
              Visualize estatísticas e tendências de designações
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Estudantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estudantes?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalActive} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualificados</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQualified}</div>
              <p className="text-xs text-muted-foreground">
                Com pelo menos 1 qualificação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Designações (8 sem)</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.assignmentTrend.reduce((sum, week) => sum + week.designacoes, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Últimas 8 semanas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participação</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((stats.totalQualified / (estudantes?.length || 1)) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa de qualificação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts section */}
        <Tabs defaultValue="distribuicao" className="space-y-4">
          <TabsList>
            <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
            <TabsTrigger value="qualificacoes">Qualificações</TabsTrigger>
            <TabsTrigger value="tendencias">Tendências</TabsTrigger>
          </TabsList>

          <TabsContent value="distribuicao" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Role distribution pie chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Privilégio</CardTitle>
                  <CardDescription>
                    Quantidade de estudantes por privilégio ministerial
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.roleData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.roleData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gender distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Gênero</CardTitle>
                  <CardDescription>
                    Proporção entre estudantes masculinos e femininos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.genderData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.genderData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="qualificacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Qualificações dos Estudantes</CardTitle>
                <CardDescription>
                  Número de estudantes qualificados para cada tipo de parte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={stats.qualificationsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Estudantes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tendencias" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Designações</CardTitle>
                <CardDescription>
                  Histórico das últimas 8 semanas de reuniões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={stats.assignmentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="designacoes" 
                      stroke="hsl(var(--primary))" 
                      name="Designações"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="estudantes" 
                      stroke="hsl(var(--secondary))" 
                      name="Estudantes Participantes"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedLayout>
  );
}
