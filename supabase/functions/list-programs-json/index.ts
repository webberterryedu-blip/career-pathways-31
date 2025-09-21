// deno-lint-ignore-file
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Declare Deno namespace for TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface Program {
  id: string;
  name: string;
  week: string;
  year: number;
  sections: ProgramSection[];
}

interface ProgramSection {
  title: string;
  parts: ProgramPart[];
}

interface ProgramPart {
  id: string;
  title: string;
  time: number;
  type: string;
  participants: number;
  gender_restriction?: string;
  qualifications?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'GET') {
      // Query programs from database
      const { data: programs, error } = await supabase
        .from('programacoes')
        .select('*')
        .order('semana', { ascending: true });

      if (error) {
        console.error('Database error:', error);
        
        // Fallback to mock data if database fails
        const mockPrograms: Program[] = [
          {
            id: "2025-11-03",
            name: "3-9 de novembro de 2025",
            week: "3-9 de novembro",
            year: 2025,
            sections: [
              {
                title: "ABERTURA",
                parts: [
                  {
                    id: "opening-1",
                    title: "Cântico 1",
                    time: 3,
                    type: "song",
                    participants: 1
                  },
                  {
                    id: "opening-2",
                    title: "Comentários Iniciais",
                    time: 3,
                    type: "opening_comments",
                    participants: 1
                  }
                ]
              },
              {
                title: "TESOUROS DA PALAVRA DE DEUS",
                parts: [
                  {
                    id: "treasures-1",
                    title: "Discurso dos Tesouros",
                    time: 10,
                    type: "talk",
                    participants: 1
                  },
                  {
                    id: "treasures-2",
                    title: "Joias Espirituais",
                    time: 10,
                    type: "spiritual_gems",
                    participants: 1
                  },
                  {
                    id: "treasures-3",
                    title: "Leitura da Bíblia",
                    time: 4,
                    type: "bible_reading",
                    participants: 1
                  }
                ]
              },
              {
                title: "FAÇAMOS DISCÍPULOS",
                parts: [
                  {
                    id: "apply-1",
                    title: "Iniciando Conversas",
                    time: 3,
                    type: "starting",
                    participants: 1
                  },
                  {
                    id: "apply-2",
                    title: "Revisitas",
                    time: 4,
                    type: "following",
                    participants: 1
                  },
                  {
                    id: "apply-3",
                    title: "Fazendo Discípulos",
                    time: 5,
                    type: "making_disciples",
                    participants: 1
                  }
                ]
              },
              {
                title: "NOSSA VIDA CRISTÃ",
                parts: [
                  {
                    id: "living-1",
                    title: "Necessidades Locais",
                    time: 15,
                    type: "local_needs",
                    participants: 1
                  },
                  {
                    id: "living-2",
                    title: "Estudo Bíblico de Congregação",
                    time: 30,
                    type: "cbs",
                    participants: 1
                  }
                ]
              },
              {
                title: "ENCERRAMENTO",
                parts: [
                  {
                    id: "closing-1",
                    title: "Comentários Finais",
                    time: 3,
                    type: "concluding_comments",
                    participants: 1
                  },
                  {
                    id: "closing-2",
                    title: "Cântico 2",
                    time: 3,
                    type: "song",
                    participants: 1
                  }
                ]
              }
            ]
          },
          {
            id: "2025-11-10",
            name: "10-16 de novembro de 2025",
            week: "10-16 de novembro",
            year: 2025,
            sections: [
              {
                title: "ABERTURA",
                parts: [
                  {
                    id: "opening-1",
                    title: "Cântico 1",
                    time: 3,
                    type: "song",
                    participants: 1
                  },
                  {
                    id: "opening-2",
                    title: "Comentários Iniciais",
                    time: 3,
                    type: "opening_comments",
                    participants: 1
                  }
                ]
              },
              {
                title: "TESOUROS DA PALAVRA DE DEUS",
                parts: [
                  {
                    id: "treasures-1",
                    title: "Discurso dos Tesouros",
                    time: 10,
                    type: "talk",
                    participants: 1
                  },
                  {
                    id: "treasures-2",
                    title: "Joias Espirituais",
                    time: 10,
                    type: "spiritual_gems",
                    participants: 1
                  },
                  {
                    id: "treasures-3",
                    title: "Leitura da Bíblia",
                    time: 4,
                    type: "bible_reading",
                    participants: 1
                  }
                ]
              },
              {
                title: "FAÇAMOS DISCÍPULOS",
                parts: [
                  {
                    id: "apply-1",
                    title: "Iniciando Conversas",
                    time: 3,
                    type: "starting",
                    participants: 1
                  },
                  {
                    id: "apply-2",
                    title: "Revisitas",
                    time: 4,
                    type: "following",
                    participants: 1
                  },
                  {
                    id: "apply-3",
                    title: "Fazendo Discípulos",
                    time: 5,
                    type: "making_disciples",
                    participants: 1
                  }
                ]
              },
              {
                title: "NOSSA VIDA CRISTÃ",
                parts: [
                  {
                    id: "living-1",
                    title: "Necessidades Locais",
                    time: 15,
                    type: "local_needs",
                    participants: 1
                  },
                  {
                    id: "living-2",
                    title: "Estudo Bíblico de Congregação",
                    time: 30,
                    type: "cbs",
                    participants: 1
                  }
                ]
              },
              {
                title: "ENCERRAMENTO",
                parts: [
                  {
                    id: "closing-1",
                    title: "Comentários Finais",
                    time: 3,
                    type: "concluding_comments",
                    participants: 1
                  },
                  {
                    id: "closing-2",
                    title: "Cântico 2",
                    time: 3,
                    type: "song",
                    participants: 1
                  }
                ]
              }
            ]
          }
        ];

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: mockPrograms,
            source: 'fallback',
            message: 'Using fallback data due to database connectivity issues'
          }),
          {
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
          }
        );
      }

      // Transform database data to expected format
      const transformedPrograms = transformDatabasePrograms(programs || []);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: transformedPrograms,
          source: 'database',
          count: transformedPrograms.length
        }),
        {
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
        }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      }
    );
  }
});

function transformDatabasePrograms(dbPrograms: any[]): Program[] {
  const programsMap = new Map<string, Program>();

  dbPrograms.forEach(program => {
    const weekKey = program.semana || program.week_date;
    const programId = weekKey || `program-${program.id}`;
    
    if (!programsMap.has(programId)) {
      programsMap.set(programId, {
        id: programId,
        name: program.nome || `Semana de ${weekKey}`,
        week: weekKey,
        year: new Date(weekKey).getFullYear() || 2024,
        sections: []
      });
    }

    const currentProgram = programsMap.get(programId)!;
    
    // Find or create section
    let section = currentProgram.sections.find(s => s.title === program.secao);
    if (!section) {
      section = {
        title: program.secao || "SEÇÃO GERAL",
        parts: []
      };
      currentProgram.sections.push(section);
    }

    // Add part to section
    section.parts.push({
      id: `part-${program.id}`,
      title: program.parte || program.title || "Parte sem título",
      time: program.tempo || 5,
      type: program.tipo || "talk",
      participants: program.participantes || 1,
      gender_restriction: program.restricao_genero,
      qualifications: program.qualificacoes || []
    });
  });

  return Array.from(programsMap.values());
}