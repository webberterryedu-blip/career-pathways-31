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
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: 'LOVABLE_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Accept multipart form data with PDF file
    const formData = await req.formData();
    const file = formData.get('pdf') as File | null;
    const saveToDb = formData.get('save') === 'true';

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum arquivo PDF enviado. Envie um campo "pdf" no formData.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Received PDF: ${file.name}, size: ${file.size} bytes`);

    // Read file as base64 for AI processing
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    console.log('Sending PDF to AI for extraction...');

    // Use Gemini with PDF vision to extract structured data
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um parser especializado em apostilas MWB (Vida e Ministério Cristão) das Testemunhas de Jeová.

Extraia TODAS as semanas do PDF e retorne um JSON válido com a estrutura abaixo. Retorne SOMENTE o JSON, sem markdown, sem \`\`\`, sem explicações.

Estrutura esperada:
{
  "semanas": [
    {
      "semana_label": "8-14 de setembro",
      "tema": "PROVÉRBIOS 30",
      "leitura_biblica": "Provérbios 30:1-14",
      "cantico_inicial": 136,
      "cantico_meio": 80,
      "cantico_final": 128,
      "partes": [
        {
          "ordem": 1,
          "titulo": "Título da parte",
          "duracao_min": 10,
          "tipo": "discurso_tesouros|joias_espirituais|leitura_biblia|primeira_conversa|revisita|estudo_biblico|discurso_estudante|parte_vida_crista|estudo_congregacao|necessidades_congregacao",
          "secao": "tesouros|ministerio|vida_crista",
          "referencia": "Referências bíblicas se houver"
        }
      ]
    }
  ],
  "mes_ano": "setembro 2025",
  "idioma": "pt"
}

Regras:
- "secao" deve ser: "tesouros" (Tesouros da Palavra de Deus), "ministerio" (Faça Seu Melhor no Ministério), "vida_crista" (Nossa Vida Cristã)
- Cada seção da reunião tem suas partes específicas
- Tesouros: discurso principal (10min), joias espirituais (10min), leitura da Bíblia (4min)
- Ministério: partes de demonstração (iniciando conversas, cultivando interesse, fazendo discípulos, explicando crenças)
- Vida Cristã: considerações, necessidades locais, estudo bíblico de congregação (30min)
- Identifique os 3 cânticos (inicial, do meio, final)
- Extraia a referência da leitura da Bíblia para a parte "Leitura da Bíblia"
- Não inclua "Comentários iniciais" nem "Comentários finais" como partes separadas
- Inclua TODAS as semanas presentes no PDF`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analise este PDF da apostila MWB e extraia todas as semanas com suas partes. Retorne SOMENTE JSON válido.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 16000,
        temperature: 0.1
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: `Erro na API de IA: ${aiResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';
    console.log('AI response length:', rawContent.length);

    // Clean and parse JSON from AI response
    let cleanJson = rawContent
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      // Try to find JSON object in the response
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Failed to parse AI response:', cleanJson.substring(0, 500));
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Não foi possível interpretar a resposta da IA',
            raw_preview: cleanJson.substring(0, 300)
          }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const semanas = parsed.semanas || [];
    const mesAno = parsed.mes_ano || '';
    const idioma = parsed.idioma || 'pt';

    console.log(`Parsed ${semanas.length} weeks from PDF`);

    // Convert semana_label to dates (approximate)
    const programas: ProgramaSemana[] = semanas.map((s: any) => {
      // Try to parse dates from semana_label like "8-14 de setembro"
      const dateMatch = s.semana_label?.match(/(\d+)[-–](\d+)\s+de\s+(\w+)/);
      let semanaInicio = '';
      let semanaFim = '';
      
      if (dateMatch) {
        const monthNames: Record<string, string> = {
          'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
          'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
          'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
        };
        const month = monthNames[dateMatch[3].toLowerCase()] || '01';
        // Guess year from mes_ano or use current year
        const yearMatch = mesAno.match(/(\d{4})/);
        const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
        semanaInicio = `${year}-${month}-${dateMatch[1].padStart(2, '0')}`;
        semanaFim = `${year}-${month}-${dateMatch[2].padStart(2, '0')}`;
      }

      return {
        semana_inicio: semanaInicio,
        semana_fim: semanaFim,
        semana_label: s.semana_label || '',
        mes_ano: mesAno,
        tema: s.tema || '',
        leitura_biblica: s.leitura_biblica || '',
        cantico_inicial: s.cantico_inicial || 0,
        cantico_meio: s.cantico_meio || 0,
        cantico_final: s.cantico_final || 0,
        partes: (s.partes || []).map((p: any, idx: number) => ({
          ordem: p.ordem || idx + 1,
          titulo: p.titulo || '',
          duracao_min: p.duracao_min || 0,
          tipo: p.tipo || 'outro',
          secao: p.secao || 'tesouros',
          referencia: p.referencia || undefined,
        })),
        idioma,
      };
    });

    // Optionally save to database
    let savedCount = 0;
    if (saveToDb && programas.length > 0) {
      for (const programa of programas) {
        if (!programa.semana_inicio) continue;
        
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
            partes: programa.partes as any,
            idioma: programa.idioma,
            fonte_url: `pdf:${file.name}`,
            ultima_sincronizacao: new Date().toISOString()
          }, {
            onConflict: 'semana_inicio,idioma',
            ignoreDuplicates: false
          });

        if (!error) {
          savedCount++;
        } else {
          console.error('Error saving program:', error);
        }
      }
      console.log(`Saved ${savedCount} programs to database`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        programas,
        total_semanas: programas.length,
        mes_ano: mesAno,
        saved: saveToDb ? savedCount : undefined,
        message: `PDF processado: ${programas.length} semana(s) extraída(s)${saveToDb ? `, ${savedCount} salva(s) no banco` : ''}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-mwb-pdf:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
