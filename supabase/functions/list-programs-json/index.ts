import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
            id: "2024-01-01",
            name: "1-7 de janeiro de 2024",
            week: "1-7 de janeiro",
            year: 2024,
            sections: [
              {
                title: "TESOUROS DA PALAVRA DE DEUS",
                parts: [
                  {
                    id: "treasures-1",
                    title: "Demonstração bíblica: Filipenses 1:1-6",
                    time: 4,
                    type: "demonstration",
                    participants: 2,
                    gender_restriction: "mixed",
                    qualifications: ["batizado"]
                  }
                ]
              },
              {
                title: "FAÇAMOS DISCÍPULOS",
                parts: [
                  {
                    id: "ministry-1",
                    title: "Primeira conversa",
                    time: 3,
                    type: "ministry",
                    participants: 2,
                    gender_restriction: "mixed"
                  }
                ]
              },
              {
                title: "NOSSA VIDA CRISTÃ",
                parts: [
                  {
                    id: "living-1",
                    title: "Necessidades da congregação",
                    time: 15,
                    type: "talk",
                    participants: 1,
                    gender_restriction: "brother",
                    qualifications: ["anciao", "servo_ministerial"]
                  }
                ]
              }
            ]
          },
          {
            id: "2024-01-08",
            name: "8-14 de janeiro de 2024",
            week: "8-14 de janeiro",
            year: 2024,
            sections: [
              {
                title: "TESOUROS DA PALAVRA DE DEUS",
                parts: [
                  {
                    id: "treasures-2",
                    title: "Demonstração bíblica: Filipenses 1:7-11",
                    time: 4,
                    type: "demonstration",
                    participants: 2,
                    gender_restriction: "mixed",
                    qualifications: ["batizado"]
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