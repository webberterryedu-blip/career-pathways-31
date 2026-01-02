import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { jworgApi, type SincronizacaoLog, type ProgramaOficial } from '@/lib/api/jworg';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImportacaoManualDialog } from './ImportacaoManualDialog';

export function SincronizacaoJWorgCard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [idioma, setIdioma] = useState('pt');
  const [historico, setHistorico] = useState<SincronizacaoLog[]>([]);
  const [programas, setProgramas] = useState<ProgramaOficial[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, [idioma]);

  async function loadData() {
    setLoadingData(true);
    try {
      const [hist, progs] = await Promise.all([
        jworgApi.getHistoricoSincronizacoes(5),
        jworgApi.getProgramas(idioma)
      ]);
      setHistorico(hist);
      setProgramas(progs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  }

  async function handleSincronizar() {
    setLoading(true);
    try {
      const result = await jworgApi.sincronizar(idioma, true);
      
      if (result.success) {
        const message = typeof result.data === 'object' && result.data !== null && 'message' in result.data 
          ? String((result.data as { message?: string }).message) 
          : 'Programas atualizados com sucesso';
        toast({
          title: 'Sincronização concluída',
          description: message,
        });
        loadData();
      } else {
        toast({
          title: 'Erro na sincronização',
          description: result.error || 'Ocorreu um erro ao sincronizar',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao conectar com o servidor',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'sucesso':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'erro':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'sucesso':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Sucesso</Badge>;
      case 'erro':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Em andamento</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Card de Sincronização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sincronização com JW.org
          </CardTitle>
          <CardDescription>
            Importe as programações oficiais diretamente do site jw.org
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={idioma} onValueChange={setIdioma}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleSincronizar} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar Agora
              </>
            )}
            </Button>

            <ImportacaoManualDialog onSuccess={loadData} />
            
            <a 
              href="https://www.jw.org/pt/biblioteca/jw-apostila-do-mes/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Ver no JW.org
            </a>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>A sincronização irá:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Acessar a página oficial da apostila do mês</li>
              <li>Extrair todas as semanas disponíveis</li>
              <li>Importar partes, durações e referências</li>
              <li>Atualizar automaticamente programas existentes</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Programas Importados */}
      <Card>
        <CardHeader>
          <CardTitle>Programas Importados</CardTitle>
          <CardDescription>
            {loadingData ? 'Carregando...' : `${programas.length} semanas disponíveis`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando programas...
            </div>
          ) : programas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum programa importado ainda.</p>
              <p className="text-sm mt-2">Clique em "Sincronizar Agora" para importar.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {programas.slice(0, 10).map((programa) => (
                <div 
                  key={programa.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <div className="font-medium">
                      {format(new Date(programa.semana_inicio), "d 'de' MMMM", { locale: ptBR })} - {format(new Date(programa.semana_fim), "d 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {programa.tema || 'Programa da Semana'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {programa.partes.length} partes • Cânticos: {programa.cantico_inicial}, {programa.cantico_meio}, {programa.cantico_final}
                    </div>
                  </div>
                  <Badge variant="outline">{programa.idioma.toUpperCase()}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Sincronizações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Sincronizações</CardTitle>
          <CardDescription>
            Últimas sincronizações realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhuma sincronização realizada ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {historico.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div className="flex items-center gap-2">
                    {statusIcon(log.status)}
                    <span className="text-sm">
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({log.idioma.toUpperCase()})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.programas_importados > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {log.programas_importados} importados
                      </span>
                    )}
                    {statusBadge(log.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}