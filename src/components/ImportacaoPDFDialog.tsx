import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Calendar,
  Music,
  BookOpen,
  X
} from 'lucide-react';
import { extractTextFromPDF, isValidPDF, normalizeExtractedText } from '@/lib/pdfExtractor';
import { parseApostilaText, validarParsing, SemanaParsed } from '@/lib/parsers/apostilaTextParser';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImportacaoPDFDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ImportStep = 'upload' | 'extracting' | 'parsing' | 'preview' | 'saving' | 'complete' | 'error';

export function ImportacaoPDFDialog({ open, onOpenChange, onSuccess }: ImportacaoPDFDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [parsedSemanas, setParsedSemanas] = useState<SemanaParsed[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setStep('upload');
    setFile(null);
    setExtractedText('');
    setParsedSemanas([]);
    setErrors([]);
    setWarnings([]);
    setProgress(0);
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!isValidPDF(selectedFile)) {
      setErrors(['Por favor, selecione um arquivo PDF válido']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setWarnings([]);
    setStep('extracting');
    setProgress(10);

    try {
      // Extract text from PDF
      const result = await extractTextFromPDF(selectedFile);
      setProgress(40);

      if (!result.success) {
        setErrors([result.error || 'Erro ao extrair texto do PDF']);
        setStep('error');
        return;
      }

      const normalizedText = normalizeExtractedText(result.text);
      setExtractedText(normalizedText);
      setStep('parsing');
      setProgress(60);

      // Parse the text
      const parseResult = parseApostilaText(normalizedText);
      setProgress(80);

      if (!parseResult.success) {
        setErrors(parseResult.erros);
        setWarnings(parseResult.avisos);
        setStep('error');
        return;
      }

      // Validate the result
      const validacao = validarParsing(parseResult);
      
      setParsedSemanas(parseResult.semanas);
      setWarnings([...parseResult.avisos, ...validacao.problemas]);
      setProgress(100);
      setStep('preview');

    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      setErrors([error instanceof Error ? error.message : 'Erro ao processar o arquivo']);
      setStep('error');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleSave = useCallback(async () => {
    if (parsedSemanas.length === 0) return;

    setStep('saving');
    setProgress(0);

    try {
      let saved = 0;
      const total = parsedSemanas.length;

      for (const semana of parsedSemanas) {
        // Convert parts to expected JSON format
        const partesJson = semana.partes.map((parte, index) => ({
          ordem: index + 1,
          titulo: parte.titulo,
          duracao: parte.duracao_min,
          secao: parte.secao,
          tipo: parte.tipo,
          requer_assistente: parte.requer_assistente || false,
          genero_requerido: parte.genero_requerido || null
        }));

        // Check if program already exists for this week
        const { data: existing } = await supabase
          .from('programas_oficiais')
          .select('id')
          .eq('semana_inicio', semana.semana_inicio)
          .eq('idioma', 'pt')
          .maybeSingle();

        if (existing) {
          // Update existing
          await supabase
            .from('programas_oficiais')
            .update({
              semana_fim: semana.semana_fim,
              mes_ano: semana.mes_ano,
              tema: semana.tema,
              leitura_biblica: semana.leitura_biblica,
              cantico_inicial: semana.cantico_inicial,
              cantico_meio: semana.cantico_meio,
              cantico_final: semana.cantico_final,
              partes: partesJson,
              ultima_sincronizacao: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        } else {
          // Create new
          await supabase
            .from('programas_oficiais')
            .insert({
              semana_inicio: semana.semana_inicio,
              semana_fim: semana.semana_fim,
              mes_ano: semana.mes_ano,
              idioma: 'pt',
              tema: semana.tema,
              leitura_biblica: semana.leitura_biblica,
              cantico_inicial: semana.cantico_inicial,
              cantico_meio: semana.cantico_meio,
              cantico_final: semana.cantico_final,
              partes: partesJson,
              ultima_sincronizacao: new Date().toISOString()
            });
        }

        saved++;
        setProgress(Math.round((saved / total) * 100));
      }

      // Log the sync
      await supabase
        .from('sincronizacoes_jworg')
        .insert({
          idioma: 'pt',
          status: 'sucesso',
          programas_importados: saved,
          mes_ano: parsedSemanas[0]?.mes_ano
        });

      setStep('complete');
      
      toast({
        title: 'Importação concluída!',
        description: `${saved} semana(s) importada(s) com sucesso.`
      });

      onSuccess?.();

    } catch (error) {
      console.error('Erro ao salvar programas:', error);
      setErrors([error instanceof Error ? error.message : 'Erro ao salvar no banco de dados']);
      setStep('error');
    }
  }, [parsedSemanas, toast, onSuccess]);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [resetState, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importar Programas via PDF
          </DialogTitle>
          <DialogDescription>
            Faça upload do PDF da apostila Vida e Ministério Cristão para importar múltiplas semanas
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Upload Step */}
          {step === 'upload' && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Arraste o PDF aqui</h3>
              <p className="text-sm text-muted-foreground mb-4">
                ou clique para selecionar o arquivo
              </p>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleInputChange}
                className="hidden"
                id="pdf-upload"
              />
              <Button asChild variant="outline">
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  Selecionar Arquivo
                </label>
              </Button>
            </div>
          )}

          {/* Extracting/Parsing Steps */}
          {(step === 'extracting' || step === 'parsing') && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <h3 className="text-lg font-medium mb-2">
                {step === 'extracting' ? 'Extraindo texto do PDF...' : 'Analisando conteúdo...'}
              </h3>
              <Progress value={progress} className="w-full max-w-xs mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Semanas Encontradas</h3>
                <Badge variant="secondary">{parsedSemanas.length} semana(s)</Badge>
              </div>

              {warnings.length > 0 && (
                <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription>
                    <strong>Avisos:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {warnings.slice(0, 3).map((w, i) => (
                        <li key={i} className="text-sm">{w}</li>
                      ))}
                      {warnings.length > 3 && (
                        <li className="text-sm">...e mais {warnings.length - 3} avisos</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <ScrollArea className="h-[300px] border rounded-lg p-4">
                {parsedSemanas.map((semana, index) => (
                  <div key={index} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {semana.semana_inicio} a {semana.semana_fim}
                      </span>
                    </div>
                    
                    {semana.tema && semana.tema !== 'Programa da Semana' && (
                      <p className="text-sm text-muted-foreground mb-2 ml-6">
                        {semana.tema}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 ml-6 mb-2">
                      {semana.cantico_inicial > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Music className="h-3 w-3 mr-1" />
                          {semana.cantico_inicial}
                        </Badge>
                      )}
                      {semana.cantico_meio > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Music className="h-3 w-3 mr-1" />
                          {semana.cantico_meio}
                        </Badge>
                      )}
                      {semana.cantico_final > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Music className="h-3 w-3 mr-1" />
                          {semana.cantico_final}
                        </Badge>
                      )}
                      {semana.leitura_biblica && (
                        <Badge variant="outline" className="text-xs">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {semana.leitura_biblica}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground ml-6">
                      {semana.partes.length} parte(s) identificada(s)
                    </p>

                    {index < parsedSemanas.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {/* Saving Step */}
          {step === 'saving' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <h3 className="text-lg font-medium mb-2">Salvando programas...</h3>
              <Progress value={progress} className="w-full max-w-xs mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-medium mb-2">Importação Concluída!</h3>
              <p className="text-sm text-muted-foreground">
                {parsedSemanas.length} semana(s) foram importadas com sucesso.
              </p>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erro(s) encontrado(s):</strong>
                  <ul className="list-disc list-inside mt-1">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>

              {file && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm flex-1">{file.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={resetState}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={resetState}>
                Escolher Outro Arquivo
              </Button>
              <Button onClick={handleSave} disabled={parsedSemanas.length === 0}>
                Importar {parsedSemanas.length} Semana(s)
              </Button>
            </>
          )}

          {step === 'error' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={resetState}>
                Tentar Novamente
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
