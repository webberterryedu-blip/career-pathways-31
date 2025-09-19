const { supabase } = require('./config/supabase');

/**
 * Script para testar o algoritmo de designações
 */

async function testarAlgoritmoDesignacoes() {
  console.log('🧪 Testando Algoritmo Central de Designações...\n');
  
  try {
    // 1. Verificar se temos estudantes na base
    console.log('1️⃣ Verificando estudantes disponíveis...');
    const { data: estudantes, error: estudantesError } = await supabase
      .from('vw_estudantes_grid')
      .select('*')
      .eq('ativo', true);
    
    if (estudantesError) {
      console.error('❌ Erro ao buscar estudantes:', estudantesError);
      return;
    }
    
    console.log(`✅ Encontrados ${estudantes.length} estudantes ativos`);
    
    // Mostrar alguns estudantes de exemplo
    if (estudantes.length > 0) {
      console.log('\n📝 Amostra de estudantes:');
      estudantes.slice(0, 5).forEach(e => {
        console.log(`   - ${e.nome} (${e.genero}, ${e.cargo})`);
        console.log(`     Qualificações: reading=${e.reading}, talk=${e.talk}, starting=${e.starting}`);
      });
    }
    
    // 2. Testar o endpoint de geração de designações
    console.log('\n2️⃣ Testando geração de designações via API...');
    
    const testPayload = {
      semana: '2025-09-22', 
      data_reuniao: '2025-09-22',
      // Usar partes padrão definidas no algoritmo
    };
    
    console.log('📤 Payload de teste:', JSON.stringify(testPayload, null, 2));
    
    // Simular chamada para o endpoint
    const response = await fetch('http://localhost:3000/api/designacoes/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    if (!response.ok) {
      console.error('❌ Erro na chamada da API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Detalhes do erro:', errorText);
      return;
    }
    
    const resultado = await response.json();
    
    console.log('\n✅ Designações geradas com sucesso!');
    console.log('📊 Estatísticas:');
    console.log(`   - Partes designadas: ${resultado.data.estatisticas.total_partes_designadas}`);
    console.log(`   - Estudantes sem designação: ${resultado.data.estatisticas.estudantes_sem_designacao.length}`);
    console.log(`   - Conflitos: ${resultado.data.estatisticas.conflitos_encontrados.length}`);
    
    // 3. Mostrar detalhes das designações
    console.log('\n📋 Designações geradas:');
    resultado.data.resultados_completos.forEach((resultado, index) => {
      const parte = resultado.parte;
      const principal = resultado.estudante_principal;
      const ajudante = resultado.ajudante;
      
      console.log(`   ${index + 1}. ${parte.titulo} (${parte.minutos} min)`);
      console.log(`      👤 Principal: ${principal.nome} (${principal.cargo})`);
      if (ajudante) {
        console.log(`      🤝 Ajudante: ${ajudante.nome} (${ajudante.cargo})`);
      }
      console.log(`      💡 Motivo: ${resultado.motivo_escolha}`);
      console.log(`      🔢 Alternativas: ${resultado.alternativas_consideradas}`);
      console.log('');
    });
    
    // 4. Mostrar conflitos se houver
    if (resultado.data.estatisticas.conflitos_encontrados.length > 0) {
      console.log('⚠️ Conflitos encontrados:');
      resultado.data.estatisticas.conflitos_encontrados.forEach(conflito => {
        console.log(`   - ${conflito}`);
      });
    }
    
    // 5. Distribuição por cargo
    console.log('\n👥 Distribuição por cargo:');
    Object.entries(resultado.data.estatisticas.distribuicao_por_cargo).forEach(([cargo, count]) => {
      console.log(`   - ${cargo}: ${count} designações`);
    });
    
    console.log('\n🎉 Teste do algoritmo concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  testarAlgoritmoDesignacoes()
    .then(() => {
      console.log('\n✅ Script de teste finalizado');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Falha no script de teste:', error);
      process.exit(1);
    });
}

module.exports = { testarAlgoritmoDesignacoes };