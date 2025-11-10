import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { isValidPDFFile, parseProgramPDF, ParsedProgram } from '@/utils/pdfParser';

interface ProgramPDFUploadProps {
  onProgramsParsed?: (programs: ParsedProgram[]) => void;
}

export default function ProgramPDFUpload({ onProgramsParsed }: ProgramPDFUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedPrograms, setParsedPrograms] = useState<ParsedProgram[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (selectedFile) {
      if (!isValidPDFFile(selectedFile)) {
        toast.error('Formato inválido. Selecione um arquivo PDF');
        return;
      }
      
      setFile(selectedFile);
      setParsedPrograms([]);
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setParsing(true);
    
    try {
      toast.info('Extraindo dados do PDF...');
      
      const programs = await parseProgramPDF(file);
      
      setParsedPrograms(programs);
      
      toast.success(
        `✅ PDF processado! ${programs.length} semana(s) encontrada(s)`,
        { duration: 5000 }
      );
      
      onProgramsParsed?.(programs);
      
    } catch (error: any) {
      console.error('PDF parsing error:', error);
      toast.error(`Erro ao processar PDF: ${error.message}`);
    } finally {
      setParsing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Importar Programa da Apostila
        </CardTitle>
        <CardDescription>
          Faça upload do PDF da apostila MWB (Vida e Ministério Cristãos)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Funcionalidade em Desenvolvimento:</strong> O parser de PDF está sendo implementado. 
            Por enquanto, retorna dados de exemplo para demonstração.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={parsing}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
          >
            <Upload className="h-4 w-4 mr-2" />
            Selecionar PDF
          </Button>
          {file && (
            <span className="text-sm text-muted-foreground">
              {file.name}
            </span>
          )}
        </div>

        {file && !parsing && parsedPrograms.length === 0 && (
          <Button onClick={handleParse} className="w-full">
            Processar PDF
          </Button>
        )}

        {parsing && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">
                Processando PDF...
              </p>
            </div>
          </div>
        )}

        {parsedPrograms.length > 0 && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <strong>{parsedPrograms.length} semana(s) extraída(s) com sucesso!</strong>
              <div className="mt-2 space-y-1">
                {parsedPrograms.slice(0, 3).map((program, idx) => (
                  <div key={idx} className="text-xs">
                    • {program.date} - {program.parts.length} partes
                  </div>
                ))}
                {parsedPrograms.length > 3 && (
                  <div className="text-xs italic">
                    E mais {parsedPrograms.length - 3} semana(s)...
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertDescription className="text-xs">
            <strong>Formato esperado:</strong> PDF da apostila "Vida e Ministério Cristãos" (mwb_PT.pdf).
            O sistema irá extrair automaticamente as partes, tempos e requisitos de cada semana.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
