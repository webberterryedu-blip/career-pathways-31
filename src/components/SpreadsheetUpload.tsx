import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  parseExcelFile,
  validateSpreadsheet,
  downloadErrorReport
} from '@/utils/spreadsheetParser';
import { ImportSummary, ProcessedStudentData } from '@/types/spreadsheet';

interface SpreadsheetUploadProps {
  onImportComplete?: () => void;
}

export default function SpreadsheetUpload({ onImportComplete }: SpreadsheetUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      if (!validTypes.includes(selectedFile.type) && 
          !selectedFile.name.endsWith('.xlsx') && 
          !selectedFile.name.endsWith('.xls') &&
          !selectedFile.name.endsWith('.csv')) {
        toast.error('Tipo de arquivo inválido. Use .xlsx, .xls ou .csv');
        return;
      }
      
      setFile(selectedFile);
      setSummary(null);
      setProgress(0);
    }
  };

  const insertStudents = async (students: ProcessedStudentData[]) => {
    const batchSize = 50;
    let imported = 0;

    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      
      const dbRecords = batch.map(student => ({
        nome: student.nome,
        sobrenome: student.familia,
        familia: student.familia,
        idade: student.idade,
        genero: student.genero,
        email: student.email,
        telefone: student.telefone,
        data_batismo: student.data_batismo,
        data_nascimento: student.data_nascimento,
        privilegio: student.cargo,
        ativo: student.ativo,
        observacoes: student.observacoes,
        chairman: student.chairman,
        pray: student.pray,
        treasures: student.treasures,
        gems: student.gems,
        reading: student.reading,
        starting: student.starting,
        following: student.following,
        making: student.making,
        explaining: student.explaining,
        talk: student.talk
      }));

      const { error } = await supabase
        .from('estudantes')
        .insert(dbRecords);

      if (error) {
        throw error;
      }

      imported += batch.length;
      setProgress((imported / students.length) * 100);
    }

    return imported;
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);

    try {
      toast.info('Lendo arquivo...');
      const rows = await parseExcelFile(file);

      if (rows.length === 0) {
        toast.error('Arquivo vazio ou formato inválido');
        setImporting(false);
        return;
      }

      toast.info('Validando dados...');
      const validationSummary = validateSpreadsheet(rows);
      setSummary(validationSummary);

      if (validationSummary.invalidRows > 0) {
        toast.error(
          `Encontrados ${validationSummary.invalidRows} erros. Corrija-os antes de importar.`,
          { duration: 5000 }
        );
        setImporting(false);
        return;
      }

      toast.info('Importando estudantes...');
      const validStudents = validationSummary.errors
        .filter(r => r.isValid && r.data)
        .map(r => r.data!);

      const imported = await insertStudents(validStudents);

      validationSummary.imported = imported;
      setSummary(validationSummary);

      toast.success(
        `✅ Importação concluída! ${imported} estudante(s) importado(s)`,
        { duration: 5000 }
      );

      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onImportComplete?.();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Erro na importação: ${error.message}`);
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const handleDownloadErrors = () => {
    if (summary && file) {
      downloadErrorReport(summary, file.name);
      toast.success('Relatório de erros baixado');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importar Planilha de Estudantes
        </CardTitle>
        <CardDescription>
          Faça upload de um arquivo Excel (.xlsx, .xls) ou CSV com os dados dos estudantes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
            disabled={importing}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="h-4 w-4 mr-2" />
            Selecionar Arquivo
          </Button>
          {file && (
            <span className="text-sm text-muted-foreground">
              {file.name}
            </span>
          )}
        </div>

        {file && !importing && (
          <Button onClick={handleImport} className="w-full">
            Importar Estudantes
          </Button>
        )}

        {importing && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              Importando... {Math.round(progress)}%
            </p>
          </div>
        )}

        {summary && !importing && (
          <div className="space-y-4">
            {summary.imported > 0 && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">
                  Importação Concluída
                </AlertTitle>
                <AlertDescription className="text-green-700">
                  {summary.imported} estudante(s) importado(s) com sucesso
                </AlertDescription>
              </Alert>
            )}

            {summary.invalidRows > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>
                  Erros Encontrados ({summary.invalidRows})
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1">
                    {summary.errors.slice(0, 5).map((error, idx) => (
                      <div key={idx} className="text-sm">
                        <strong>Linha {error.rowIndex}:</strong>{' '}
                        {error.errors.join(', ')}
                      </div>
                    ))}
                    {summary.errors.length > 5 && (
                      <div className="text-sm italic">
                        E mais {summary.errors.length - 5} erro(s)...
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadErrors}
                    className="mt-3"
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Baixar Relatório Completo
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {summary.warnings.length > 0 && summary.invalidRows === 0 && (
              <Alert className="border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">
                  Avisos ({summary.warnings.length})
                </AlertTitle>
                <AlertDescription className="text-yellow-700">
                  <div className="mt-2 space-y-1">
                    {summary.warnings.slice(0, 3).map((warning, idx) => (
                      <div key={idx} className="text-sm">
                        <strong>Linha {warning.rowIndex}:</strong>{' '}
                        {warning.warnings.join(', ')}
                      </div>
                    ))}
                    {summary.warnings.length > 3 && (
                      <div className="text-sm italic">
                        E mais {summary.warnings.length - 3} aviso(s)...
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.totalRows}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {summary.validRows}
                </div>
                <div className="text-xs text-muted-foreground">Válidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {summary.invalidRows}
                </div>
                <div className="text-xs text-muted-foreground">Inválidos</div>
              </div>
            </div>
          </div>
        )}

        <Alert>
          <AlertDescription className="text-xs">
            <strong>Formato esperado:</strong> Colunas obrigatórias - nome, familia, idade, genero, cargo, ativo.
            Opcionais - email, telefone, data_batismo, observacoes, privilégios (chairman, pray, treasures, etc.)
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}