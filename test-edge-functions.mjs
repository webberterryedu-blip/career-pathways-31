import fetch from 'node-fetch';

async function testEdgeFunctions() {
  const supabaseUrl = 'https://dlvojolvdsqrfczjjjuw.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdm9qb2x2ZHNxcmZjempqanV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MDcyNzMsImV4cCI6MjA0Njk4MzI3M30.nUrN2bCd-pX6bJOV1fTxhI8CamBW1yZpFQLX6qTLzsk';
  
  console.log('🔍 Testing list-programs-json Edge Function...');
  
  try {
    // Test list-programs-json
    const programsResponse = await fetch(`${supabaseUrl}/functions/v1/list-programs-json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ limit: 5 })
    });
    
    console.log(`Status: ${programsResponse.status}`);
    
    if (programsResponse.ok) {
      const programsData = await programsResponse.json();
      console.log('✅ list-programs-json success:', {
        success: programsData.success,
        count: programsData.programas?.length || 0
      });
    } else {
      const errorText = await programsResponse.text();
      console.log('❌ list-programs-json failed:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ list-programs-json error:', error.message);
  }
  
  console.log('\n🔍 Testing generate-assignments Edge Function...');
  
  try {
    // Test generate-assignments
    const assignmentsResponse = await fetch(`${supabaseUrl}/functions/v1/generate-assignments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        semana: '2024-12-09',
        data_reuniao: '2024-12-09',
        partes_customizadas: [
          {
            id: '1',
            tipo: 'opening_comments',
            titulo: 'Comentários Iniciais',
            minutos: 3
          },
          {
            id: '2',
            tipo: 'bible_reading',
            titulo: 'Leitura da Bíblia',
            minutos: 4
          }
        ]
      })
    });
    
    console.log(`Status: ${assignmentsResponse.status}`);
    
    if (assignmentsResponse.ok) {
      const assignmentsData = await assignmentsResponse.json();
      console.log('✅ generate-assignments success:', {
        success: assignmentsData.success,
        assignmentsCount: assignmentsData.data?.designacoes?.length || 0
      });
    } else {
      const errorText = await assignmentsResponse.text();
      console.log('❌ generate-assignments failed:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ generate-assignments error:', error.message);
  }
}

testEdgeFunctions();