import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { ExportService } from '../src/services/relatorio/ExportService';

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testarConteudo() {
  console.log('🧪 [TESTE] Verificando conteúdo dos exports...');
  
  try {
    const exportService = new ExportService();
    
    // Testar CSV e mostrar conteúdo completo
    console.log('\n📄 [TESTE] CSV COMPLETO para cotação 306:');
    const csv = await exportService.gerarCSV(306);
    console.log('='.repeat(80));
    console.log(csv);
    console.log('='.repeat(80));
    
    // Salvar para inspeção
    fs.writeFileSync('temp/teste_cotacao_306.csv', csv);
    console.log('💾 [TESTE] CSV salvo em temp/teste_cotacao_306.csv');
    
    // Testar XLSX
    console.log('\n📊 [TESTE] Gerando XLSX...');
    const xlsxBuffer = await exportService.gerarXLSX(306);
    fs.writeFileSync('temp/teste_cotacao_306.xlsx', xlsxBuffer);
    console.log('💾 [TESTE] XLSX salvo em temp/teste_cotacao_306.xlsx');
    
  } catch (error) {
    console.error('❌ [TESTE] Erro:', error);
    if (error instanceof Error) {
      console.error('❌ [TESTE] Stack trace:', error.stack);
    }
  }
}

testarConteudo().then(() => {
  console.log('\n🏁 Teste de conteúdo finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
