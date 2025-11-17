// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Save,
  Edit,
  User,
  Users as UsersIcon,
  Clock,
  BookOpen
} from "lucide-react";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { useDesignacoes } from "@/hooks/useDesignacoes";
import { useProgramContext } from "@/contexts/ProgramContext";
import { supabase } from "@/integrations/supabase/client";
import { AssignmentEditCard } from "@/components/assignment/AssignmentEditCard";

const DesignacoesPreview = () => {
  const navigate = useNavigate();
  const { programId } = useParams();
  const { designacoes, loading, fetchDesignacoes } = useDesignacoes();
  const { getProgramById } = useProgramContext();
  
  const [program, setProgram] = useState(null);
  const [filteredDesignacoes, setFilteredDesignacoes] = useState([]);
  const [confirmingAll, setConfirmingAll] = useState(false);

  useEffect(() => {
    if (programId) {
      const prog = getProgramById(programId);
      setProgram(prog);
    }
  }, [programId, getProgramById]);

  useEffect(() => {
    if (designacoes && programId) {
      // Filter assignments for this program
      const filtered = designacoes.filter(d => 
        d.parte?.programa_id === programId
      );
      setFilteredDesignacoes(filtered);
    }
  }, [designacoes, programId]);

  const handleConfirmAll = async () => {
    setConfirmingAll(true);
    try {
      const pendingIds = filteredDesignacoes
        .filter(d => d.status === 'designado')
        .map(d => d.id);

      if (pendingIds.length === 0) {
        toast({
          title: "Nada para confirmar",
          description: "Todas as designações já foram confirmadas.",
        });
        return;
      }

      const { error } = await supabase
        .from('designacoes')
        .update({ 
          status: 'confirmado',
          confirmado_em: new Date().toISOString()
        })
        .in('id', pendingIds);

      if (error) throw error;

      await fetchDesignacoes();
      
      toast({
        title: "Designações Confirmadas",
        description: `${pendingIds.length} designação(ões) confirmada(s) com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao confirmar todas:', error);
      toast({
        title: "Erro ao confirmar",
        description: "Não foi possível confirmar as designações.",
        variant: "destructive"
      });
    } finally {
      setConfirmingAll(false);
    }
  };

  const handleSaveAndReturn = () => {
    toast({
      title: "Designações Salvas",
      description: "Todas as alterações foram salvas com sucesso.",
    });
    navigate('/designacoes');
  };

  const stats = {
    total: filteredDesignacoes.length,
    confirmed: filteredDesignacoes.filter(d => d.status === 'confirmado').length,
    pending: filteredDesignacoes.filter(d => d.status === 'designado').length,
    canceled: filteredDesignacoes.filter(d => d.status === 'cancelado').length,
  };

  // Group by section
  const groupedBySection = filteredDesignacoes.reduce((acc, designacao) => {
    const section = designacao.parte?.secao || 'outros';
    if (!acc[section]) acc[section] = [];
    acc[section].push(designacao);
    return acc;
  }, {});

  const sectionLabels = {
    tesouros: "Tesouros da Palavra de Deus",
    ministerio: "Faça Seu Melhor no Ministério",
    vida_crista: "Nossa Vida Cristã",
    outros: "Outras Partes"
  };

  const sectionOrder = ['tesouros', 'ministerio', 'vida_crista', 'outros'];

  if (loading) {
    return (
      <UnifiedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/designacoes')}
              className="mb-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">Prévia de Designações</h1>
            {program && (
              <p className="text-muted-foreground">
                {program.tema} • {new Date(program.data_reuniao).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleConfirmAll}
              disabled={confirmingAll || stats.pending === 0}
              variant="default"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Todas ({stats.pending})
            </Button>
            <Button
              onClick={handleSaveAndReturn}
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar e Voltar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.canceled}</div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments by Section */}
        <div className="space-y-6">
          {sectionOrder.map(sectionKey => {
            const sectionAssignments = groupedBySection[sectionKey];
            if (!sectionAssignments || sectionAssignments.length === 0) return null;

            return (
              <div key={sectionKey} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{sectionLabels[sectionKey]}</h2>
                  <Badge variant="secondary">{sectionAssignments.length}</Badge>
                </div>
                <Separator />
                <div className="grid gap-4">
                  {sectionAssignments
                    .sort((a, b) => (a.parte?.ordem || 0) - (b.parte?.ordem || 0))
                    .map((designacao) => (
                      <AssignmentEditCard 
                        key={designacao.id} 
                        designacao={designacao}
                        onUpdate={fetchDesignacoes}
                      />
                    ))}
                </div>
              </div>
            );
          })}
        </div>

        {filteredDesignacoes.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma designação encontrada para este programa.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </UnifiedLayout>
  );
};

export default DesignacoesPreview;
