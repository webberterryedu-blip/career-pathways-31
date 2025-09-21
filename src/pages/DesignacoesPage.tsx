import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  RefreshCw,
  Save
} from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { useEstudantes } from "@/hooks/useEstudantes";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Tipos para o sistema de designações
interface DesignacaoMinisterial {
  id: string;
  semana: string;
  data_inicio: string;
  parte_numero: number;
  parte_titulo: string;
  parte_tempo: number;
  parte_tipo: 'leitura_biblica' | 'demonstracao' | 'discurso' | 'estudo_biblico';
  estudante_principal_id: string;
  estudante_ajudante_id?: string;
  status: 'pendente' | 'confirmada' | 'concluida';
}

interface ProgramaSemanal {
  id: string;
  semana: string;
  data_inicio: string;
  mes_ano: string;
  partes: ParteMeeting[];
}

interface ParteMeeting {
  numero: number;
  titulo: string;
  tempo: number;
  tipo: string;
  secao: string;
  referencia?: string;
  instrucoes?: string;
  regras_papel?: {
    genero?: string;
    assistente_necessario?: boolean;
  };
}

const DesignacoesPage = () => {
  const navigate = useNavigate();
  const [selectedCongregacaoId, setSelectedCongregacaoId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [programaAtual, setProgramaAtual] = useState<ProgramaSemanal | null>(null);
  const [programasDisponiveis, setProgramasDisponiveis] = useState<ProgramaSemanal[]>([]);
  const [designacoes, setDesignacoes] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { estudantes, isLoading: estudantesLoading } = useEstudantes();
  const { user } = useAuth();

  // Helper function to convert assignment type to number
  const assignmentTypeToNumber = (assignmentType: string): number => {
    const typeMap: { [key: string]: number } = {
      'opening_comments': 1,
      'treasures_talk': 2,
      'spiritual_gems': 3,
      'bible_reading': 4,
      'starting_conversation': 5,
      'following_up': 6,
      'making_disciples': 7,
      'explaining_beliefs': 8,
      'talk': 9
    };
    return typeMap[assignmentType] || 0;
  };

  // Fallback local generator when Edge Function is unavailable
  const gerarDesignacoesLocal = () => {
    if (!programaAtual) return [] as any[];

    // Consider only parts that typically have assignments
    const tiposElegiveis = new Set([
      'opening_comments',
      'treasures_talk',
      'spiritual_gems',
      'bible_reading',
      'starting_conversation',
      'following_up',
      'making_disciples',
      'explaining_beliefs',
      'talk',
      'local_needs',
      'congregation_bible_study'
    ]);

    const resultados = (programaAtual.partes || [])
      .filter((p) => tiposElegiveis.has(p.tipo))
      .map((parte) => ({
        id: `${programaAtual.id}-${parte.tipo}-${parte.numero}`,
        programacao_item_id: parte.tipo,
        parte_numero: assignmentTypeToNumber(parte.tipo),
        parte_titulo: parte.titulo,
        parte_tempo: parte.tempo,
        parte_tipo: parte.tipo,
        principal_estudante_id: null,
        assistente_estudante_id: null,
        status: 'PENDING',
        observacoes: 'fallback: local generator (no assignments)'
      }));

    return resultados;
  };

  // Load selected program from context when component mounts
  useEffect(() => {
    const savedProgram = localStorage.getItem('selectedProgram');
    if (savedProgram) {
      try {
        const programa = JSON.parse(savedProgram);
        setProgramaAtual(programa);
        setSelectedProgramId(programa.id);
        toast({
          title: "Programa carregado",
          description: `Programa "${programa.semana}" carregado com sucesso.`
        });
        localStorage.removeItem('selectedProgram');
      } catch (error) {
        console.error('Erro ao carregar programa salvo:', error);
      }
    }
  }, [setSelectedProgramId]);
  
  // Update congregacaoId to use context, fallback to first estudante's congregacao
  const firstCongId = Array.isArray(estudantes) && estudantes.length > 0 ? (estudantes as any[]).find((e: any) => e?.congregacao_id)?.congregacao_id : '';
  const congregacaoId = selectedCongregacaoId || firstCongId || '';
  const setCongregacaoId = setSelectedCongregacaoId;

  // Function to change selected program
  const selecionarPrograma = (programaId: string) => {
    const programa = programasDisponiveis.find(p => p.id === programaId);
    if (programa) {
      setProgramaAtual(programa);
      setDesignacoes([]);
      toast({ 
        title: 'Programa alterado', 
        description: `Programa "${programa.semana}" selecionado` 
      });
    }
  };

  // Carregar semana real dos dados JSON com fallback local quando o backend estiver offline
  const carregarSemanaAtual = async () => {
    setIsLoading(true);

    const fallbackProgramas = [
      {
        idSemana: '2026-01-05',
        semanaLabel: '5-11 de janeiro 2026',
        tema: 'Recomeçando com sabedoria',
        programacao: [
          {
            secao: 'Tesouros da Palavra de Deus',
            partes: [
              { idParte: 1, titulo: 'Comentários iniciais', duracaoMin: 3, tipo: 'opening_comments' },
              { idParte: 2, titulo: 'Tesouros da Palavra de Deus', duracaoMin: 10, tipo: 'treasures_talk' },
              { idParte: 3, titulo: 'Joias espirituais', duracaoMin: 10, tipo: 'spiritual_gems' },
              { idParte: 4, titulo: 'Leitura da Bíblia', duracaoMin: 4, tipo: 'bible_reading', restricoes: { genero: 'masculino' } }
            ]
          },
          {
            secao: 'Faça Seu Melhor no Ministério',
            partes: [
              { idParte: 5, titulo: 'Iniciando conversas', duracaoMin: 2, tipo: 'starting_conversation' },
              { idParte: 6, titulo: 'Cultivando o interesse', duracaoMin: 3, tipo: 'following_up' },
              { idParte: 7, titulo: 'Fazendo discípulos', duracaoMin: 5, tipo: 'making_disciples' }
            ]
          },
          {
            secao: 'Nossa Vida Cristã',
            partes: [
              { idParte: 8, titulo: 'Tema local (ancião)', duracaoMin: 15, tipo: 'local_needs' },
              { idParte: 9, titulo: 'Estudo bíblico de congregação', duracaoMin: 30, tipo: 'congregation_bible_study' }
            ]
          }
        ]
      }
    ];

    const toProgramaSemanal = (programaData: any): ProgramaSemanal => {
      const partes: ParteMeeting[] = [];
      if (programaData.programacao) {
        programaData.programacao.forEach((secao: any) => {
          secao.partes.forEach((parte: any) => {
            partes.push({
              numero: parte.idParte,
              titulo: parte.titulo,
              tempo: parte.duracaoMin,
              tipo: parte.tipo,
              secao: secao.secao,
              referencia: parte.referencia,
              instrucoes: parte.instrucoes,
              regras_papel: parte.restricoes
            });
          });
        });
      }
      return {
        id: programaData.idSemana,
        semana: programaData.semanaLabel,
        data_inicio: programaData.idSemana,
        mes_ano: programaData.tema || 'Programa Ministerial',
        partes
      };
    };

    try {
      // Try Supabase Edge Function first
      console.log('Trying Edge Function...');
      const { data, error } = await supabase.functions.invoke('list-programs-json');
      
      if (data && data.success && Array.isArray(data.data)) {
        const allPrograms = data.data.map(toProgramaSemanal).sort((a, b) => 
          new Date(b.data_inicio || '').getTime() - new Date(a.data_inicio || '').getTime()
        );
        setProgramasDisponiveis(allPrograms);
        
        const latestProgram = allPrograms[0];
        setProgramaAtual(latestProgram);
        toast({ 
          title: 'Programas carregados (Supabase)', 
          description: `${allPrograms.length} programas disponíveis. Programa atual: "${latestProgram.semana}"` 
        });
        setIsLoading(false);
        return;
      }
      
      if (error) {
        console.warn('Edge Function error:', error);
        throw new Error('Edge Function not available');
      }
    } catch (error) {
      console.warn('Edge Function failed, falling back to backend API...', error);
      
      try {
        // Fallback to backend API
        console.log('Falling back to backend API...');
        const response = await fetch('http://localhost:3001/api/programacoes/mock');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const allPrograms = data.map(toProgramaSemanal).sort((a, b) => 
              new Date(b.data_inicio || '').getTime() - new Date(a.data_inicio || '').getTime()
            );
            setProgramasDisponiveis(allPrograms);
            
            const latestProgram = allPrograms[0];
            setProgramaAtual(latestProgram);
            toast({ 
              title: 'Programas carregados (Backend)', 
              description: `${allPrograms.length} programas disponíveis. Programa atual: "${latestProgram.semana}"` 
            });
            setIsLoading(false);
            return;
          }
        }
      } catch (backendError) {
        console.warn('Backend API also failed, using local fallback...', backendError);
      }
    }

    const fallback = toProgramaSemanal(fallbackProgramas[0]);
    setProgramaAtual(fallback);
    setProgramasDisponiveis([fallback]);
    toast({ title: 'Programa (local) carregado', description: `Usando dados locais: ${fallback.semana}` });
    setIsLoading(false);
  };

  // Salvar designações no backend
  const salvarDesignacoes = async () => {
    if (!programaAtual || designacoes.length === 0) {
      toast({
        title: 'Nenhuma designação para salvar',
        description: 'Gere as designações primeiro.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!congregacaoId) {
      toast({
        title: 'Congregação requerida',
        description: 'Selecione uma congregação antes de salvar.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Use Supabase Edge Function para salvar designações
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-assignments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            assignments: designacoes.map(d => ({
              assignment_type: d.parte_tipo,
              assignment_title: d.parte_titulo,
              student_id: d.principal_estudante_id,
              student_name: getEstudanteNome(d.principal_estudante_id),
              assistant_id: d.assistente_estudante_id,
              assistant_name: d.assistente_estudante_id ? getEstudanteNome(d.assistente_estudante_id) : undefined,
              assignment_duration: d.parte_tempo,
              observations: d.observacoes
            })),
            program_id: programaAtual.id,
            week_date: programaAtual.data_inicio
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data && data.success) {
        toast({
          title: 'Designações salvas!',
          description: `${data.saved_count} designações foram salvas com sucesso via Edge Function.`
        });
        return;
      }
      
      if (data && !data.success) {
        throw new Error(data.error || 'Erro desconhecido ao salvar');
      }
    } catch (edgeFunctionError) {
      console.warn('Edge Function failed, trying backend API fallback...', edgeFunctionError);
      
      try {
        // Fallback to backend API if Edge Function fails
        console.log('Falling back to backend API...');
        const payload = {
          programacao_id: programaAtual.id,
          congregacao_id: congregacaoId,
          itens: designacoes.map(d => ({
            programacao_item_id: d.programacao_item_id || d.id,
            principal_estudante_id: d.principal_estudante_id || d.estudante_principal_id,
            assistente_estudante_id: d.assistente_estudante_id || d.estudante_ajudante_id,
            observacoes: d.observacoes
          }))
        };

        const backendResponse = await fetch('http://localhost:3001/api/designacoes/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(payload)
        });

        if (backendResponse.ok) {
          toast({
            title: 'Designações salvas (Backend)!',
            description: `${designacoes.length} designações foram salvas com sucesso via backend.`
          });
          return;
        } else {
          const errorText = await backendResponse.text();
          throw new Error(`Backend API error: ${backendResponse.status} - ${errorText}`);
        }
      } catch (backendError) {
        console.warn('Backend API also failed, saving draft locally...', backendError);
        
        // Save draft locally as final fallback
        try {
          localStorage.setItem('designacoes_draft', JSON.stringify({
            programacao_id: programaAtual?.id,
            congregacao_id: congregacaoId,
            itens: designacoes
          }));
          toast({
            title: 'Rascunho salvo localmente',
            description: 'As designações foram salvas como rascunho no navegador devido a falha na conexão.'
          });
          return;
        } catch (localStorageError) {
          console.error('Failed to save draft locally:', localStorageError);
        }
      }
    }
    
    // If we get here, all methods failed
    toast({
      title: 'Erro ao salvar designações',
      description: 'Não foi possível salvar as designações. Tente novamente mais tarde.',
      variant: 'destructive'
    });
  };

  // Gerar designações automaticamente (usando Supabase Edge Functions)
  const gerarDesignacoes = async () => {
    if (!programaAtual) {
      toast({
        title: 'Programa requerido',
        description: 'Carregue uma semana antes de gerar designações.',
        variant: 'destructive'
      });
      return;
    }
    
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
      // Use Supabase Edge Function para gerar designações
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-assignments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            semana: programaAtual.semana,
            data_reuniao: programaAtual.data_inicio,
            partes_customizadas: programaAtual.partes.map((parte, index) => ({
              id: String(index + 1), 
              tipo: parte.tipo,
              titulo: parte.titulo,
              minutos: parte.tempo,
              semana: programaAtual.semana,
              data: new Date(programaAtual.data_inicio)
            }))
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
        
        const designacoesRetornadas = data.data?.designacoes || [];
        console.log('Designações geradas:', designacoesRetornadas);
        
        if (designacoesRetornadas.length > 0) {
          // Transform assignments to match frontend format
          const transformedAssignments = designacoesRetornadas.map((assignment: any) => ({
            id: `${programaAtual.id}-${assignment.assignment_type}`,
            programacao_item_id: assignment.assignment_type,
            parte_numero: assignmentTypeToNumber(assignment.assignment_type),
            parte_titulo: assignment.assignment_title,
            parte_tempo: assignment.assignment_duration,
            parte_tipo: assignment.assignment_type,
            principal_estudante_id: assignment.student_id,
            assistente_estudante_id: assignment.assistant_id,
            status: 'OK',
            observacoes: assignment.selection_reason || ''
          }));
          
          setDesignacoes(transformedAssignments);

          const estatisticas = data.data?.estatisticas;
          const source = 'edge-function';
          const algorithmUsed = 'S-38';
          
          let description = `${designacoesRetornadas.length} designações foram criadas usando o algoritmo ${algorithmUsed} via Edge Function.`;
          if (estatisticas?.conflitos_encontrados?.length > 0) {
            description += ` Atenção: ${estatisticas.conflitos_encontrados.length} conflito(s) encontrado(s).`;
          }
          
          toast({ 
            title: 'Designações geradas com sucesso!', 
            description: description
          });
        } else {
          toast({ 
            title: 'Atenção: Nenhuma designação gerada', 
            description: 'O algoritmo S-38 não conseguiu gerar designações. Verifique se há estudantes elegíveis.',
            variant: 'destructive' 
          });
        }
        setIsGenerating(false);
        return;
      } else {
        throw new Error(data.error || 'Erro desconhecido na Edge Function');
      }
    } catch (edgeFunctionError: any) {
      console.warn('Edge Function indisponível, usando gerador local:', edgeFunctionError);
      
      // Try fallback to local generator
      const locais = gerarDesignacoesLocal();
      if (locais.length > 0) {
        setDesignacoes(locais);
        toast({
          title: 'Designações geradas (local)',
          description: `${locais.length} designações criadas com gerador local devido a falha na Edge Function.`
        });
      } else {
        toast({ 
          title: 'Erro ao gerar designações', 
          description: 'Falha na Edge Function e no gerador local. Verifique a conectividade.', 
          variant: 'destructive' 
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Mock students mapping (should come from real database)
  const mockStudentsMap = {
    'est1': 'João Silva',
    'est2': 'Pedro Santos', 
    'est3': 'Maria Oliveira',
    'est4': 'Ana Costa',
    'est5': 'Carlos Ferreira'
  };

  // Obter nome do estudante por ID
  const getEstudanteNome = (id: string | null) => {
    if (!id) return 'Não designado';
    
    const estudante = estudantes?.find((e: any) => e.id === id);
    if (estudante?.nome) {
      return estudante.nome;
    }
    
    return mockStudentsMap[id as keyof typeof mockStudentsMap] || id || 'Não designado';
  };

  // Função para obter o status visual com informações de fallback
  const getStatusBadge = (designacao: any) => {
    if (!designacao.principal_estudante_id) {
      return <Badge variant="destructive">Pendente</Badge>;
    }
    if (designacao.status === 'OK') {
      if (designacao.observacoes && designacao.observacoes.includes('fallback')) {
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="secondary">Designada</Badge>
            <Badge variant="outline" className="text-xs">Fallback aplicado</Badge>
          </div>
        );
      }
      return <Badge variant="default">Confirmada</Badge>;
    }
    return <Badge variant="secondary">Designada</Badge>;
  };

  return (
    <PageShell 
      title={`Designações - ${programaAtual ? programaAtual.semana : '—'}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={carregarSemanaAtual} disabled={isLoading}>
            {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Carregar Programa
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDesignacoes([])}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          <Button size="sm" onClick={gerarDesignacoes} disabled={isGenerating || !programaAtual || !congregacaoId}>
            {isGenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
            Gerar Designações Automáticas
          </Button>
          {designacoes.length > 0 && (
            <Button size="sm" variant="default" onClick={salvarDesignacoes}>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Programa:</label>
                {programasDisponiveis.length > 1 ? (
                  <Select value={programaAtual?.id || ''} onValueChange={selecionarPrograma}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um programa" />
                    </SelectTrigger>
                    <SelectContent>
                      {programasDisponiveis.map((programa) => (
                        <SelectItem key={programa.id} value={programa.id}>
                          {programa.semana}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-600">{programaAtual ? programaAtual.semana : 'Nenhum programa carregado'}</p>
                )}
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

        {/* Estado sem programa */}
        {!programaAtual && (
          <Card>
            <CardContent className="p-12 text-center">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma semana carregada. Carregue a semana atual ou importe um PDF na aba Programas.
                </AlertDescription>
              </Alert>
              <Button className="mt-4" onClick={carregarSemanaAtual} disabled={isLoading}>
                {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Carregar Programa
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabela de designações */}
        {programaAtual && (
          <>
            {/* S-38 Algorithm Summary */}
            {designacoes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Resumo do Algoritmo S-38
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {designacoes.filter(d => d.status === 'OK').length}
                      </div>
                      <div className="text-sm text-gray-500">Designações Confirmadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {designacoes.filter(d => d.status === 'PENDING').length}
                      </div>
                      <div className="text-sm text-gray-500">Pendentes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {designacoes.filter(d => d.observacoes && d.observacoes.includes('fallback')).length}
                      </div>
                      <div className="text-sm text-gray-500">Fallbacks Aplicados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round((designacoes.filter(d => d.status === 'OK').length / designacoes.length) * 100)}%
                      </div>
                      <div className="text-sm text-gray-500">Taxa de Sucesso</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Designações da Semana
                </CardTitle>
                <CardDescription>
                  {designacoes.length > 0 
                    ? `${designacoes.length} partes com designações`
                    : 'Clique em "Gerar Designações Automáticas" para começar'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {designacoes.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma designação gerada ainda</p>
                    <Button 
                      className="mt-4" 
                      onClick={gerarDesignacoes} 
                      disabled={isGenerating || !congregacaoId}
                    >
                      {isGenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                      Gerar Designações Automáticas
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parte</TableHead>
                        <TableHead>Tempo</TableHead>
                        <TableHead>Estudante</TableHead>
                        <TableHead>Assistente</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {designacoes.map((designacao: any, index: number) => {
                        console.log('Renderizando designação:', designacao);
                        return (
                          <TableRow key={designacao.id || designacao.programacao_item_id || index}>
                            <TableCell className="font-medium">
                              <div>
                                <p>{designacao.parte_titulo || designacao.titulo || (designacao.programacao_itens && designacao.programacao_itens.titulo) || 'Parte não identificada'}</p>
                                <p className="text-sm text-gray-500">#{designacao.parte_numero || designacao.numero || 'N/A'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                <Clock className="w-3 h-3 mr-1" />
                                {designacao.parte_tempo || designacao.tempo || (designacao.programacao_itens && designacao.programacao_itens.tempo) || 0} min
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {designacao.principal_estudante_id 
                                ? getEstudanteNome(designacao.principal_estudante_id) 
                                : 'Não designado'}
                            </TableCell>
                            <TableCell>
                              {designacao.assistente_estudante_id 
                                ? getEstudanteNome(designacao.assistente_estudante_id) 
                                : '—'}
                            </TableCell>
                            <TableCell>{getStatusBadge(designacao)}</TableCell>
                            <TableCell>
                              {designacao.observacoes ? (
                                <span className="text-xs text-gray-500 italic">
                                  {designacao.observacoes.includes('fallback') ? '🔄 ' : ''}
                                  {designacao.observacoes}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" disabled>
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageShell>
  );
};

export default DesignacoesPage;