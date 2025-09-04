import { ExportService } from '../src/services/relatorio/ExportService';
import supabase from '../src/infra/supabase/connect';

async function testeSimples() {
  console.log('🧪 [TESTE] Testando busca de cotação...');
  
  try {
    // Primeiro, vamos ver quais cotações existem
    const { data: cotacoes, error } = await supabase
      .from('cotacoes')
      .select('id, status, orcamento_geral')
      .limit(5);
    
    if (error) {
      console.error('❌ [TESTE] Erro ao buscar cotações:', error);
      return;
    }
    
    console.log('📊 [TESTE] Cotações encontradas:', cotacoes?.length || 0);
    if (cotacoes && cotacoes.length > 0) {
      console.log('📋 [TESTE] Primeiras cotações:', cotacoes.map(c => ({ id: c.id, status: c.status })));
      
      // Testar com a primeira cotação
      const primeiraId = cotacoes[0]?.id;
      if (primeiraId) {
        console.log(`🎯 [TESTE] Testando com cotação ID: ${primeiraId}`);
        
        const exportService = new ExportService();
        const dados = await exportService.buscarDadosResumo(primeiraId);
        
        console.log('✅ [TESTE] Dados resumidos obtidos com sucesso!');
        console.log('📊 [TESTE] Cotação:', dados.cotacaoId, 'Status:', dados.cotacaoStatus);
        console.log('📊 [TESTE] Itens:', dados.itens.length);
        console.log('📊 [TESTE] Orçamento:', dados.orcamentoGeral);
      }
      
    } else {
      console.log('⚠️ [TESTE] Nenhuma cotação encontrada');
    }
    
  } catch (error) {
    console.error('❌ [TESTE] Erro durante teste:', error);
  }
}

testeSimples();
