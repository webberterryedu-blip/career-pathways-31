import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { saveImportedStudents } from '@/utils/studentImport';
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
  const [validated, setValidated] = useState(false);
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
      
      setValidated(false);
      setFile(selectedFile);
      setSummary(null);
      setProgress(0);
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    setImporting(true);
    setValidated(false);
    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) throw new Error('A planilha está vazia');
      const result = validateSpreadsheet(rows);
      setSummary(result);
      setValidated(result.invalidRows === 0 && result.validRows > 0);
      if (result.invalidRows > 0) toast.error('Corrija as linhas indicadas antes de confirmar a importação');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao ler planilha');
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async () => {
    if (!validated || !summary?.validStudents?.length) return;
    setImporting(true);
    setProgress(10);
    try {
      const imported = await saveImportedStudents(summary.validStudents);
      setSummary({ ...summary, imported });
      setProgress(100);
      setValidated(false);
      toast.success(`${imported} estudante(s) salvo(s) com sucesso`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onImportComplete?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar estudantes');
    } finally {
      setImporting(false);
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
        <div className="flex flex-wrap items-center gap-4">
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
            <span className="min-w-0 break-all text-sm text-muted-foreground">
              {file.name}
            </span>
          )}
        </div>

        {file && !importing && (
          <Button onClick={handleValidate} className="w-full" variant="outline">
            Validar Planilha
          </Button>
        )}

        {validated && summary && !importing && (
          <div className="space-y-3">
            <div className="max-h-64 overflow-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted"><tr><th className="p-2 text-left">Nome</th><th className="p-2 text-left">Família</th><th className="p-2 text-left">Gênero</th><th className="p-2 text-left">Status</th></tr></thead>
                <tbody>{summary.validStudents?.slice(0, 20).map((student, index) => <tr key={index} className="border-t"><td className="p-2">{student.nome}</td><td className="p-2">{student.familia}</td><td className="p-2">{student.genero}</td><td className="p-2">{student.ativo ? 'Ativo' : 'Inativo'}</td></tr>)}</tbody>
              </table>
            </div>
            <Button onClick={handleImport} className="w-full">Confirmar importação de {summary.validRows} estudante(s)</Button>
          </div>
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
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-foreground" />
                <AlertTitle className="text-foreground">
                  Importação Concluída
                </AlertTitle>
                <AlertDescription className="text-foreground">
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
                    {summary.errors.filter(result => !result.isValid).slice(0, 5).map((error, idx) => (
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
              <Alert>
                <AlertTriangle className="h-4 w-4 text-foreground" />
                <AlertTitle className="text-foreground">
                  Avisos ({summary.warnings.length})
                </AlertTitle>
                <AlertDescription className="text-foreground">
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
                <div className="text-2xl font-bold text-foreground">
                  {summary.validRows}
                </div>
                <div className="text-xs text-muted-foreground">Válidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {summary.invalidRows}
                </div>
                <div className="text-xs text-muted-foreground">Inválidos</div>
              </div>
            </div>
          </div>
        )}

        <Alert>
          <AlertDescription className="text-xs">
            <strong>Formato esperado:</strong> Colunas obrigatórias - nome, familia e genero.
            Opcionais - idade, cargo, ativo, email, telefone, data_batismo, observacoes, privilégios (chairman, pray, treasures, etc.)
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}