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
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
          raw: true,
          defval: null 
        });
        resolve(jsonData as SpreadsheetRow[]);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

// Normalize field names (handle variations)
const normalizeFieldName = (row: SpreadsheetRow, ...possibleNames: string[]): any => {
  const normalize = (value: string) => value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  for (const name of possibleNames) {
    const key = Object.keys(row).find(key => normalize(key) === normalize(name));
    if (key && row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return null;
};

// Parse date in DD/MM/YYYY format
const parseDate = (dateStr: string | Date | number | null): string | null => {
  if (!dateStr) return null;
  try {
    if (dateStr instanceof Date) {
      return Number.isNaN(dateStr.getTime()) ? null : `${dateStr.getFullYear()}-${String(dateStr.getMonth() + 1).padStart(2, '0')}-${String(dateStr.getDate()).padStart(2, '0')}`;
    }
    if (typeof dateStr === 'number') {
      const date = XLSX.SSF.parse_date_code(dateStr);
      return date ? parseDate(`${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`) : null;
    }
    const text = dateStr.trim();
    const br = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/);
    const canonical = br ? `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}` : iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : null;
    if (!canonical) return null;
    const date = new Date(`${canonical}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === canonical ? canonical : null;
  } catch (e) {
    return null;
  }
  
  return null;
};

// Convert boolean values
const parseBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  return BOOLEAN_MAPPING[normalized] ?? BOOLEAN_MAPPING[normalized.toUpperCase()] ?? false;
};

// Process a single row
export const processRow = (row: SpreadsheetRow, rowIndex: number): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Extract and normalize fields
  const nome = normalizeFieldName(row, 'nome', 'Nome Completo', 'name');
  const familia = normalizeFieldName(row, 'familia', 'Família / Agrupamento', 'sobrenome', 'family');
  const idadeRaw = normalizeFieldName(row, 'idade', 'Idade', 'age');
  const generoRaw = normalizeFieldName(row, 'genero', 'Gênero (M/F)', 'gender', 'sexo');
  const cargoRaw = normalizeFieldName(row, 'cargo', 'Cargo Congregacional', 'role', 'privilegio');
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
  const idade = idadeRaw !== null ? Number(idadeRaw) : null;
  if (idade !== null && (!Number.isInteger(idade) || idade < 1 || idade > 120)) {
    errors.push('Idade deve estar entre 1 e 120');
  }

  // Parse genero
  let genero: Genero | null = null;
  if (generoRaw) {
    const generoStr = generoRaw.toString().trim().toLowerCase();
    genero = GENDER_MAPPING[generoStr] || GENDER_MAPPING[generoStr.toUpperCase()] || null;
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
    const key = Object.keys(CARGO_MAPPING).find(key => key.toLowerCase() === cargoStr.toLowerCase());
    if (key) cargo = CARGO_MAPPING[key];
    else errors.push(`Cargo inválido: "${cargoStr}"`);
  }

  // Parse ativo
  let ativo = true;
  if (ativoRaw !== null && ativoRaw !== undefined) {
    const ativoStr = ativoRaw.toString().trim().toLowerCase();
    const parsed = STATUS_MAPPING[ativoStr] ?? BOOLEAN_MAPPING[ativoStr] ?? BOOLEAN_MAPPING[ativoStr.toUpperCase()];
    if (parsed === undefined) errors.push('Status inválido: use ativo, inativo, verdadeiro ou falso');
    else ativo = parsed;
  }

  // Validate email format
  if (email && email.toString().trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.toString())) {
      errors.push('Formato de email inválido');
    }
  }

  // Parse dates
  const dataBatismoFormatted = parseDate(dataBatismo);
  const dataNascimentoFormatted = parseDate(dataNascimento);

  if (dataBatismo && !dataBatismoFormatted) {
    warnings.push('Data de batismo inválida - será ignorada');
  }

  if (dataNascimento && !dataNascimentoFormatted) {
    errors.push('Data de nascimento inválida');
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

  if (errors.length > 0 || !genero) return { isValid: false, errors, warnings, rowIndex };

  const familyFields = ['family_id', 'id_pai', 'id_mae', 'id_conjuge', 'responsavel_primario', 'responsavel_secundario'] as const;
  const familyData: Partial<ProcessedStudentData> = {};
  for (const field of familyFields) {
    const value = normalizeFieldName(row, field);
    if (value !== null) {
      const text = String(value).trim();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) errors.push(`${field}: identificador inválido`);
      else familyData[field] = text;
    }
  }
  // Imported students do not need an authentication account.
  const data: ProcessedStudentData = {
    nome: nome?.toString().trim() || '',
    familia: familia?.toString().trim() || '',
    idade: idade || undefined,
    genero,
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
    talk,
    ...familyData,
    estado_civil: normalizeFieldName(row, 'estado_civil')?.toString().trim() || undefined,
    papel_familiar: normalizeFieldName(row, 'papel_familiar')?.toString().trim() || undefined,
    coabitacao: parseBoolean(normalizeFieldName(row, 'coabitacao')),
    menor: (idade !== null && idade < 18) || parseBoolean(normalizeFieldName(row, 'menor'))
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
    warnings: warningResults,
    validStudents: validResults.flatMap(result => result.data ? [result.data] : [])
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
  URL.revokeObjectURL(url);
};