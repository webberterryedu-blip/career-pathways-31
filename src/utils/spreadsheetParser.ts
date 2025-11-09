import * as XLSX from 'xlsx';
import {
  SpreadsheetRow,
  ProcessedStudentData,
  ValidationResult,
  ImportSummary,
  GENDER_MAPPING,
  CARGO_MAPPING,
  STATUS_MAPPING,
  BOOLEAN_MAPPING
} from '@/types/spreadsheet';
import { Cargo, Genero } from '@/types/estudantes';

// Parse Excel file to JSON
export const parseExcelFile = async (file: File): Promise<SpreadsheetRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
          raw: false,
          defval: null 
        });
        resolve(jsonData as SpreadsheetRow[]);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
};

// Normalize field names (handle variations)
const normalizeFieldName = (row: SpreadsheetRow, ...possibleNames: string[]): any => {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
  }
  return null;
};

// Parse date in DD/MM/YYYY format
const parseDate = (dateStr: string | null): string | null => {
  if (!dateStr) return null;
  
  try {
    // Handle DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try parsing as ISO date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    return null;
  }
  
  return null;
};

// Convert boolean values
const parseBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    return BOOLEAN_MAPPING[normalized] ?? false;
  }
  return false;
};

// Process a single row
export const processRow = (row: SpreadsheetRow, rowIndex: number): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Extract and normalize fields
  const nome = normalizeFieldName(row, 'nome', 'Nome Completo', 'name');
  const familia = normalizeFieldName(row, 'familia', 'Família / Agrupamento', 'sobrenome', 'family');
  const idadeRaw = normalizeFieldName(row, 'idade', 'Idade', 'age');
  const generoRaw = normalizeFieldName(row, 'genero', 'Gênero (M/F)', 'gender');
  const cargoRaw = normalizeFieldName(row, 'cargo', 'Cargo Congregacional', 'role');
  const ativoRaw = normalizeFieldName(row, 'ativo', 'Status (Ativo/Inativo)', 'active');
  const email = normalizeFieldName(row, 'email', 'E-mail');
  const telefone = normalizeFieldName(row, 'telefone', 'Telefone', 'phone');
  const dataBatismo = normalizeFieldName(row, 'data_batismo', 'Data de Batismo');
  const dataNascimento = normalizeFieldName(row, 'data_nascimento', 'Data de Nascimento');
  const observacoes = normalizeFieldName(row, 'observacoes', 'Observações', 'notes');

  // Validate required fields
  if (!nome || nome.toString().trim().length < 2) {
    errors.push('Nome é obrigatório e deve ter pelo menos 2 caracteres');
  }

  if (!familia || familia.toString().trim().length === 0) {
    errors.push('Família/Sobrenome é obrigatório');
  }

  // Parse idade
  const idade = idadeRaw ? parseInt(idadeRaw.toString()) : null;
  if (idade !== null && (isNaN(idade) || idade < 1 || idade > 120)) {
    errors.push('Idade deve estar entre 1 e 120');
  }

  // Parse genero
  let genero: Genero | null = null;
  if (generoRaw) {
    const generoStr = generoRaw.toString().trim();
    genero = GENDER_MAPPING[generoStr] || null;
    if (!genero) {
      errors.push(`Gênero inválido: "${generoStr}". Use "masculino" ou "feminino"`);
    }
  } else {
    errors.push('Gênero é obrigatório');
  }

  // Parse cargo
  let cargo: Cargo = 'estudante_novo';
  if (cargoRaw) {
    const cargoStr = cargoRaw.toString().trim();
    cargo = CARGO_MAPPING[cargoStr] || 'estudante_novo';
  }

  // Parse ativo
  let ativo = true;
  if (ativoRaw !== null && ativoRaw !== undefined) {
    const ativoStr = ativoRaw.toString().trim();
    ativo = STATUS_MAPPING[ativoStr] ?? true;
  }

  // Validate email format
  if (email && email.toString().trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.toString())) {
      warnings.push('Formato de email inválido');
    }
  }

  // Parse dates
  const dataBatismoFormatted = parseDate(dataBatismo?.toString() || null);
  const dataNascimentoFormatted = parseDate(dataNascimento?.toString() || null);

  if (dataBatismo && !dataBatismoFormatted) {
    warnings.push('Data de batismo inválida - será ignorada');
  }

  if (dataNascimento && !dataNascimentoFormatted) {
    warnings.push('Data de nascimento inválida - será ignorada');
  }

  // Check for minors without guardians
  if (idade !== null && idade < 18) {
    const responsavel = normalizeFieldName(row, 'parente_responsavel', 'responsavel_primario');
    if (!responsavel) {
      warnings.push('Menor de idade sem responsável definido');
    }
  }

  // Parse privilege fields
  const chairman = parseBoolean(normalizeFieldName(row, 'chairman', 'presidente'));
  const pray = parseBoolean(normalizeFieldName(row, 'pray', 'oracao'));
  const treasures = parseBoolean(normalizeFieldName(row, 'treasures', 'tresures', 'tesouros'));
  const gems = parseBoolean(normalizeFieldName(row, 'gems', 'joias'));
  const reading = parseBoolean(normalizeFieldName(row, 'reading', 'leitura'));
  const starting = parseBoolean(normalizeFieldName(row, 'starting', 'primeira_conversa'));
  const following = parseBoolean(normalizeFieldName(row, 'following', 'revisita'));
  const making = parseBoolean(normalizeFieldName(row, 'making', 'estudo'));
  const explaining = parseBoolean(normalizeFieldName(row, 'explaining', 'explicando'));
  const talk = parseBoolean(normalizeFieldName(row, 'talk', 'discurso'));

  // Build processed data
  const data: ProcessedStudentData = {
    nome: nome?.toString().trim() || '',
    familia: familia?.toString().trim() || '',
    idade: idade || undefined,
    genero: genero!,
    email: email?.toString().trim() || undefined,
    telefone: telefone?.toString().trim() || undefined,
    data_batismo: dataBatismoFormatted || undefined,
    data_nascimento: dataNascimentoFormatted || undefined,
    cargo,
    ativo,
    observacoes: observacoes?.toString().trim() || undefined,
    chairman,
    pray,
    treasures,
    gems,
    reading,
    starting,
    following,
    making,
    explaining,
    talk
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data: errors.length === 0 ? data : undefined,
    rowIndex
  };
};

// Validate entire spreadsheet
export const validateSpreadsheet = (rows: SpreadsheetRow[]): ImportSummary => {
  const results = rows.map((row, index) => processRow(row, index + 2)); // +2 for header row + 1-based index
  
  const validResults = results.filter(r => r.isValid);
  const invalidResults = results.filter(r => !r.isValid);
  const warningResults = results.filter(r => r.warnings.length > 0);

  return {
    totalRows: rows.length,
    validRows: validResults.length,
    invalidRows: invalidResults.length,
    imported: 0,
    errors: invalidResults,
    warnings: warningResults
  };
};

// Generate error report CSV
export const generateErrorReport = (summary: ImportSummary, filename: string): string => {
  const timestamp = new Date().toISOString();
  let csv = `Relatório de Erros de Importação\n`;
  csv += `Arquivo: ${filename}\n`;
  csv += `Data: ${timestamp}\n`;
  csv += `Total de registros: ${summary.totalRows}\n`;
  csv += `Registros válidos: ${summary.validRows}\n`;
  csv += `Registros inválidos: ${summary.invalidRows}\n\n`;
  
  csv += `Linha,Tipo,Campo,Problema\n`;
  
  summary.errors.forEach(error => {
    error.errors.forEach(msg => {
      csv += `${error.rowIndex},Erro,"${msg}"\n`;
    });
  });
  
  summary.warnings.forEach(warning => {
    warning.warnings.forEach(msg => {
      csv += `${warning.rowIndex},Aviso,"${msg}"\n`;
    });
  });
  
  return csv;
};

// Download error report
export const downloadErrorReport = (summary: ImportSummary, filename: string) => {
  const csv = generateErrorReport(summary, filename);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `erros_${filename}_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};