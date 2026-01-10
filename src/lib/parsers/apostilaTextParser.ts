/**
 * Parser for manually pasted workbook (apostila) text content
 * Extracts program data from copy/pasted text from JW.org or PDF
 * Supports parsing multiple weeks at once
 */

export interface ParteParsed {
  ordem: number;
  titulo: string;
  duracao_min: number;
  tipo: string;
  secao: 'tesouros' | 'ministerio' | 'vida_crista';
  referencia?: string;
  requer_assistente?: boolean;
  genero_requerido?: 'masculino' | 'feminino';
}

export interface SemanaParsed {
  semana_inicio: string;
  semana_fim: string;
  mes_ano: string;
  tema: string;
  leitura_biblica: string;
  cantico_inicial: number;
  cantico_meio: number;
  cantico_final: number;
  partes: ParteParsed[];
}

export interface ParseResult {
  success: boolean;
  semanas: SemanaParsed[];
  erros: string[];
  avisos: string[];
}

// Map of months in Portuguese
const monthMap: Record<string, number> = {
  'janeiro': 1, 'fevereiro': 2, 'março': 3, 'marco': 3, 'abril': 4,
  'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
  'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
};

/**
 * Parse the date range from text like "11-17 de agosto de 2024"
 */
function parseDateRange(text: string): { inicio: Date; fim: Date; mesAno: string } | null {
  // Pattern: "6-12 de janeiro" or "6-12 de janeiro de 2025"
  const datePatterns = [
    /(\d{1,2})[-–]\s*(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+)?(\d{4})?/i,
    /(\d{1,2})\s+a\s+(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+)?(\d{4})?/i,
    /(\d{1,2})\s+de\s+(\w+)\s*[-–a]\s*(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+)?(\d{4})?/i
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      let startDay: number, endDay: number, monthStr: string, year: number;

      if (match.length === 6 && match[4]) {
        // Pattern: "6 de janeiro - 12 de janeiro"
        startDay = parseInt(match[1]);
        endDay = parseInt(match[3]);
        monthStr = match[4].toLowerCase();
        year = match[5] ? parseInt(match[5]) : new Date().getFullYear();
      } else {
        startDay = parseInt(match[1]);
        endDay = parseInt(match[2]);
        monthStr = match[3].toLowerCase();
        year = match[4] ? parseInt(match[4]) : new Date().getFullYear();
      }

      const month = monthMap[monthStr];
      if (!month) continue;

      const inicio = new Date(year, month - 1, startDay);
      const fim = new Date(year, month - 1, endDay);
      const mesAno = `${year}-${String(month).padStart(2, '0')}`;

      return { inicio, fim, mesAno };
    }
  }

  return null;
}

/**
 * Extract songs from text
 */
function extractSongs(text: string): number[] {
  const songs: number[] = [];

  // Pattern: "CÂNTICOS: 88, 94, 89"
  const groupedMatch = text.match(/CÂNTICOS?:\s*([\d,\s]+)/i);
  if (groupedMatch) {
    const nums = groupedMatch[1].match(/\d+/g);
    if (nums) {
      songs.push(...nums.map(n => parseInt(n)));
    }
  }

  // If not found, look for individual "Cântico X"
  if (songs.length === 0) {
    const singlePattern = /(?:Cântico|CÂNTICO)\s+(\d+)/gi;
    let match;
    while ((match = singlePattern.exec(text)) !== null) {
      const num = parseInt(match[1]);
      if (!songs.includes(num)) {
        songs.push(num);
      }
    }
  }

  return songs;
}

/**
 * Determine the type of a part based on its title and section
 */
function determineTipo(titulo: string, secao: string): { tipo: string; requer_assistente: boolean; genero_requerido?: 'masculino' | 'feminino' } {
  const tituloLower = titulo.toLowerCase();

  if (secao === 'tesouros') {
    if (tituloLower.includes('joias') || tituloLower.includes('gems')) {
      return { tipo: 'joias_espirituais', requer_assistente: false, genero_requerido: 'masculino' };
    }
    if (tituloLower.includes('leitura') && tituloLower.includes('bíblia')) {
      return { tipo: 'leitura_biblia', requer_assistente: false, genero_requerido: 'masculino' };
    }
    return { tipo: 'discurso_tesouros', requer_assistente: false, genero_requerido: 'masculino' };
  }

  if (secao === 'ministerio') {
    if (tituloLower.includes('primeira conversa') || tituloLower.includes('iniciando')) {
      return { tipo: 'primeira_conversa', requer_assistente: true };
    }
    if (tituloLower.includes('revisita') || tituloLower.includes('cultivando')) {
      return { tipo: 'revisita', requer_assistente: true };
    }
    if (tituloLower.includes('estudo bíblico') && !tituloLower.includes('congregação')) {
      return { tipo: 'estudo_biblico', requer_assistente: true };
    }
    if (tituloLower.includes('discurso')) {
      return { tipo: 'discurso_estudante', requer_assistente: false, genero_requerido: 'masculino' };
    }
    return { tipo: 'parte_ministerio', requer_assistente: false };
  }

  if (secao === 'vida_crista') {
    if (tituloLower.includes('estudo bíblico de congregação') || tituloLower.includes('estudo de')) {
      return { tipo: 'estudo_congregacao', requer_assistente: false, genero_requerido: 'masculino' };
    }
    if (tituloLower.includes('necessidades')) {
      return { tipo: 'necessidades_congregacao', requer_assistente: false, genero_requerido: 'masculino' };
    }
    if (tituloLower.includes('comentários finais')) {
      return { tipo: 'comentarios_finais', requer_assistente: false, genero_requerido: 'masculino' };
    }
    return { tipo: 'parte_vida_crista', requer_assistente: false };
  }

  return { tipo: 'outro', requer_assistente: false };
}

/**
 * Parse meeting parts from content
 */
function parsePartes(content: string): ParteParsed[] {
  const partes: ParteParsed[] = [];
  let ordem = 1;

  // Find section positions
  const sectionMarkers = [
    { pattern: /TESOUROS DA PALAVRA DE DEUS/i, secao: 'tesouros' as const },
    { pattern: /FAÇA SEU MELHOR NO MINISTÉRIO|APLIQUE-SE AO MINISTÉRIO/i, secao: 'ministerio' as const },
    { pattern: /NOSSA VIDA CRISTÃ|VIVER COMO CRISTÃOS/i, secao: 'vida_crista' as const }
  ];

  const sectionPositions: { pos: number; secao: 'tesouros' | 'ministerio' | 'vida_crista' }[] = [];
  for (const marker of sectionMarkers) {
    const match = content.match(marker.pattern);
    if (match && match.index !== undefined) {
      sectionPositions.push({ pos: match.index, secao: marker.secao });
    }
  }
  sectionPositions.sort((a, b) => a.pos - b.pos);

  const getSecaoAtPosition = (pos: number): 'tesouros' | 'ministerio' | 'vida_crista' => {
    let currentSecao: 'tesouros' | 'ministerio' | 'vida_crista' = 'tesouros';
    for (const sp of sectionPositions) {
      if (pos >= sp.pos) {
        currentSecao = sp.secao;
      } else {
        break;
      }
    }
    return currentSecao;
  };

  // Multiple patterns to match different formats
  const partPatterns = [
    // "• Title (X min)" or "* Title (X min)"
    /[•*]\s*(.+?)\s*\((\d+)\s*min\.?[^)]*\)/gi,
    // "**Title** (X min)"
    /\*\*(.+?)\*\*\s*\((\d+)\s*min\.?[^)]*\)/gi,
    // Lines with dash
    /[-–]\s*(.+?)\s*\((\d+)\s*min\.?[^)]*\)/gi,
    // Numbered items
    /\d+\.\s*(.+?)\s*\((\d+)\s*min\.?[^)]*\)/gi,
    // Simple "Title (X min.)" or "Title (X min. ou menos)"
    /^(.{5,100}?)\s*\((\d+)\s*min\.?\s*(?:ou menos)?\)/gim
  ];

  const foundParts = new Set<string>();

  for (const pattern of partPatterns) {
    let match;
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      let titulo = match[1]
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/^[•*\-–]\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .trim();

      // Skip invalid titles
      if (titulo.length < 3 || titulo.length > 150) continue;
      if (/^(TESOUROS|FAÇA SEU|NOSSA VIDA|CÂNTICO|LEITURA DA BÍBLIA:)/i.test(titulo)) continue;

      const duracao = parseInt(match[2]);
      if (duracao <= 0 || duracao > 60) continue;

      // Avoid duplicates
      const key = titulo.toLowerCase().substring(0, 30);
      if (foundParts.has(key)) continue;
      foundParts.add(key);

      const secao = getSecaoAtPosition(match.index || 0);
      const tipoInfo = determineTipo(titulo, secao);

      // Extract reference if present in parentheses at end
      let referencia: string | undefined;
      const refMatch = titulo.match(/\(([^)]+)\)$/);
      if (refMatch) {
        referencia = refMatch[1];
        titulo = titulo.replace(/\([^)]+\)$/, '').trim();
      }

      partes.push({
        ordem: ordem++,
        titulo,
        duracao_min: duracao,
        secao,
        referencia,
        ...tipoInfo
      });
    }
  }

  // Sort by section order
  partes.sort((a, b) => {
    const sectionOrder = ['tesouros', 'ministerio', 'vida_crista'];
    const aSecIdx = sectionOrder.indexOf(a.secao);
    const bSecIdx = sectionOrder.indexOf(b.secao);
    if (aSecIdx !== bSecIdx) return aSecIdx - bSecIdx;
    return a.ordem - b.ordem;
  });

  // Renumber
  partes.forEach((p, i) => p.ordem = i + 1);

  return partes;
}

/**
 * Split text into week blocks
 */
function splitIntoWeeks(text: string): string[] {
  // Pattern to identify week headers
  const weekPattern = /(\d{1,2})[-–]\s*(\d{1,2})\s+(?:DE\s+)?([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇ]+)/gi;
  
  const matches: { index: number; match: string }[] = [];
  let match;
  
  while ((match = weekPattern.exec(text)) !== null) {
    matches.push({ index: match.index, match: match[0] });
  }
  
  if (matches.length === 0) {
    return [text];
  }
  
  const blocks: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
    blocks.push(text.slice(start, end));
  }
  
  return blocks;
}

/**
 * Parse a single week block
 */
function parseSingleWeek(text: string): SemanaParsed | null {
  if (!text || text.trim().length < 50) {
    return null;
  }

  // Parse date range
  const dateInfo = parseDateRange(text);
  if (!dateInfo) {
    return null;
  }

  // Extract Bible reading
  const leituraPatterns = [
    /LEITURA DA BÍBLIA:\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇ\s]+\s+\d+)/i,
    /Leitura da Bíblia[^:]*:\s*([^\n(]+)/i,
    /LEITURA SEMANAL:\s*([^\n]+)/i
  ];

  let leituraBiblica = '';
  for (const pattern of leituraPatterns) {
    const match = text.match(pattern);
    if (match) {
      leituraBiblica = match[1].trim();
      break;
    }
  }

  // Extract theme
  let tema = 'Programa da Semana';
  const temaPatterns = [
    /TEMA:\s*(.+)/i,
    /PROGRAMA DA REUNIÃO[^:]*:\s*(.+)/i
  ];
  for (const pattern of temaPatterns) {
    const match = text.match(pattern);
    if (match && match[1].length > 5) {
      tema = match[1].trim();
      break;
    }
  }

  // Extract songs
  const songs = extractSongs(text);

  // Parse parts
  const partes = parsePartes(text);

  return {
    semana_inicio: dateInfo.inicio.toISOString().split('T')[0],
    semana_fim: dateInfo.fim.toISOString().split('T')[0],
    mes_ano: dateInfo.mesAno,
    tema,
    leitura_biblica: leituraBiblica,
    cantico_inicial: songs[0] || 0,
    cantico_meio: songs[1] || 0,
    cantico_final: songs[2] || 0,
    partes
  };
}

/**
 * Main parser function - parses pasted text and returns multiple weeks
 */
export function parseApostilaText(text: string): ParseResult {
  const result: ParseResult = {
    success: false,
    semanas: [],
    erros: [],
    avisos: []
  };

  if (!text || text.trim().length < 50) {
    result.erros.push('Texto muito curto ou vazio');
    return result;
  }

  try {
    const weekBlocks = splitIntoWeeks(text);
    
    for (const block of weekBlocks) {
      const semana = parseSingleWeek(block);
      
      if (semana) {
        result.semanas.push(semana);
        
        // Add warnings for incomplete data
        if (semana.partes.length < 3) {
          result.avisos.push(`Semana ${semana.semana_inicio}: poucas partes identificadas (${semana.partes.length})`);
        }
        if (!semana.cantico_inicial && !semana.cantico_meio && !semana.cantico_final) {
          result.avisos.push(`Semana ${semana.semana_inicio}: cânticos não identificados`);
        }
      } else {
        result.avisos.push('Um bloco de texto não pôde ser processado');
      }
    }
    
    result.success = result.semanas.length > 0;
    
    if (!result.success) {
      result.erros.push('Nenhuma semana válida foi extraída do texto');
    }
  } catch (error) {
    result.erros.push(`Erro durante o parsing: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }

  return result;
}

/**
 * Validate parsed program data
 */
export function validarParsing(result: ParseResult): { valido: boolean; problemas: string[] } {
  const problemas: string[] = [];

  if (!result.success) {
    problemas.push(...result.erros);
    return { valido: false, problemas };
  }

  for (const semana of result.semanas) {
    if (semana.partes.length === 0) {
      problemas.push(`Semana ${semana.semana_inicio}: nenhuma parte identificada`);
    }

    // Check if all sections are present
    const secoes = new Set(semana.partes.map(p => p.secao));
    if (!secoes.has('tesouros')) {
      problemas.push(`Semana ${semana.semana_inicio}: seção Tesouros não encontrada`);
    }
    if (!secoes.has('ministerio')) {
      problemas.push(`Semana ${semana.semana_inicio}: seção Ministério não encontrada`);
    }
    if (!secoes.has('vida_crista')) {
      problemas.push(`Semana ${semana.semana_inicio}: seção Vida Cristã não encontrada`);
    }
  }

  return {
    valido: problemas.length === 0,
    problemas
  };
}

// Backwards compatibility - single week parser
export function parseSingleProgram(text: string): SemanaParsed | null {
  return parseSingleWeek(text);
}

export function validateParsedProgram(programa: SemanaParsed | null): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!programa) {
    return { valid: false, errors: ['Não foi possível extrair dados do texto'] };
  }

  if (!programa.semana_inicio || !programa.semana_fim) {
    errors.push('Data da semana não identificada');
  }

  if (programa.partes.length === 0) {
    errors.push('Nenhuma parte do programa foi identificada');
  }

  if (programa.cantico_inicial === 0 && programa.cantico_meio === 0 && programa.cantico_final === 0) {
    errors.push('Cânticos não identificados');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
