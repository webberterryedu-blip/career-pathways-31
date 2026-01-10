import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Upload, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { parseApostilaText, validarParsing, SemanaParsed } from '@/lib/parsers/apostilaTextParser';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ImportacaoManualDialogProps {
  onSuccess?: () => void;
}

export function ImportacaoManualDialog({ onSuccess }: ImportacaoManualDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Parse the text - now returns ParseResult with array of semanas
  const parseResult = text.trim().length > 50 ? parseApostilaText(text) : null;
  const validation = validarParsing(parseResult || { success: false, semanas: [], erros: ['Texto vazio'], avisos: [] });
  
  // Get first week for single import (backwards compatibility)
  const parsedProgram: SemanaParsed | null = parseResult?.semanas?.[0] || null;
  const isValid = parseResult?.success && parsedProgram !== null;

  async function handleImport() {
    if (!parsedProgram || !parseResult) return;

    setLoading(true);
    try {
      let importedCount = 0;
      
      // Import all parsed weeks
      for (const semana of parseResult.semanas) {
        // First check if record exists
        const { data: existing } = await supabase
          .from('programas_oficiais')
          .select('id')
          .eq('semana_inicio', semana.semana_inicio)
          .eq('semana_fim', semana.semana_fim)
          .eq('idioma', 'pt')
          .maybeSingle();

        const programData = {
          semana_inicio: semana.semana_inicio,
          semana_fim: semana.semana_fim,
          mes_ano: semana.mes_ano,
          tema: semana.tema,
          leitura_biblica: semana.leitura_biblica,
          cantico_inicial: semana.cantico_inicial,
          cantico_meio: semana.cantico_meio,
          cantico_final: semana.cantico_final,
          partes: semana.partes as unknown as import('@/integrations/supabase/types').Json,
          idioma: 'pt',
          fonte_url: 'importacao_manual',
          ultima_sincronizacao: new Date().toISOString()
        };

        let error;
        if (existing?.id) {
          ({ error } = await supabase
            .from('programas_oficiais')
            .update(programData)
            .eq('id', existing.id));
        } else {
          ({ error } = await supabase
            .from('programas_oficiais')
            .insert(programData));
        }

        if (error) throw error;
        importedCount++;
      }

      toast({
        title: 'Programa(s) importado(s)',
        description: `${importedCount} semana(s) importada(s) com sucesso`,
      });

      // Log the import
      await supabase.from('sincronizacoes_jworg').insert({
        idioma: 'pt',
        status: 'sucesso',
        programas_importados: importedCount,
        mes_ano: parsedProgram.mes_ano
      });

      setText('');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error importing program:', error);
      toast({
        title: 'Erro ao importar',
        description: 'Não foi possível salvar o programa. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const sampleText = `PROGRAMA DA REUNIÃO — VIDA E MINISTÉRIO CRISTÃO
11-17 de agosto de 2024

CÂNTICOS: 88, 94, 89
LEITURA DA BÍBLIA: PROVÉRBIOS 26

TESOUROS DA PALAVRA DE DEUS

• Fique longe de quem é tolo (10 min.)
• Joias espirituais (8 min.)
• Leitura da Bíblia (4 min. ou menos)

FAÇA SEU MELHOR NO MINISTÉRIO

• Primeira conversa (3 min. ou menos)
• Primeira revisita (4 min. ou menos)
• Estudo bíblico (5 min. ou menos)

NOSSA VIDA CRISTÃ

• Cântico 94
• Precisa de ajuda para lidar com a ansiedade? (15 min.)
• Estudo bíblico de congregação (30 min.)
• Comentários finais (3 min. ou menos)
• Cântico 89 e oração`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Importar Manualmente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importação Manual de Programa
          </DialogTitle>
          <DialogDescription>
            Cole o texto da apostila do mês copiado do site JW.org ou de um PDF.
            O sistema irá extrair automaticamente as informações do programa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apostila-text">Texto da Apostila</Label>
            <Textarea
              id="apostila-text"
              placeholder="Cole aqui o texto da semana da apostila..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setText(sampleText)}
              className="text-xs text-muted-foreground"
            >
              Usar exemplo
            </Button>
          </div>

          {/* Validation feedback */}
          {text.trim().length > 0 && (
            <div className="space-y-3">
              {isValid ? (
                <Alert className="bg-green-500/10 border-green-500/20">
                  <Check className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-600">
                    Texto válido! {parseResult?.semanas.length || 0} semana(s) extraída(s) com sucesso.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {validation.problemas.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {parseResult?.erros.map((error, i) => (
                        <li key={`err-${i}`}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview toggle */}
              {parsedProgram && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Ocultar Prévia
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Dados Extraídos
                    </>
                  )}
                </Button>
              )}

              {/* Preview of extracted data */}
              {showPreview && parsedProgram && (
                <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">
                      {format(new Date(parsedProgram.semana_inicio), "d 'de' MMMM", { locale: ptBR })} - {format(new Date(parsedProgram.semana_fim), "d 'de' MMMM", { locale: ptBR })}
                    </h4>
                    <Badge variant="outline">{parsedProgram.mes_ano}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Leitura:</span>{' '}
                      {parsedProgram.leitura_biblica || 'Não identificada'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cânticos:</span>{' '}
                      {parsedProgram.cantico_inicial}, {parsedProgram.cantico_meio}, {parsedProgram.cantico_final}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Partes ({parsedProgram.partes.length})</h5>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {parsedProgram.partes.map((parte, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs p-2 rounded bg-background"
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                parte.secao === 'tesouros'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  : parte.secao === 'ministerio'
                                  ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                                  : 'bg-red-500/10 text-red-600 border-red-500/20'
                              }
                            >
                              {parte.secao === 'tesouros' ? 'T' : parte.secao === 'ministerio' ? 'M' : 'V'}
                            </Badge>
                            <span className="truncate max-w-[300px]">{parte.titulo}</span>
                          </div>
                          <span className="text-muted-foreground">{parte.duracao_min} min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!isValid || loading}
          >
            {loading ? 'Importando...' : `Importar ${parseResult?.semanas.length || 0} Semana(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
