import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { 
  Calendar, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Link,
  Settings,
  Play,
  Globe
} from "lucide-react";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { useNavigate } from "react-router-dom";
import { useProgramContext } from "@/contexts/ProgramContext";
import { supabase } from "@/integrations/supabase/client";
import { SincronizacaoJWorgCard } from "@/components/SincronizacaoJWorgCard";

async function fetchMockMonth(month: string) {
  const resp = await fetch(`/api/programacoes/mock?mes=${encodeURIComponent(month)}`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  return data;
}

// Tipos para o sistema de programas
interface ProgramaSemanal {
  id: string;
  semana: string;
  data_inicio: string;
  mes_ano: string;
  partes: ParteMeeting[];
  pdf_url?: string;
  tema?: string;
  criado_em: string;
  atualizado_em: string;
}

interface ParteMeeting {
  numero: number;
  titulo: string;
  tempo: number;
  tipo: string;
  secao: string;
  referencia?: string;
  cena?: string;
  instrucoes?: string;
}

// Componente para importação de PDFs das apostilas
const ImportacaoPDF: React.FC<{ onImportComplete: (programa: ProgramaSemanal) => void }> = ({ onImportComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedProgramas, setExtractedProgramas] = useState<any[]>([]);
  const [mesAno, setMesAno] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setExtractedProgramas([]);
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo PDF da apostila MWB.",
        variant: "destructive"
      });
    }
  };

  const processPDF = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('save', 'false');

      const { data, error } = await supabase.functions.invoke('parse-mwb-pdf', {
        body: formData,
      });

      if (error) throw new Error(error.message || 'Erro ao processar PDF');
      if (!data?.success) throw new Error(data?.error || 'Falha no processamento');

      setExtractedProgramas(data.programas || []);
      setMesAno(data.mes_ano || '');

      toast({
        title: "PDF processado com sucesso!",
        description: `${data.total_semanas} semana(s) extraída(s) do PDF.`
      });
    } catch (error: any) {
      console.error('PDF parse error:', error);
      toast({
        title: "Erro ao processar PDF",
        description: error.message || "Não foi possível extrair os dados da apostila.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const salvarNoBanco = async () => {
    if (!selectedFile || extractedProgramas.length === 0) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('save', 'true');

      const { data, error } = await supabase.functions.invoke('parse-mwb-pdf', {
        body: formData,
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Falha ao salvar');

      toast({
        title: "Programas salvos!",
        description: `${data.saved} programa(s) salvo(s) no banco de dados.`
      });

      // Import each week as a program into the local state
      for (const prog of data.programas || []) {
        const programa: ProgramaSemanal = {
          id: prog.semana_inicio || Date.now().toString(),
          semana: prog.semana_label || prog.tema || prog.semana_inicio,
          data_inicio: prog.semana_inicio,
          mes_ano: prog.mes_ano || mesAno,
          tema: prog.tema,
          partes: (prog.partes || []).map((p: any) => ({
            numero: p.ordem,
            titulo: p.titulo,
            tempo: p.duracao_min,
            tipo: p.tipo,
            secao: p.secao === 'tesouros' ? 'TESOUROS' : p.secao === 'ministerio' ? 'MINISTÉRIO' : 'VIDA CRISTÃ',
            referencia: p.referencia,
          })),
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        };
        onImportComplete(programa);
      }

      setSelectedFile(null);
      setExtractedProgramas([]);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const secaoColors: Record<string, string> = {
    tesouros: 'bg-amber-100 text-amber-800 border-amber-200',
    ministerio: 'bg-green-100 text-green-800 border-green-200',
    vida_crista: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const secaoLabels: Record<string, string> = {
    tesouros: 'Tesouros da Palavra de Deus',
    ministerio: 'Faça Seu Melhor no Ministério',
    vida_crista: 'Nossa Vida Cristã',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Importar Apostila MWB (PDF)
        </CardTitle>
        <CardDescription>
          Faça upload do PDF oficial da apostila "Vida e Ministério Cristão". A IA extrairá automaticamente todas as semanas e partes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecionar arquivo PDF:</label>
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            disabled={isProcessing || isSaving}
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              📄 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
            </p>
          )}
        </div>

        {selectedFile && extractedProgramas.length === 0 && (
          <Button 
            onClick={processPDF} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Extraindo com IA... (pode levar até 30s)
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Processar Apostila
              </>
            )}
          </Button>
        )}

        {extractedProgramas.length > 0 && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{extractedProgramas.length} semana(s) extraída(s)</strong>
                {mesAno && <span className="ml-1">— {mesAno}</span>}
              </AlertDescription>
            </Alert>

            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
              {extractedProgramas.map((prog: any, weekIdx: number) => (
                <div key={weekIdx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-base">
                      📅 {prog.semana_label || prog.tema}
                    </h4>
                    <Badge variant="secondary">{(prog.partes || []).length} partes</Badge>
                  </div>
                  {prog.tema && (
                    <p className="text-sm font-medium text-primary">{prog.tema}</p>
                  )}
                  {prog.leitura_biblica && (
                    <p className="text-sm text-muted-foreground">📖 Leitura: {prog.leitura_biblica}</p>
                  )}
                  <div className="space-y-1">
                    {(prog.partes || []).map((parte: any, pIdx: number) => (
                      <div key={pIdx} className={`flex items-center justify-between p-2 rounded border ${secaoColors[parte.secao] || 'bg-muted'}`}>
                        <div className="flex-1">
                          <span className="text-sm font-medium">{parte.ordem}. {parte.titulo}</span>
                          {parte.referencia && (
                            <span className="text-xs ml-2 opacity-70">({parte.referencia})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Badge variant="secondary" className="text-xs">{parte.duracao_min} min</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={salvarNoBanco} className="flex-1" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salvar no Banco e Importar
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => { setExtractedProgramas([]); setSelectedFile(null); }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ProgramasPage = () => {
  const navigate = useNavigate();
  const { setSelectedProgramId, setSelectedCongregacaoId } = useProgramContext();
  const [activeTab, setActiveTab] = useState('list');
  const [programas, setProgramas] = useState<ProgramaSemanal[]>([]);
  const [programaSelecionado, setProgramaSelecionado] = useState<ProgramaSemanal | null>(null);
  const [pdfsDisponiveis, setPdfsDisponiveis] = useState<any>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Carregar PDFs disponíveis ao montar o componente
  useEffect(() => {
    // Temporariamente desativado para evitar erros de CORS enquanto as Edge Functions não estão publicadas
    // carregarPDFsDisponiveis();
  }, []);

  // Carregar programas reais dos arquivos JSON (via Supabase Edge Function)
  const carregarProgramasReais = async () => {
    try {
      // Try Supabase Edge Function first
      console.log('Trying Edge Function for programs...');
      const { data, error } = await supabase.functions.invoke('list-programs-json');

      if (data && data.success && Array.isArray(data.data)) {
        const programasConvertidos = data.data.map((programaData: any) => {
          // Handle direct database format from Edge Function
          if (programaData.data_inicio_semana) {
            return {
              id: programaData.data_inicio_semana,
              semana: programaData.semana || programaData.data_inicio_semana,
              data_inicio: programaData.data_inicio_semana,
              mes_ano: programaData.mes_apostila || 'Programa Ministerial',
              tema: programaData.mes_apostila,
              partes: programaData.partes || [],
              criado_em: programaData.created_at || new Date().toISOString(),
              atualizado_em: programaData.updated_at || new Date().toISOString()
            };
          }
          
          // Handle converted format (legacy)
          return {
            id: programaData.idSemana,
            semana: programaData.semanaLabel,
            data_inicio: programaData.idSemana,
            mes_ano: programaData.tema || 'Programa Ministerial',
            tema: programaData.tema,
            partes: (programaData.programacao || []).flatMap((secao: any) => 
              (secao.partes || []).map((parte: any) => ({
                numero: parte.idParte,
                titulo: parte.titulo,
                tempo: parte.duracaoMin,
                tipo: parte.tipo,
                secao: secao.secao,
                referencia: Array.isArray(parte.referencias) ? parte.referencias.join('; ') : parte.referencia,
                instrucoes: parte.instrucoes
              }))
            ),
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString()
          };
        });

        // Sort programs by date (newest first)
        const sortedPrograms = programasConvertidos.sort((a, b) => 
          new Date(b.data_inicio || '').getTime() - new Date(a.data_inicio || '').getTime()
        );

        setProgramas(sortedPrograms);
        toast({
          title: "Programas carregados",
          description: `${programasConvertidos.length} programa(s) carregado(s) via Supabase Edge Function.`
        });
        return;
      }
      
      if (error) {
        console.warn('Edge Function error, falling back to backend API:', error);
        throw new Error('Edge Function not available');
      }
    } catch (edgeFunctionError) {
      console.warn('Edge Function failed, trying backend API...', edgeFunctionError);
      
      try {
        // Fallback to backend API
        const response = await fetch('http://localhost:3001/api/programacoes/mock');
        if (!response.ok) {
          throw new Error(`Backend API error: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          console.warn('Dados inesperados do backend:', data);
          throw new Error('Formato de dados inesperado do backend');
        }

        const programasConvertidos = data.map((programaData: any) => ({
          id: programaData.idSemana,
          semana: programaData.semanaLabel,
          data_inicio: programaData.idSemana,
          mes_ano: programaData.tema || 'Programa Ministerial',
          tema: programaData.tema,
          partes: (programaData.programacao || []).flatMap((secao: any) => 
            (secao.partes || []).map((parte: any) => ({
              numero: parte.idParte,
              titulo: parte.titulo,
              tempo: parte.duracaoMin,
              tipo: parte.tipo,
              secao: secao.secao,
              referencia: Array.isArray(parte.referencias) ? parte.referencias.join('; ') : parte.referencia,
              instrucoes: parte.instrucoes
            }))
          ),
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        }));

        // Sort programs by date (newest first)
        const sortedPrograms = programasConvertidos.sort((a, b) => 
          new Date(b.data_inicio || '').getTime() - new Date(a.data_inicio || '').getTime()
        );

        setProgramas(sortedPrograms);
        toast({
          title: "Programas carregados",
          description: `${programasConvertidos.length} programa(s) carregado(s) dos arquivos JSON.`
        });
        return;
      } catch (backendError) {
        console.error('Erro no fallback para backend API:', backendError);
        toast({
          title: "Erro ao carregar programas",
          description: "Não foi possível carregar os programas dos arquivos JSON.",
          variant: "destructive"
        });
      }
    }
  };

  // Carregar PDFs disponíveis
  const carregarPDFsDisponiveis = async () => {
    try {
      // Temporarily disabled to avoid CORS errors
      console.log('PDF loading temporarily disabled');
    } catch (error) {
      console.error('Erro ao carregar PDFs:', error);
    }
  };

  const handleImportComplete = (programa: ProgramaSemanal) => {
    setProgramas(prev => {
      // Evitar duplicatas
      const exists = prev.find(p => p.id === programa.id);
      if (exists) {
        return prev.map(p => p.id === programa.id ? programa : p);
      }
      return [...prev, programa];
    });
    setActiveTab('list');
    toast({
      title: "Programa importado!",
      description: `Programa "${programa.semana}" foi adicionado com sucesso.`
    });
  };

  // Enhanced program activation workflow
  const activateProgram = async (programa: ProgramaSemanal) => {
    setIsActivating(true);
    try {
      // Set as selected program in context
      setSelectedProgramId(programa.id);
      
      // Store program data for immediate access
      localStorage.setItem('selectedProgram', JSON.stringify(programa));
      
      toast({
        title: "Programa ativado!",
        description: `Programa "${programa.semana}" está agora ativo para geração de designações.`
      });
    } catch (error) {
      toast({
        title: "Erro ao ativar programa",
        description: "Não foi possível ativar o programa selecionado.",
        variant: "destructive"
      });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <UnifiedLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={carregarProgramasReais}>
            <Download className="w-4 h-4 mr-2" />
            Carregar Programas
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab("import")}>
            <Upload className="w-4 h-4 mr-2" />
            Importar PDF
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Lista de Semanas
          </TabsTrigger>
          <TabsTrigger value="jworg" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            JW.org
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Importar
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Recursos
          </TabsTrigger>
          <TabsTrigger value="detail" className="flex items-center gap-2" disabled={!programaSelecionado}>
            <FileText className="w-4 h-4" />
            Detalhes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {programas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum programa carregado</h3>
                <p className="text-gray-500 mb-4">Importe uma apostila PDF ou carregue um programa de exemplo</p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={carregarProgramasReais}>
                    <Download className="w-4 h-4 mr-2" />
                    Carregar Programas
                  </Button>
                  <Button onClick={() => setActiveTab("import")}>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programas.map((programa) => (
                <Card key={programa.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{programa.semana}</CardTitle>
                    <CardDescription>
                      {programa.tema && (
                        <span className="font-medium text-blue-600 block mb-1">{programa.tema}</span>
                      )}
                      {programa.mes_ano}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Partes:</span>
                        <Badge variant="secondary">{programa.partes.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Data:</span>
                        <span className="text-sm">{programa.data_inicio ? new Date(programa.data_inicio).toLocaleDateString('pt-BR') : programa.semana.split(' ')[0]}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setProgramaSelecionado(programa);
                          setActiveTab('detail');
                        }}
                      >
                        Ver Detalhes
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => activateProgram(programa)}
                          disabled={isActivating}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Ativar
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => {
                            // Navigate to designacoes page with the selected program
                            // Set the program in context
                            setSelectedProgramId(programa.id);
                            // For now, we'll use a default congregacao ID
                            // In a real app, this would be selected by the user
                            setSelectedCongregacaoId('congregacao-1');
                            // Persist full program so DesignacoesPage can load it immediately
                            try {
                              localStorage.setItem('selectedProgram', JSON.stringify(programa));
                            } catch (_) {}
                            navigate('/designacoes');
                          }}
                        >
                          Usar Programa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="jworg" className="space-y-6">
          <SincronizacaoJWorgCard />
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <ImportacaoPDF onImportComplete={handleImportComplete} />
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                Recursos e Materiais
              </CardTitle>
              <CardDescription>
                Links para materiais de referência e recursos de apoio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Apostila MWB</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Apostila oficial "Vida e Ministério Cristão"
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar PDF Atual
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vídeos JW.org</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Vídeos e materiais audiovisuais
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Link className="w-4 h-4 mr-2" />
                      Acessar JW.org
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Guia S-38</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Diretrizes para designações ministeriais
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      Ver Diretrizes
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Modelos para designações e relatórios
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Gerar Templates
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="space-y-6">
          {programaSelecionado && (
            <Card>
              <CardHeader>
                <CardTitle>{programaSelecionado.semana}</CardTitle>
                <CardDescription>{programaSelecionado.mes_ano}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {programaSelecionado.partes.map((parte, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{parte.numero}. {parte.titulo}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            {parte.tempo} min
                          </Badge>
                          <Badge variant="outline">{parte.secao}</Badge>
                        </div>
                      </div>
                      {parte.referencia && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Referência:</strong> {parte.referencia}
                        </p>
                      )}
                      {parte.cena && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Cena:</strong> {parte.cena}
                        </p>
                      )}
                      {parte.instrucoes && (
                        <p className="text-sm text-gray-600">
                          <strong>Instruções:</strong> {parte.instrucoes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </UnifiedLayout>
  );
};

export default ProgramasPage;