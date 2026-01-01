import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParteProgramacao {
  ordem: number;
  secao: 'tesouros' | 'ministerio' | 'vida_crista';
  tipo: string;
  titulo: string;
  duracao: number;
  referencia?: string;
  requer_assistente?: boolean;
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

// Parse the workbook page content from JW.org
function parseWorkbookContent(markdown: string, url: string): ProgramaSemana[] {
  const programas: ProgramaSemana[] = [];
  
  console.log('Parsing markdown content, length:', markdown.length);
  
  // Split by week headers - looking for date patterns like "6-12 de janeiro" or "January 6-12"
  const weekPattern = /#{1,3}\s*(\d{1,2}[-–]\d{1,2}\s+de\s+\w+|\w+\s+\d{1,2}[-–]\d{1,2})/gi;
  const weekMatches = markdown.split(weekPattern);
  
  console.log('Found week sections:', Math.floor(weekMatches.length / 2));
  
  for (let i = 1; i < weekMatches.length; i += 2) {
    const weekDateStr = weekMatches[i];
    const weekContent = weekMatches[i + 1] || '';
    
    if (!weekContent.trim()) continue;
    
    console.log('Processing week:', weekDateStr);
    
    const programa = parseWeekContent(weekDateStr, weekContent, url);
    if (programa) {
      programas.push(programa);
    }
  }
  
  return programas;
}

function parseWeekContent(dateStr: string, content: string, url: string): ProgramaSemana | null {
  try {
    // Parse date range from string like "6-12 de janeiro" or "6–12 de janeiro"
    const dateMatch = dateStr.match(/(\d{1,2})[-–](\d{1,2})\s+de\s+(\w+)/i);
    if (!dateMatch) {
      console.log('Could not parse date:', dateStr);
      return null;
    }
    
    const [, startDay, endDay, month] = dateMatch;
    const year = new Date().getFullYear();
    const monthMap: Record<string, number> = {
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
      'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
      'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
    };
    
    const monthNum = monthMap[month.toLowerCase()] ?? 0;
    const semanaInicio = new Date(year, monthNum, parseInt(startDay));
    const semanaFim = new Date(year, monthNum, parseInt(endDay));
    
    // Extract theme - usually after "LEITURA DA BÍBLIA" or in the first heading
    const temaMatch = content.match(/(?:Tema|TEMA)[:\s]*([^\n]+)/i) ||
                      content.match(/\*\*([^*]+)\*\*/) ||
                      content.match(/^#[^#]\s*(.+)/m);
    const tema = temaMatch?.[1]?.trim() || 'Programa da Semana';
    
    // Extract Bible reading
    const leituraMatch = content.match(/(?:LEITURA DA BÍBLIA|Leitura da Bíblia)[:\s]*([^\n]+)/i) ||
                         content.match(/(\w+\s+\d+[-–]\d+)/);
    const leituraBiblica = leituraMatch?.[1]?.trim() || '';
    
    // Extract songs (cânticos)
    const songsMatch = content.match(/(?:CÂNTICO|Cântico|SONG)\s*(\d+)/gi) || [];
    const songs = songsMatch.map(s => parseInt(s.match(/\d+/)?.[0] || '0'));
    
    // Parse parts
    const partes = parsePartes(content);
    
    return {
      semana_inicio: semanaInicio.toISOString().split('T')[0],
      semana_fim: semanaFim.toISOString().split('T')[0],
      mes_ano: `${year}-${String(monthNum + 1).padStart(2, '0')}`,
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
    console.error('Error parsing week content:', error);
    return null;
  }
}

function parsePartes(content: string): ParteProgramacao[] {
  const partes: ParteProgramacao[] = [];
  let ordem = 1;
  
  // Define section markers
  const sections = [
    { marker: /TESOUROS DA PALAVRA DE DEUS|TREASURES FROM GOD'S WORD/i, secao: 'tesouros' as const },
    { marker: /FAÇA SEU MELHOR NO MINISTÉRIO|APPLY YOURSELF TO THE FIELD MINISTRY/i, secao: 'ministerio' as const },
    { marker: /NOSSA VIDA CRISTÃ|LIVING AS CHRISTIANS/i, secao: 'vida_crista' as const }
  ];
  
  // Split content by sections
  let currentSecao: 'tesouros' | 'ministerio' | 'vida_crista' = 'tesouros';
  
  // Find all parts with duration patterns like "(10 min)" or "(5 min.)"
  const partPattern = /(?:^|\n)\s*(?:\*\*|#{1,4}\s*)?(.+?)\s*\((\d+)\s*min\.?\)/gi;
  let match;
  
  while ((match = partPattern.exec(content)) !== null) {
    const titulo = match[1].replace(/\*\*/g, '').trim();
    const duracao = parseInt(match[2]);
    
    // Determine section based on position in content
    for (const section of sections) {
      const sectionMatch = content.slice(0, match.index).match(section.marker);
      if (sectionMatch) {
        currentSecao = section.secao;
      }
    }
    
    // Determine part type
    let tipo = 'discurso';
    const tituloLower = titulo.toLowerCase();
    
    if (tituloLower.includes('leitura da bíblia') || tituloLower.includes('bible reading')) {
      tipo = 'leitura';
    } else if (tituloLower.includes('iniciando conversa') || tituloLower.includes('starting')) {
      tipo = 'demonstracao';
    } else if (tituloLower.includes('cultivando interesse') || tituloLower.includes('following')) {
      tipo = 'demonstracao';
    } else if (tituloLower.includes('fazendo discípulos') || tituloLower.includes('making')) {
      tipo = 'demonstracao';
    } else if (tituloLower.includes('explicando') || tituloLower.includes('explaining')) {
      tipo = 'discurso';
    } else if (tituloLower.includes('vídeo') || tituloLower.includes('video')) {
      tipo = 'video';
    } else if (tituloLower.includes('estudo bíblico') || tituloLower.includes('bible study')) {
      tipo = 'estudo';
    }
    
    // Check if requires assistant
    const requerAssistente = currentSecao === 'ministerio' && 
      (tituloLower.includes('conversa') || tituloLower.includes('cultivando') || 
       tituloLower.includes('starting') || tituloLower.includes('following'));
    
    partes.push({
      ordem: ordem++,
      secao: currentSecao,
      tipo,
      titulo,
      duracao,
      requer_assistente: requerAssistente
    });
  }
  
  console.log(`Parsed ${partes.length} parts`);
  return partes;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idioma = 'pt', forceRefresh = false } = await req.json().catch(() => ({}));
    
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log sync start
    const { data: syncLog } = await supabase
      .from('sincronizacoes_jworg')
      .insert({ idioma, status: 'iniciado' })
      .select()
      .single();

    // Build JW.org URL based on language
    const langMap: Record<string, string> = {
      'pt': 'pt',
      'en': 'en',
      'es': 'es'
    };
    const jwLang = langMap[idioma] || 'pt';
    const jworgUrl = `https://www.jw.org/${jwLang}/biblioteca/jw-apostila-do-mes/`;

    console.log('Fetching JW.org page:', jworgUrl);

    // First, get the main page to find available workbooks
    const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: jworgUrl,
        limit: 50,
      }),
    });

    const mapData = await mapResponse.json();
    console.log('Map response:', mapData.success, 'links:', mapData.links?.length || 0);

    if (!mapData.success || !mapData.links) {
      throw new Error('Failed to map JW.org pages');
    }

    // Filter for workbook links (apostila pages)
    const workbookLinks = mapData.links.filter((link: string) => 
      link.includes('apostila') || link.includes('workbook') || link.includes('mwb')
    );

    console.log('Found workbook links:', workbookLinks.length);

    // Scrape each workbook page
    let totalImported = 0;
    const allProgramas: ProgramaSemana[] = [];

    for (const link of workbookLinks.slice(0, 5)) { // Limit to 5 most recent
      console.log('Scraping:', link);
      
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: link,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
      });

      const scrapeData = await scrapeResponse.json();
      
      if (scrapeData.success && scrapeData.data?.markdown) {
        const programas = parseWorkbookContent(scrapeData.data.markdown, link);
        allProgramas.push(...programas);
        console.log(`Parsed ${programas.length} programs from ${link}`);
      }
    }

    console.log('Total programs parsed:', allProgramas.length);

    // Upsert programs to database
    for (const programa of allProgramas) {
      const { error } = await supabase
        .from('programas_oficiais')
        .upsert(programa, {
          onConflict: 'semana_inicio,semana_fim,idioma',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error upserting program:', error);
      } else {
        totalImported++;
      }
    }

    // Update sync log
    await supabase
      .from('sincronizacoes_jworg')
      .update({ 
        status: 'sucesso', 
        programas_importados: totalImported 
      })
      .eq('id', syncLog?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sincronização concluída: ${totalImported} programas importados`,
        programas_importados: totalImported,
        total_encontrados: allProgramas.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching JW.org programs:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao sincronizar' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});