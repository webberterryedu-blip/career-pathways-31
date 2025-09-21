/**
 * Test script for Treasures From God's Word Assignment Function
 * 
 * This script tests the new Supabase Edge Function for generating assignments
 * based on the "Treasures From God's Word" meeting structure.
 */

// Configuration - Update these values with your Supabase project details
const CONFIG = {
  SUPABASE_URL: 'https://jbapewpuvfijrkhlbsid.supabase.co',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ4NzcsImV4cCI6MjA3Mzk1MDg3N30.kaj9f-oVMlpzddZbBilbU81grVVpmLjKKmUG-zpKoSg',
  FUNCTION_ENDPOINT: '/functions/v1/generate-treasures-assignments'
};

/**
 * Test the Treasures assignment function
 */
async function testTreasuresAssignment() {
  console.log('🧪 Testing Treasures From God\'s Word Assignment Function...\n');
  
  // Test data
  const testData = {
    semana: '2024-12-09',
    data_reuniao: '2024-12-09',
    modo_pratica: false
  };
  
  try {
    console.log('📤 Sending request with data:', JSON.stringify(testData, null, 2));
    
    // Make the request
    const response = await fetch(`${CONFIG.SUPABASE_URL}${CONFIG.FUNCTION_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`\n📡 Response Status: ${response.status} ${response.statusText}`);
    
    // Parse response
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Success!');
      console.log(`📋 Message: ${data.message}`);
      
      // Show statistics if available
      if (data.data?.estatisticas) {
        const stats = data.data.estatisticas;
        console.log('\n📊 Statistics:');
        console.log(`   Total students available: ${stats.total_estudantes_disponiveis}`);
        console.log(`   Parts assigned: ${stats.total_partes_designadas}`);
        console.log(`   Students without assignment: ${stats.estudantes_sem_designacao?.length || 0}`);
        console.log(`   Conflicts found: ${stats.conflitos_encontrados?.length || 0}`);
      }
      
      // Show sample assignments
      if (data.data?.designacoes && data.data.designacoes.length > 0) {
        console.log('\n📝 Sample Assignments:');
        const sample = data.data.designacoes.slice(0, 3);
        sample.forEach((assignment, index) => {
          console.log(`   ${index + 1}. ${assignment.assignment_title}`);
          console.log(`      Student: ${assignment.student_name || assignment.student_id}`);
          if (assignment.assistant_name || assignment.assistant_id) {
            console.log(`      Assistant: ${assignment.assistant_name || assignment.assistant_id}`);
          }
          console.log(`      Duration: ${assignment.assignment_duration} minutes`);
        });
      }
      
      return true;
    } else {
      console.log('❌ Error:');
      console.log(`   Message: ${data.message}`);
      if (data.error) {
        console.log(`   Details: ${data.error}`);
      }
      return false;
    }
  } catch (error) {
    console.log('💥 Network Error:');
    console.log(`   ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify SUPABASE_URL and ANON_KEY are correct');
    console.log('   3. Ensure the function is deployed');
    console.log('   4. Check Supabase function logs for details');
    return false;
  }
}

/**
 * Run the test
 */
async function runTest() {
  console.log('🚀 Treasures From God\'s Word Assignment Function Test');
  console.log('=====================================================\n');
  
  // Check if configuration is set
  if (CONFIG.SUPABASE_URL.includes('YOUR_PROJECT_ID') || 
      CONFIG.ANON_KEY.includes('YOUR_ANON_KEY')) {
    console.log('⚠️  Configuration Required!');
    console.log('   Please update the CONFIG object with your Supabase details.\n');
    return;
  }
  
  const success = await testTreasuresAssignment();
  
  console.log('\n🏁 Test Complete');
  console.log(success ? '✅ PASSED' : '❌ FAILED');
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTest();
}

// Export for use in other modules (ES module syntax)
export { testTreasuresAssignment, runTest };