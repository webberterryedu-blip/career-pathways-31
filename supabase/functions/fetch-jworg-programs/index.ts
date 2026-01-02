import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParteProgramacao {
  ordem: number;
  titulo: string;
  duracao_min: number;
  tipo: string;
  secao: 'tesouros' | 'ministerio' | 'vida_crista';
  referencia?: string;
}

interface ProgramaSemana {
  semana_inicio: string;
  semana_fim: string;
  mes_ano: string;
  tema: string;
  leitura_biblica: string;
  cantico_inicial: number;
  cantico_meio: number;
  cantico_final: number;
  partes: ParteProgramacao[];
  idioma: string;
  fonte_url: string;
}

// Map of months in Portuguese
const monthMap: Record<string, number> = {
  'janeiro': 1, 'fevereiro': 2, 'março': 3, 'marco': 3, 'abril': 4,
  'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
  'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
};

// Extract week links from a monthly workbook index page
function extractWeekLinksFromIndex(markdown: string, baseUrl: string): string[] {
  const links: string[] = [];
  
  // Look for links to weekly program pages
  // Pattern: [Text](URL) where URL contains "semana" or "week"
  const linkPattern = /\[([^\]]+)\]\(([^)]+(?:semana|week|Programa-da-reuniao)[^)]*)\)/gi;
  let match;
  
  while ((match = linkPattern.exec(markdown)) !== null) {
    let url = match[2];
    // Make absolute URL if relative
    if (url.startsWith('/')) {
      url = 'https://www.jw.org' + url;
    } else if (!url.startsWith('http')) {
      url = baseUrl + '/' + url;
    }
    
    // Only add unique URLs that look like week pages
    if (!links.includes(url) && (url.includes('semana') || url.includes('week') || url.includes('Programa'))) {
      links.push(url);
    }
  }
  
  console.log(`Extracted ${links.length} week links from index`);
  return links;
}

// Parse a single week's program page
function parseWeekPage(markdown: string, url: string): ProgramaSemana | null {
  try {
    console.log(`Parsing week page, content length: ${markdown.length}`);
    
    // Debug: log first 500 chars
    console.log('Content preview:', markdown.substring(0, 500));
    
    // Extract date range from title or content
    // Patterns: "6-12 de janeiro", "6 a 12 de janeiro", "Semana de 6 de janeiro"
    const datePatterns = [
      /(\d{1,2})[-–a]\s*(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+)?(\d{4})?/i,
      /semana\s+de\s+(\d{1,2})\s+de\s+(\w+)/i,
      /(\d{1,2})\s+de\s+(\w+)\s*[-–]\s*(\d{1,2})\s+de\s+(\w+)/i
    ];
    
    let semanaInicio: Date | null = null;
    let semanaFim: Date | null = null;
    let mesAno = '';
    
    for (const pattern of datePatterns) {
      const match = markdown.match(pattern);
      if (match) {
        console.log('Date match found:', match[0]);
        
        if (match.length >= 4 && match[2] && !isNaN(parseInt(match[2]))) {
          // Pattern: "6-12 de janeiro 2025"
          const startDay = parseInt(match[1]);
          const endDay = parseInt(match[2]);
          const monthStr = match[3].toLowerCase();
          const year = match[4] ? parseInt(match[4]) : new Date().getFullYear();
          const month = monthMap[monthStr] || 1;
          
          semanaInicio = new Date(year, month - 1, startDay);
          semanaFim = new Date(year, month - 1, endDay);
          mesAno = `${year}-${String(month).padStart(2, '0')}`;
        } else if (match.length >= 3) {
          // Pattern: "Semana de 6 de janeiro" - need to calculate end date
          const startDay = parseInt(match[1]);
          const monthStr = match[2].toLowerCase();
          const year = new Date().getFullYear();
          const month = monthMap[monthStr] || 1;
          
          semanaInicio = new Date(year, month - 1, startDay);
          semanaFim = new Date(year, month - 1, startDay + 6);
          mesAno = `${year}-${String(month).padStart(2, '0')}`;
        }
        
        if (semanaInicio) break;
      }
    }
    
    if (!semanaInicio || !semanaFim) {
      console.log('Could not parse dates from content');
      // Try to extract from URL
      const urlMatch = url.match(/(\d{1,2})-de-(\w+)/i);
      if (urlMatch) {
        const startDay = parseInt(urlMatch[1]);
        const monthStr = urlMatch[2].toLowerCase();
        const year = new Date().getFullYear();
        const month = monthMap[monthStr] || 1;
        
        semanaInicio = new Date(year, month - 1, startDay);
        semanaFim = new Date(year, month - 1, startDay + 6);
        mesAno = `${year}-${String(month).padStart(2, '0')}`;
      } else {
        return null;
      }
    }
    
    // Extract theme - look for the weekly theme after date
    const temaPatterns = [
      /#+\s*(.+?)\s*\n/,
      /\*\*(.+?)\*\*/,
      /LEITURA DA BÍBLIA:\s*([^\n]+)/i
    ];
    
    let tema = 'Programa da Semana';
    for (const pattern of temaPatterns) {
      const match = markdown.match(pattern);
      if (match && match[1] && match[1].length > 5 && match[1].length < 100) {
        tema = match[1].trim();
        break;
      }
    }
    
    // Extract Bible reading
    const leituraPatterns = [
      /LEITURA DA BÍBLIA:\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇ\s]+\s+\d+)/i,
      /Leitura da Bíblia[^:]*:\s*([^\n(]+)/i,
      /LEITURA SEMANAL DA BÍBLIA:\s*([^\n]+)/i
    ];
    
    let leituraBiblica = '';
    for (const pattern of leituraPatterns) {
      const match = markdown.match(pattern);
      if (match) {
        leituraBiblica = match[1].trim();
        break;
      }
    }
    
    // Extract songs (cânticos) - look for patterns like "Cântico 123" or "CÂNTICOS: 88, 94, 89"
    const songs: number[] = [];
    
    // First try to find grouped songs pattern
    const groupedSongs = markdown.match(/CÂNTICOS?:\s*([\d,\s]+)/i);
    if (groupedSongs) {
      const nums = groupedSongs[1].match(/\d+/g);
      if (nums) {
        songs.push(...nums.map(n => parseInt(n)));
      }
    }
    
    // If not found, look for individual mentions
    if (songs.length === 0) {
      const songPattern = /(?:Cântico|CÂNTICO|Song)\s*(\d+)/gi;
      let match;
      while ((match = songPattern.exec(markdown)) !== null) {
        const num = parseInt(match[1]);
        if (!songs.includes(num)) {
          songs.push(num);
        }
      }
    }
    
    console.log('Songs found:', songs);
    
    // Parse parts
    const partes = parsePartes(markdown);
    console.log(`Parsed ${partes.length} parts`);
    
    return {
      semana_inicio: semanaInicio.toISOString().split('T')[0],
      semana_fim: semanaFim.toISOString().split('T')[0],
      mes_ano: mesAno,
      tema,
      leitura_biblica: leituraBiblica,
      cantico_inicial: songs[0] || 0,
      cantico_meio: songs[1] || 0,
      cantico_final: songs[2] || 0,
      partes,
      idioma: 'pt',
      fonte_url: url
    };
  } catch (error) {
    console.error('Error parsing week page:', error);
    return null;
  }
}

// Parse meeting parts from content
function parsePartes(content: string): ParteProgramacao[] {
  const partes: ParteProgramacao[] = [];
  let ordem = 1;
  
  // Define section markers and their positions
  const sectionMarkers = [
    { pattern: /TESOUROS DA PALAVRA DE DEUS/i, secao: 'tesouros' as const },
    { pattern: /FAÇA SEU MELHOR NO MINISTÉRIO|APLIQUE-SE AO MINISTÉRIO/i, secao: 'ministerio' as const },
    { pattern: /NOSSA VIDA CRISTÃ|VIVER COMO CRISTÃOS/i, secao: 'vida_crista' as const }
  ];
  
  // Find section positions
  const sectionPositions: { pos: number; secao: 'tesouros' | 'ministerio' | 'vida_crista' }[] = [];
  for (const marker of sectionMarkers) {
    const match = content.match(marker.pattern);
    if (match && match.index !== undefined) {
      sectionPositions.push({ pos: match.index, secao: marker.secao });
    }
  }
  sectionPositions.sort((a, b) => a.pos - b.pos);
  
  // Function to determine section at a given position
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
  
  // Multiple patterns to catch different formatting styles
  const partPatterns = [
    // Pattern: "• Title (X min)" or "* Title (X min)"
    /[•*]\s*(.+?)\s*\((\d+)\s*min\.?[^)]*\)/gi,
    // Pattern: "**Title** (X min)" 
    /\*\*(.+?)\*\*\s*\((\d+)\s*min\.?[^)]*\)/gi,
    // Pattern: lines starting with dash
    /[-–]\s*(.+?)\s*\((\d+)\s*min\.?[^)]*\)/gi,
    // Pattern: numbered items "1. Title (X min)"
    /\d+\.\s*(.+?)\s*\((\d+)\s*min\.?[^)]*\)/gi,
    // Pattern: simple "Title (X min.)" at line start
    /^(.{10,80}?)\s*\((\d+)\s*min\.?\s*(?:ou menos)?\)/gim
  ];
  
  const foundParts: Set<string> = new Set();
  
  for (const pattern of partPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let titulo = match[1]
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/^[•*\-–]\s*/, '')
        .trim();
      
      // Skip if too short, too long, or is a section header
      if (titulo.length < 3 || titulo.length > 150) continue;
      if (/^(TESOUROS|FAÇA SEU|NOSSA VIDA|CÂNTICO)/i.test(titulo)) continue;
      
      const duracao = parseInt(match[2]);
      if (duracao <= 0 || duracao > 60) continue;
      
      // Avoid duplicates
      const key = titulo.toLowerCase().substring(0, 30);
      if (foundParts.has(key)) continue;
      foundParts.add(key);
      
      const secao = getSecaoAtPosition(match.index || 0);
      const tipo = determineTipo(titulo, secao);
      
      // Extract reference if present
      const refMatch = titulo.match(/\(([^)]+)\)$/);
      const referencia = refMatch ? refMatch[1] : undefined;
      if (refMatch) {
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
  
  // Sort by order if we have section positions
  if (sectionPositions.length > 0) {
    partes.sort((a, b) => {
      const sectionOrder = ['tesouros', 'ministerio', 'vida_crista'];
      const aSecIdx = sectionOrder.indexOf(a.secao);
      const bSecIdx = sectionOrder.indexOf(b.secao);
      if (aSecIdx !== bSecIdx) return aSecIdx - bSecIdx;
      return a.ordem - b.ordem;
    });
    
    // Renumber after sorting
    partes.forEach((p, i) => p.ordem = i + 1);
  }
  
  return partes;
}

// Determine part type based on title and section
function determineTipo(titulo: string, secao: string): string {
  const tituloLower = titulo.toLowerCase();
  
  // Tesouros section
  if (secao === 'tesouros') {
    if (tituloLower.includes('joias') || tituloLower.includes('gems')) return 'joias_espirituais';
    if (tituloLower.includes('leitura') && tituloLower.includes('bíblia')) return 'leitura_biblia';
    return 'discurso_tesouros';
  }
  
  // Ministério section
  if (secao === 'ministerio') {
    if (tituloLower.includes('primeira conversa') || tituloLower.includes('iniciando')) return 'primeira_conversa';
    if (tituloLower.includes('revisita') || tituloLower.includes('cultivando')) return 'revisita';
    if (tituloLower.includes('estudo bíblico') && !tituloLower.includes('congregação')) return 'estudo_biblico';
    if (tituloLower.includes('discurso')) return 'discurso_estudante';
    return 'parte_ministerio';
  }
  
  // Vida Cristã section
  if (secao === 'vida_crista') {
    if (tituloLower.includes('estudo bíblico de congregação') || tituloLower.includes('estudo de')) return 'estudo_congregacao';
    if (tituloLower.includes('necessidades da congregação') || tituloLower.includes('anúncios')) return 'necessidades_congregacao';
    if (tituloLower.includes('comentários finais')) return 'comentarios_finais';
    return 'parte_vida_crista';
  }
  
  return 'outro';
}

// Scrape URL using Firecrawl
async function scrapeUrl(url: string, apiKey: string): Promise<string | null> {
  try {
    console.log('Scraping URL:', url);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000
      }),
    });
    
    if (!response.ok) {
      console.error('Firecrawl error:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data?.data?.markdown || data?.markdown || null;
  } catch (error) {
    console.error('Error scraping URL:', error);
    return null;
  }
}

// Get links from a page using Firecrawl Map
async function mapUrl(url: string, apiKey: string): Promise<string[]> {
  try {
    console.log('Mapping URL:', url);
    
    const response = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        limit: 100,
        includeSubdomains: false
      }),
    });
    
    if (!response.ok) {
      console.error('Firecrawl map error:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data?.links || data?.data?.links || [];
  } catch (error) {
    console.error('Error mapping URL:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

  if (!firecrawlKey) {
    console.error('FIRECRAWL_API_KEY not configured');
    return new Response(
      JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json().catch(() => ({}));
    const idioma = body.idioma || 'pt';
    const limit = body.limit || 3; // Number of months to process
    
    console.log(`Starting JW.org sync for language: ${idioma}, limit: ${limit} months`);
    
    // Create sync log entry
    const { data: syncLog, error: syncError } = await supabase
      .from('sincronizacoes_jworg')
      .insert({
        idioma,
        status: 'em_andamento',
        programas_importados: 0
      })
      .select()
      .single();
    
    if (syncError) {
      console.error('Error creating sync log:', syncError);
    }
    
    const syncId = syncLog?.id;
    
    // Base URL for workbooks
    const baseUrl = 'https://www.jw.org/pt/biblioteca/jw-apostila-do-mes/';
    
    // First, map the main workbook page to find all available months
    const allLinks = await mapUrl(baseUrl, firecrawlKey);
    console.log(`Found ${allLinks.length} links on main page`);
    
    // Filter for workbook month links (mwbr followed by year and month)
    const workbookLinks = allLinks.filter(link => 
      link.match(/mwbr\d{6}/) || 
      link.includes('jw-apostila-do-mes') && link.match(/\d{4}/)
    ).slice(0, limit);
    
    console.log(`Processing ${workbookLinks.length} workbook months`);
    
    const allPrograms: ProgramaSemana[] = [];
    
    for (const monthLink of workbookLinks) {
      console.log(`\nProcessing month: ${monthLink}`);
      
      // Scrape the month index page to get content and links
      const monthContent = await scrapeUrl(monthLink, firecrawlKey);
      
      if (!monthContent) {
        console.log('Could not scrape month index');
        continue;
      }
      
      // Extract week links from the month page
      const weekLinks = extractWeekLinksFromIndex(monthContent, monthLink);
      
      if (weekLinks.length === 0) {
        // If no week links found, the month page might contain the content directly
        // Try to find week links by mapping
        const mappedLinks = await mapUrl(monthLink, firecrawlKey);
        const programLinks = mappedLinks.filter(l => 
          l.includes('Programa-da-reuniao') || 
          l.includes('semana') ||
          l.includes('week')
        );
        
        if (programLinks.length > 0) {
          weekLinks.push(...programLinks);
        }
      }
      
      console.log(`Found ${weekLinks.length} week links to process`);
      
      // Process each week
      for (const weekLink of weekLinks) {
        console.log(`\nProcessing week: ${weekLink}`);
        
        const weekContent = await scrapeUrl(weekLink, firecrawlKey);
        
        if (!weekContent) {
          console.log('Could not scrape week page');
          continue;
        }
        
        const programa = parseWeekPage(weekContent, weekLink);
        
        if (programa) {
          console.log(`Successfully parsed program for ${programa.semana_inicio} to ${programa.semana_fim}`);
          allPrograms.push(programa);
        } else {
          console.log('Could not parse week content');
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Delay between months
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\nTotal programs parsed: ${allPrograms.length}`);
    
    // Save to database
    let savedCount = 0;
    for (const programa of allPrograms) {
      const { error } = await supabase
        .from('programas_oficiais')
        .upsert({
          semana_inicio: programa.semana_inicio,
          semana_fim: programa.semana_fim,
          mes_ano: programa.mes_ano,
          tema: programa.tema,
          leitura_biblica: programa.leitura_biblica,
          cantico_inicial: programa.cantico_inicial,
          cantico_meio: programa.cantico_meio,
          cantico_final: programa.cantico_final,
          partes: programa.partes,
          idioma: programa.idioma,
          fonte_url: programa.fonte_url,
          ultima_sincronizacao: new Date().toISOString()
        }, {
          onConflict: 'semana_inicio,semana_fim,idioma'
        });
      
      if (!error) {
        savedCount++;
      } else {
        console.error('Error saving program:', error);
      }
    }
    
    console.log(`Saved ${savedCount} programs to database`);
    
    // Update sync log
    if (syncId) {
      await supabase
        .from('sincronizacoes_jworg')
        .update({
          status: 'concluido',
          programas_importados: savedCount
        })
        .eq('id', syncId);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        programas_encontrados: allPrograms.length,
        programas_salvos: savedCount,
        message: `Sincronização concluída: ${savedCount} programas importados`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in fetch-jworg-programs:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
