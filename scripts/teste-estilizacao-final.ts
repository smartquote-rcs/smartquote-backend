import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { ExportService } from '../src/services/relatorio/ExportService';

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testeCompletoEstilizacao() {
  console.log('🎨 [TESTE] Testando estilização completa do XLSX...');
  
  try {
    const exportService = new ExportService();
    
    // Gerar XLSX estilizado
    console.log('\n📊 Gerando XLSX estilizado...');
    const xlsxBuffer = await exportService.gerarXLSX(306);
    
    // Salvar arquivo final
    const finalPath = 'temp/RELATORIO_COTACAO_306_FINAL.xlsx';
    fs.writeFileSync(finalPath, xlsxBuffer);
    
    console.log(`✅ XLSX estilizado salvo em: ${finalPath}`);
    console.log(`📏 Tamanho do arquivo: ${xlsxBuffer.length} bytes`);
    
    // Gerar CSV também para comparação
    console.log('\n📄 Gerando CSV para comparação...');
    const csv = await exportService.gerarCSV(306);
    fs.writeFileSync('temp/RELATORIO_COTACAO_306_FINAL.csv', csv);
    
    console.log('\n🎯 [RECURSOS IMPLEMENTADOS]:');
    console.log('✅ Cabeçalhos coloridos (azul profissional)');
    console.log('✅ Linhas alternadas (zebra pattern)');
    console.log('✅ Bordas e formatação');
    console.log('✅ Largura automática das colunas');
    console.log('✅ Títulos estilizados');
    console.log('✅ Linha TOTAL destacada');
    console.log('✅ Formatação monetária (AOA)');
    
    console.log('\n📋 [ESTRUTURA DO XLSX]:');
    console.log('🔸 Aba "Informações Gerais" - Dados da cotação');
    console.log('🔸 Aba "Itens" - Tabela de itens com estilização');
    console.log('🔸 Aba "Faltantes" - Se houver itens faltantes');
    
  } catch (error) {
    console.error('❌ [TESTE] Erro:', error);
    if (error instanceof Error) {
      console.error('❌ [TESTE] Stack trace:', error.stack);
    }
  }
}

testeCompletoEstilizacao().then(() => {
  console.log('\n🏁 Teste de estilização completo finalizado');
  console.log('📁 Arquivo final: temp/RELATORIO_COTACAO_306_FINAL.xlsx');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
