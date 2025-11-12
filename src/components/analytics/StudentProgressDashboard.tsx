// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';
import { 
  Search, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertCircle,
  BarChart3,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import StudentProgressTracker from './StudentProgressTracker';
import { toast } from '@/hooks/use-toast';

type Student = Tables<'estudantes'>;

interface StudentProgressDashboardProps {
  className?: string;
}

const StudentProgressDashboard: React.FC<StudentProgressDashboardProps> = ({ className }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'assignments' | 'recent'>('name');
  const [isLoading, setIsLoading] = useState(true);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('estudantes')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;

      setStudents(data || []);
      setFilteredStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: "Erro ao carregar estudantes",
        description: "Não foi possível carregar a lista de estudantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    let filtered = students.filter(student =>
      student.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort students
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.nome.localeCompare(b.nome);
        case 'assignments':
          return (b.contador_designacoes || 0) - (a.contador_designacoes || 0);
        case 'recent':
          const aDate = a.ultima_designacao ? new Date(a.ultima_designacao) : new Date(0);
          const bDate = b.ultima_designacao ? new Date(b.ultima_designacao) : new Date(0);
          return bDate.getTime() - aDate.getTime();
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  }, [students, searchTerm, sortBy]);

  const getStudentStatus = (student: Student) => {
    const assignmentCount = student.contador_designacoes || 0;
    const lastAssignment = student.ultima_designacao;
    
    if (assignmentCount === 0) {
      return { status: 'new', label: 'Novo', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (lastAssignment) {
      const daysSinceLastAssignment = Math.floor(
        (Date.now() - new Date(lastAssignment).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastAssignment > 90) {
        return { status: 'inactive', label: 'Inativo', color: 'bg-red-100 text-red-800' };
      } else if (daysSinceLastAssignment > 30) {
        return { status: 'needs_attention', label: 'Precisa atenção', color: 'bg-yellow-100 text-yellow-800' };
      }
    }
    
    if (assignmentCount >= 10) {
      return { status: 'experienced', label: 'Experiente', color: 'bg-green-100 text-green-800' };
    } else if (assignmentCount >= 5) {
      return { status: 'developing', label: 'Em desenvolvimento', color: 'bg-purple-100 text-purple-800' };
    }
    
    return { status: 'beginner', label: 'Iniciante', color: 'bg-gray-100 text-gray-800' };
  };

  const getProgressTrend = (student: Student) => {
    // This would ideally come from analytics, but for now we'll use a simple heuristic
    const assignmentCount = student.contador_designacoes || 0;
    const lastAssignment = student.ultima_designacao;
    
    if (!lastAssignment) return 'stable';
    
    const daysSinceLastAssignment = Math.floor(
      (Date.now() - new Date(lastAssignment).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastAssignment <= 14 && assignmentCount >= 3) return 'improving';
    if (daysSinceLastAssignment > 60) return 'declining';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  if (selectedStudent) {
    return (
      <div className={className}>
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedStudent(null)}
            className="mb-4"
          >
            ← Voltar à lista
          </Button>
        </div>
        <StudentProgressTracker studentId={selectedStudent} />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Progresso dos Estudantes</h2>
          <p className="text-muted-foreground">
            Acompanhe o desenvolvimento e progresso de cada estudante
          </p>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar estudante..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex-1">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="assignments">Número de designações</SelectItem>
                    <SelectItem value="recent">Última designação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Estudantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredStudents.length} visíveis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estudantes Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter(s => {
                  const lastAssignment = s.ultima_designacao;
                  if (!lastAssignment) return false;
                  const daysSince = Math.floor((Date.now() - new Date(lastAssignment).getTime()) / (1000 * 60 * 60 * 24));
                  return daysSince <= 30;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                últimos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precisam Atenção</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter(s => {
                  const status = getStudentStatus(s);
                  return status.status === 'needs_attention' || status.status === 'inactive';
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                estudantes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Experientes</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter(s => getStudentStatus(s).status === 'experienced').length}
              </div>
              <p className="text-xs text-muted-foreground">
                10+ designações
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Estudantes</CardTitle>
            <CardDescription>
              Clique em um estudante para ver seu progresso detalhado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando estudantes...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum estudante encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Não há estudantes cadastrados.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((student) => {
                  const status = getStudentStatus(student);
                  const trend = getProgressTrend(student);
                  
                  return (
                    <Card 
                      key={student.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedStudent(student.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              <AvatarInitials name={student.nome} />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{student.nome}</h4>
                              {getTrendIcon(trend)}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`text-xs ${status.color}`}>
                                {status.label}
                              </Badge>
                              {student.genero && (
                                <Badge variant="outline" className="text-xs">
                                  {student.genero === 'M' ? 'Masculino' : 'Feminino'}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>
                                <strong>Designações:</strong> {student.contador_designacoes || 0}
                              </div>
                              {student.ultima_designacao && (
                                <div>
                                  <strong>Última:</strong>{' '}
                                  {new Date(student.ultima_designacao).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                              {student.cargo && (
                                <div>
                                  <strong>Cargo:</strong> {student.cargo}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentProgressDashboard;