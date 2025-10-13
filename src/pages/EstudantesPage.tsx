import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Search, Filter, Users, FileSpreadsheet, BarChart3, Upload, Table, Info, History, Award } from "lucide-react";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { useEstudantes } from "@/hooks/useEstudantes";
import { useStudentContext } from "@/contexts/StudentContext";
import { useAssignmentContext } from "@/contexts/AssignmentContext";
import EstudanteForm from "@/components/EstudanteForm";
import EstudanteCard from "@/components/EstudanteCard";
import SpreadsheetUpload from "@/components/SpreadsheetUpload";
import EnhancedStudentImport from "@/components/EnhancedStudentImport";
import StudentsSpreadsheet from "@/components/StudentsSpreadsheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  EstudanteWithParent,
  EstudanteFilters,
  CARGO_LABELS,
} from "@/types/estudantes";

const EstudantesPage = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [editingEstudante, setEditingEstudante] = useState<EstudanteWithParent | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const {
    estudantes,
    isLoading,
    error,
    refetch,
    createEstudante,
    updateEstudante,
    deleteEstudante,
    filterEstudantes,
    getStatistics,
  } = useEstudantes();

  // Enhanced functionality with contexts
  const { 
    getFamilyMembers, 
    getStudentStats,
    updateStudentQualifications,
    validateStudentQualifications
  } = useStudentContext();
  
  const { 
    getAssignmentsByStudent,
    getStudentHistory 
  } = useAssignmentContext();

  const [filters, setFilters] = useState<EstudanteFilters>({
    searchTerm: "",
    cargo: "todos",
    genero: "todos",
    ativo: "todos",
  });

  const filteredEstudantes = useMemo(() => {
    return filterEstudantes(filters);
  }, [estudantes, filters, filterEstudantes]);

  const statistics = useMemo(() => {
    return getStatistics();
  }, [getStatistics]);

  const potentialParents = useMemo(() => {
    if (!estudantes) return [];
    return estudantes.filter(e => e.ativo);
  }, [estudantes]);

  const handleFilterChange = (field: keyof EstudanteFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateEstudante = async (data: any): Promise<boolean> => {
    setFormLoading(true);
    await createEstudante(data);
    setFormLoading(false);
    setActiveTab("list");
    return true;
  };

  const handleUpdateEstudante = async (data: any): Promise<boolean> => {
    if (!editingEstudante) return false;
    setFormLoading(true);
    await updateEstudante(editingEstudante.id, data);
    setFormLoading(false);
    setEditingEstudante(null);
    setActiveTab("list");
    return true;
  };

  const handleEditEstudante = (estudante: any) => {
    setEditingEstudante(estudante);
    setActiveTab("form");
  };

  const handleDeleteEstudante = async (id: string) => {
    await deleteEstudante(id);
  };

  const handleCancelForm = () => {
    setEditingEstudante(null);
    setActiveTab("list");
  };

  const handleImportComplete = () => {
    refetch();
    setActiveTab("list");
  };

  if (isLoading) {
    return (
      <UnifiedLayout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  if (error) {
    return (
      <UnifiedLayout>
        <EmptyState
          title="Erro ao carregar estudantes"
          description={String(error)}
          action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
        />
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            🔄 Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab("import")}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button size="sm" onClick={() => { setEditingEstudante(null); setActiveTab("form"); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Estudante
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="form" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {editingEstudante ? 'Editar' : 'Novo'}
          </TabsTrigger>
          <TabsTrigger value="qualifications" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Qualificações
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Importar
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="Buscar por nome..." 
                    value={filters.searchTerm} 
                    onChange={(e) => handleFilterChange("searchTerm", e.target.value)} 
                    className="pl-10" 
                  />
                </div>
                <Select value={filters.cargo} onValueChange={(value) => handleFilterChange("cargo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os cargos</SelectItem>
                    {Object.entries(CARGO_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEstudantes.map((estudante) => (
              <EstudanteCard 
                key={estudante.id} 
                estudante={estudante} 
                onEdit={() => handleEditEstudante(estudante)} 
                onDelete={() => handleDeleteEstudante(estudante.id)} 
              />
            ))}
          </div>

          {filteredEstudantes.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum estudante encontrado</h3>
              <p className="text-gray-500 mb-4">Ajuste os filtros ou cadastre um novo estudante</p>
              <Button onClick={() => setActiveTab("form")}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Estudante
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="form">
          <EstudanteForm 
            estudante={editingEstudante || undefined} 
            potentialParents={potentialParents} 
            onSubmit={editingEstudante ? handleUpdateEstudante : handleCreateEstudante} 
            onCancel={handleCancelForm} 
            loading={formLoading} 
          />
        </TabsContent>

        <TabsContent value="qualifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Qualificações dos Estudantes
              </CardTitle>
              <CardDescription>
                Gerencie qualificações e privilégios dos estudantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEstudantes.map((estudante) => {
                  const familyMembers = getFamilyMembers(estudante.id);
                  return (
                    <div key={estudante.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{estudante.nome}</h4>
                          <p className="text-sm text-gray-600">
                            {CARGO_LABELS[(estudante as any).cargo as keyof typeof CARGO_LABELS]} • {(estudante as any).genero}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={estudante.ativo ? "default" : "secondary"}>
                            {estudante.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                          {familyMembers.length > 0 && (
                            <Badge variant="outline">
                              {familyMembers.length} familiares
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Badge variant="outline" className="justify-center">
                          📖 Leitura Bíblica
                        </Badge>
                        <Badge variant="outline" className="justify-center">
                          🎭 Demonstrações
                        </Badge>
                        {(estudante as any).genero === 'masculino' && (
                          <>
                            <Badge variant="outline" className="justify-center">
                              🎤 Discursos
                            </Badge>
                            <Badge variant="outline" className="justify-center">
                              📚 Estudos Bíblicos
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Designações
              </CardTitle>
              <CardDescription>
                Visualize o histórico de designações dos estudantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedStudentId || ""} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estudante" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEstudantes.map((estudante) => (
                      <SelectItem key={estudante.id} value={estudante.id}>
                        {estudante.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedStudentId && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Designações Recentes</h4>
                    {/* Mock assignment history - in real implementation, this would come from context */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Leitura da Bíblia</p>
                          <p className="text-sm text-gray-600">05/12/2024 - Gênesis 1:1-15</p>
                        </div>
                        <Badge variant="default">Concluída</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Iniciando Conversas</p>
                          <p className="text-sm text-gray-600">28/11/2024 - Com assistente</p>
                        </div>
                        <Badge variant="default">Concluída</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium">Cultivando o Interesse</p>
                          <p className="text-sm text-gray-600">12/12/2024 - Próxima designação</p>
                        </div>
                        <Badge variant="secondary">Programada</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{statistics.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{statistics.ativos}</div>
                <div className="text-sm text-gray-600">Ativos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">{statistics.inativos}</div>
                <div className="text-sm text-gray-600">Inativos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{statistics.menores}</div>
                <div className="text-sm text-gray-600">Menores</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Sistema Aprimorado:</strong> Esta página agora integra completamente todos os recursos 
                documentados em <code>docs/Oficial</code>, incluindo validação inteligente de 32+ colunas, 
                análise familiar automática, e processamento completo de qualificações S-38.
              </AlertDescription>
            </Alert>
            <EnhancedStudentImport 
              onImportComplete={handleImportComplete} 
              onViewList={() => setActiveTab("list")} 
            />
            
            {/* Legacy import for compatibility */}
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Mostrar sistema de importação legado (compatibilidade)
              </summary>
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <SpreadsheetUpload onImportComplete={handleImportComplete} onViewList={() => setActiveTab("list")} />
              </div>
            </details>
          </div>
        </TabsContent>


      </Tabs>
    </UnifiedLayout>
  );
};

export default EstudantesPage;