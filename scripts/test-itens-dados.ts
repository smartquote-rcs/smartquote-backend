import dotenv from 'dotenv';
import path from 'path';
import { ExportService } from '../src/services/relatorio/ExportService';

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testarDadosItens() {
  console.log('🧪 [TESTE] Verificando dados dos itens...');
  
  try {
    const exportService = new ExportService();
    
    // Buscar dados diretamente
    const dados = await exportService.buscarDadosResumo(306);
    
    console.log('📊 [DADOS] Estrutura completa dos dados:');
    console.log(JSON.stringify(dados, null, 2));
    
    console.log('\n📦 [ITENS] Quantidade de itens encontrados:', dados.itens.length);
    
    dados.itens.forEach((item, index) => {
      console.log(`\n🔸 [ITEM ${index + 1}]:`);
      console.log(`  Nome: "${item.nome}"`);
      console.log(`  Descrição: "${item.descricao}"`);
      console.log(`  Preço: ${item.preco}`);
      console.log(`  Quantidade: ${item.quantidade}`);
      console.log(`  Subtotal: ${item.subtotal}`);
      console.log(`  Origem: "${item.origem}"`);
      console.log(`  Provider: "${item.provider}"`);
    });
    
  } catch (error) {
    console.error('❌ [TESTE] Erro:', error);
    if (error instanceof Error) {
      console.error('❌ [TESTE] Stack trace:', error.stack);
    }
  }
}

testarDadosItens().then(() => {
  console.log('\n🏁 Teste de dados dos itens finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
