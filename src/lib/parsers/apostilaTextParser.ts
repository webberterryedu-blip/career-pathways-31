/**
 * Parser for manually pasted workbook (apostila) text content
 * Extracts program data from copy/pasted text from JW.org or PDF
 */

interface ParteParsed {
  ordem: number;
  titulo: string;
  duracao_min: number;
  tipo: string;
  secao: 'tesouros' | 'ministerio' | 'vida_crista';
  referencia?: string;
}

interface ProgramaParsed {
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
function determineTipo(titulo: string, secao: string): string {
  const tituloLower = titulo.toLowerCase();

  if (secao === 'tesouros') {
    if (tituloLower.includes('joias') || tituloLower.includes('gems')) return 'joias_espirituais';
    if (tituloLower.includes('leitura') && tituloLower.includes('bíblia')) return 'leitura_biblia';
    return 'discurso_tesouros';
  }

  if (secao === 'ministerio') {
    if (tituloLower.includes('primeira conversa') || tituloLower.includes('iniciando')) return 'primeira_conversa';
    if (tituloLower.includes('revisita') || tituloLower.includes('cultivando')) return 'revisita';
    if (tituloLower.includes('estudo bíblico') && !tituloLower.includes('congregação')) return 'estudo_biblico';
    if (tituloLower.includes('discurso')) return 'discurso_estudante';
    return 'parte_ministerio';
  }

  if (secao === 'vida_crista') {
    if (tituloLower.includes('estudo bíblico de congregação') || tituloLower.includes('estudo de')) return 'estudo_congregacao';
    if (tituloLower.includes('necessidades')) return 'necessidades_congregacao';
    if (tituloLower.includes('comentários finais')) return 'comentarios_finais';
    return 'parte_vida_crista';
  }

  return 'outro';
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
      const tipo = determineTipo(titulo, secao);

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
        tipo,
        secao,
        referencia
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
 * Main parser function - parses pasted text and returns program data
 */
export function parseApostilaText(text: string): ProgramaParsed | null {
  if (!text || text.trim().length < 50) {
    return null;
  }

  // Parse date range
  const dateInfo = parseDateRange(text);
  if (!dateInfo) {
    console.error('Could not parse date from text');
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
 * Validate parsed program data
 */
export function validateParsedProgram(programa: ProgramaParsed | null): { valid: boolean; errors: string[] } {
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
