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

// Get week number of the year (ISO week)
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Get Monday of a given week number
function getMondayOfWeek(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  return monday;
}

// Build WOL URL for a specific week
// Format: https://wol.jw.org/pt/wol/meetings/r5/lp-t/{year}/{week}
function buildWolUrl(year: number, week: number, langCode: string = 'pt'): string {
  // Language codes mapping for WOL
  const langMap: Record<string, { r: string; lp: string }> = {
    'pt': { r: 'r5', lp: 'lp-t' },      // Portuguese
    'en': { r: 'r1', lp: 'lp-e' },      // English
    'es': { r: 'r4', lp: 'lp-s' },      // Spanish
  };
  
  const lang = langMap[langCode] || langMap['pt'];
  return `https://wol.jw.org/${langCode}/wol/meetings/${lang.r}/${lang.lp}/${year}/${week}`;
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
        waitFor: 3000
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firecrawl error:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    return data?.data?.markdown || data?.markdown || null;
  } catch (error) {
    console.error('Error scraping URL:', error);
    return null;
  }
}

// Parse WOL meeting program page
function parseWolMeetingPage(markdown: string, url: string, year: number, weekNum: number): ProgramaSemana | null {
  try {
    console.log(`Parsing WOL page, content length: ${markdown.length}`);
    
    // Calculate week dates from week number
    const monday = getMondayOfWeek(year, weekNum);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const semanaInicio = monday.toISOString().split('T')[0];
    const semanaFim = sunday.toISOString().split('T')[0];
    const mesAno = `${year}-${String(monday.getMonth() + 1).padStart(2, '0')}`;
    
    // Extract theme from page
    let tema = 'Programa da Reunião Vida e Ministério';
    const temaMatch = markdown.match(/#+\s*([^\n]+)/);
    if (temaMatch) {
      tema = temaMatch[1].trim();
    }
    
    // Extract Bible reading
    let leituraBiblica = '';
    const leituraPatterns = [
      /LEITURA DA BÍBLIA:\s*([^\n(]+)/i,
      /Leitura semanal da Bíblia:\s*([^\n]+)/i,
      /LEITURA BÍBLICA:\s*([^\n]+)/i,
      /(\d?\s*[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇ]+\s+\d+(?:[-–]\d+)?)/i
    ];
    
    for (const pattern of leituraPatterns) {
      const match = markdown.match(pattern);
      if (match) {
        leituraBiblica = match[1].trim();
        break;
      }
    }
    
    // Extract songs (cânticos)
    const songs: number[] = [];
    const songPattern = /(?:Cântico|CÂNTICO|Song|SONG)\s*(\d+)/gi;
    let match;
    while ((match = songPattern.exec(markdown)) !== null) {
      const num = parseInt(match[1]);
      if (!songs.includes(num) && num > 0 && num < 200) {
        songs.push(num);
      }
    }
    
    // Also try grouped pattern
    const groupedSongs = markdown.match(/CÂNTICOS?:\s*([\d,\s]+)/i);
    if (groupedSongs && songs.length === 0) {
      const nums = groupedSongs[1].match(/\d+/g);
      if (nums) {
        songs.push(...nums.map(n => parseInt(n)));
      }
    }
    
    console.log('Songs found:', songs);
    
    // Parse parts
    const partes = parsePartes(markdown);
    console.log(`Parsed ${partes.length} parts`);
    
    return {
      semana_inicio: semanaInicio,
      semana_fim: semanaFim,
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
    console.error('Error parsing WOL page:', error);
    return null;
  }
}

// Parse meeting parts from content
function parsePartes(content: string): ParteProgramacao[] {
  const partes: ParteProgramacao[] = [];
  let ordem = 1;
  
  // Define section markers
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
  
  // Patterns for parts with duration
  const partPatterns = [
    /[•*]\s*(.+?)\s*\((\d+)\s*min\.?[^)]*\)/gi,
    /\*\*(.+?)\*\*\s*\((\d+)\s*min\.?[^)]*\)/gi,
    /[-–]\s*(.+?)\s*\((\d+)\s*min\.?[^)]*\)/gi,
    /\d+\.\s*(.+?)\s*\((\d+)\s*min\.?[^)]*\)/gi,
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
      
      if (titulo.length < 3 || titulo.length > 150) continue;
      if (/^(TESOUROS|FAÇA SEU|NOSSA VIDA|CÂNTICO)/i.test(titulo)) continue;
      
      const duracao = parseInt(match[2]);
      if (duracao <= 0 || duracao > 60) continue;
      
      const key = titulo.toLowerCase().substring(0, 30);
      if (foundParts.has(key)) continue;
      foundParts.add(key);
      
      const secao = getSecaoAtPosition(match.index || 0);
      const tipo = determineTipo(titulo, secao);
      
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
  
  // Sort by section order
  if (sectionPositions.length > 0) {
    partes.sort((a, b) => {
      const sectionOrder = ['tesouros', 'ministerio', 'vida_crista'];
      const aSecIdx = sectionOrder.indexOf(a.secao);
      const bSecIdx = sectionOrder.indexOf(b.secao);
      if (aSecIdx !== bSecIdx) return aSecIdx - bSecIdx;
      return a.ordem - b.ordem;
    });
    partes.forEach((p, i) => p.ordem = i + 1);
  }
  
  return partes;
}

// Determine part type
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
    if (tituloLower.includes('necessidades') || tituloLower.includes('anúncios')) return 'necessidades_congregacao';
    if (tituloLower.includes('comentários finais')) return 'comentarios_finais';
    return 'parte_vida_crista';
  }
  
  return 'outro';
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
      JSON.stringify({ success: false, error: 'Firecrawl not configured. Please connect Firecrawl in Settings → Connectors.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json().catch(() => ({}));
    const idioma = body.idioma || 'pt';
    const weeksAhead = body.weeks_ahead || 4; // How many weeks ahead to sync
    const weeksBehind = body.weeks_behind || 1; // How many weeks behind to sync
    
    // Specific week/year can be passed for manual sync
    const specificYear = body.year;
    const specificWeek = body.week;
    
    console.log(`Starting WOL sync for language: ${idioma}`);
    
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
    
    // Determine which weeks to sync
    const weeksToSync: { year: number; week: number }[] = [];
    
    if (specificYear && specificWeek) {
      // Sync specific week
      weeksToSync.push({ year: specificYear, week: specificWeek });
    } else {
      // Sync a range around current week
      const now = new Date();
      const currentWeek = getWeekNumber(now);
      const currentYear = now.getFullYear();
      
      for (let offset = -weeksBehind; offset <= weeksAhead; offset++) {
        let week = currentWeek + offset;
        let year = currentYear;
        
        // Handle year boundaries
        if (week <= 0) {
          week = 52 + week;
          year = currentYear - 1;
        } else if (week > 52) {
          week = week - 52;
          year = currentYear + 1;
        }
        
        weeksToSync.push({ year, week });
      }
    }
    
    console.log(`Syncing ${weeksToSync.length} weeks:`, weeksToSync);
    
    const allPrograms: ProgramaSemana[] = [];
    
    for (const { year, week } of weeksToSync) {
      const wolUrl = buildWolUrl(year, week, idioma);
      console.log(`\nFetching week ${week}/${year}: ${wolUrl}`);
      
      const content = await scrapeUrl(wolUrl, firecrawlKey);
      
      if (!content) {
        console.log(`Could not scrape week ${week}/${year}`);
        continue;
      }
      
      const programa = parseWolMeetingPage(content, wolUrl, year, week);
      
      if (programa && programa.partes.length > 0) {
        console.log(`✅ Parsed program for week ${week}/${year}: ${programa.partes.length} parts`);
        allPrograms.push(programa);
      } else {
        console.log(`⚠️ Could not parse content for week ${week}/${year}`);
      }
      
      // Rate limiting delay
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
          onConflict: 'semana_inicio,idioma',
          ignoreDuplicates: false
        });
      
      if (!error) {
        savedCount++;
        console.log(`✅ Saved program: ${programa.semana_inicio}`);
      } else {
        console.error('Error saving program:', error);
      }
    }
    
    console.log(`\n🎉 Saved ${savedCount} programs to database`);
    
    // Update sync log
    if (syncId) {
      await supabase
        .from('sincronizacoes_jworg')
        .update({
          status: 'concluido',
          programas_importados: savedCount,
          mes_ano: allPrograms.length > 0 ? allPrograms[0].mes_ano : null
        })
        .eq('id', syncId);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        programas_encontrados: allPrograms.length,
        programas_salvos: savedCount,
        semanas_processadas: weeksToSync,
        message: `Sincronização WOL concluída: ${savedCount} programas importados`
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
