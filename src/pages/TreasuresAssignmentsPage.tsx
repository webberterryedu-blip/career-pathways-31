import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Download,
  RefreshCw,
  Save,
  BookOpen
} from "lucide-react";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { useEstudantes } from "@/hooks/useEstudantes";
import { useAuth } from "@/contexts/AuthContext";
import { useProgramContext } from "@/contexts/ProgramContext";
import { supabase } from "@/integrations/supabase/client";

const TreasuresAssignmentsPage = () => {
  const { selectedCongregacaoId, setSelectedCongregacaoId } = useProgramContext();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [meetingDate, setMeetingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [practiceMode, setPracticeMode] = useState(false);
  const { estudantes, isLoading: estudantesLoading } = useEstudantes();
  const { user } = useAuth();

  // Update congregacaoId to use context, fallback to first estudante's congregacao
  const firstCongId = Array.isArray(estudantes) && estudantes.length > 0 ? (estudantes as any[]).find((e: any) => e?.congregacao_id)?.congregacao_id : '';
  const congregacaoId = selectedCongregacaoId || firstCongId || '';
  const setCongregacaoId = setSelectedCongregacaoId;

  // Obter nome do estudante por ID
  const getEstudanteNome = (id: string | null) => {
    if (!id) return 'Não designado';
    
    const estudante = estudantes?.find((e: any) => e.id === id);
    if (estudante?.nome) {
      return estudante.nome;
    }
    
    return id || 'Não designado';
  };

  // Gerar designações automaticamente (usando a nova Supabase Edge Function)
  const gerarDesignacoes = async () => {
    if (!congregacaoId) {
      toast({
        title: 'Congregação requerida',
        description: 'Selecione uma congregação antes de gerar designações.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Use Supabase Edge Function para gerar designações do tipo "Treasures From God's Word"
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-treasures-assignments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            semana: meetingDate,
            data_reuniao: meetingDate,
            modo_pratica: practiceMode
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data && data.success) {
        console.log('Resposta da Edge Function:', data);
        
        const assignmentsReturned = data.data?.designacoes || [];
        console.log('Designações geradas:', assignmentsReturned);
        
        if (assignmentsReturned.length > 0) {
          // Transform assignments to match frontend format
          const transformedAssignments = assignmentsReturned.map((assignment: any) => ({
            id: assignment.id,
            parte_titulo: assignment.assignment_title,
            parte_tempo: assignment.assignment_duration,
            parte_tipo: assignment.assignment_type,
            principal_estudante_id: assignment.student_id,
            assistente_estudante_id: assignment.assistant_id,
            status: 'OK',
            observacoes: assignment.selection_reason || ''
          }));
          
          setAssignments(transformedAssignments);

          const statistics = data.data?.estatisticas;
          const source = 'edge-function';
          const algorithmUsed = 'Treasures From God\'s Word';
          
          let description = `${assignmentsReturned.length} designações foram criadas usando o algoritmo "${algorithmUsed}" via Edge Function.`;
          if (statistics?.conflitos_encontrados?.length > 0) {
            description += ` Atenção: ${statistics.conflitos_encontrados.length} conflito(s) encontrado(s).`;
          }
          
          toast({ 
            title: 'Designações geradas com sucesso!', 
            description: description
          });
        } else {
          toast({ 
            title: 'Atenção: Nenhuma designação gerada', 
            description: 'O algoritmo não conseguiu gerar designações. Verifique se há estudantes elegíveis.',
            variant: 'destructive' 
          });
        }
        setIsGenerating(false);
        return;
      } else {
        throw new Error(data.error || 'Erro desconhecido na Edge Function');
      }
    } catch (edgeFunctionError: any) {
      console.warn('Edge Function indisponível, mostrando erro:', edgeFunctionError);
      
      toast({ 
        title: 'Erro ao gerar designações', 
        description: `Falha na Edge Function: ${edgeFunctionError.message}. Verifique a conectividade.`, 
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Função para obter o status visual
  const getStatusBadge = (assignment: any) => {
    if (!assignment.principal_estudante_id) {
      return <Badge variant="destructive">Pendente</Badge>;
    }
    if (assignment.status === 'OK') {
      return <Badge variant="default">Confirmada</Badge>;
    }
    return <Badge variant="secondary">Designada</Badge>;
  };

  return (
    <SidebarLayout 
      title="Treasures From God's Word - Designações"
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={gerarDesignacoes} disabled={isGenerating || !congregacaoId}>
            {isGenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
            Gerar Designações Automáticas
          </Button>
          {assignments.length > 0 && (
            <Button size="sm" variant="default">
              <Save className="w-4 h-4 mr-2" />
              Salvar Designações
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Configuração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Data da Reunião:</label>
                <input 
                  type="date" 
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Modo de Prática:</label>
                <Select value={practiceMode ? "true" : "false"} onValueChange={(value) => setPracticeMode(value === "true")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Normal</SelectItem>
                    <SelectItem value="true">Prática Detalhada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Estudantes ativos:</label>
                <p className="text-sm text-gray-600">
                  {estudantesLoading ? 'Carregando...' : `${estudantes?.length || 0} estudantes`}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Congregação:</label>
                <Select value={congregacaoId} onValueChange={setCongregacaoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma congregação" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(((estudantes || []) as any[]).map(e => e?.congregacao_id).filter(Boolean))).length > 0 ? (
                      Array.from(new Set(((estudantes || []) as any[]).map(e => e?.congregacao_id).filter(Boolean))).map((id: any) => (
                        <SelectItem key={String(id)} value={String(id)}>{String(id)}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__all__">Todas</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de designações */}
        {assignments.length > 0 ? (
          <>
            {/* Resumo do Algoritmo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Resumo do Algoritmo "Treasures From God's Word"
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {assignments.filter(d => d.status === 'OK').length}
                    </div>
                    <div className="text-sm text-gray-500">Designações Confirmadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {assignments.filter(d => d.status === 'PENDING').length}
                    </div>
                    <div className="text-sm text-gray-500">Pendentes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {assignments.filter(d => d.assistente_estudante_id).length}
                    </div>
                    <div className="text-sm text-gray-500">Com Assistente</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((assignments.filter(d => d.status === 'OK').length / assignments.length) * 100)}%
                    </div>
                    <div className="text-sm text-gray-500">Taxa de Sucesso</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Designações da Reunião
                </CardTitle>
                <CardDescription>
                  {assignments.length > 0 
                    ? `${assignments.length} partes com designações`
                    : 'Clique em "Gerar Designações Automáticas" para começar'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parte</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead>Estudante</TableHead>
                      <TableHead>Assistente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment: any, index: number) => {
                      return (
                        <TableRow key={assignment.id || index}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{assignment.parte_titulo || 'Parte não identificada'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              {assignment.parte_tempo || 0} min
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {assignment.principal_estudante_id 
                              ? getEstudanteNome(assignment.principal_estudante_id) 
                              : 'Não designado'}
                          </TableCell>
                          <TableCell>
                            {assignment.assistente_estudante_id 
                              ? getEstudanteNome(assignment.assistente_estudante_id) 
                              : '—'}
                          </TableCell>
                          <TableCell>{getStatusBadge(assignment)}</TableCell>
                          <TableCell>
                            {assignment.observacoes ? (
                              <span className="text-xs text-gray-500 italic">
                                {assignment.observacoes}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Treasures From God's Word - Designações</h3>
              <p className="text-gray-500 mb-4">
                Gere automaticamente designações para a reunião "Treasures From God's Word" com base na estrutura oficial.
              </p>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Selecione uma data e congregação, então clique em "Gerar Designações Automáticas".
                </AlertDescription>
              </Alert>
              <Button 
                className="mt-4" 
                onClick={gerarDesignacoes} 
                disabled={isGenerating || !congregacaoId}
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                Gerar Designações Automáticas
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarLayout>
  );
};

export default TreasuresAssignmentsPage;