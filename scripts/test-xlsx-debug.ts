import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { ExportService } from '../src/services/relatorio/ExportService';

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testarXLSXDetalhado() {
  console.log('🧪 [TESTE] Verificando XLSX detalhadamente...');
  
  try {
    const exportService = new ExportService();
    
    // Gerar XLSX
    const xlsxBuffer = await exportService.gerarXLSX(306);
    
    // Salvar arquivo temporário
    const tempPath = 'temp/debug_cotacao_306.xlsx';
    fs.writeFileSync(tempPath, xlsxBuffer);
    console.log(`💾 [DEBUG] XLSX salvo em ${tempPath}`);
    
    // Ler o arquivo XLSX de volta para verificar o conteúdo
    const workbook = XLSX.readFile(tempPath);
    console.log('\n📋 [SHEETS] Abas encontradas:', workbook.SheetNames);
    
    // Verificar aba de Itens
    if (workbook.SheetNames.includes('Itens')) {
      console.log('\n📦 [ITENS] Conteúdo da aba Itens:');
      const itensSheet = workbook.Sheets['Itens'];
      if (itensSheet) {
        const itensData = XLSX.utils.sheet_to_json(itensSheet, { header: 1 });
        
        console.log('📊 [ITENS] Dados brutos da aba:');
        itensData.forEach((row, index) => {
          console.log(`  Linha ${index + 1}:`, row);
        });
      }
    } else {
      console.log('❌ [ERRO] Aba "Itens" não encontrada!');
    }
    
    // Verificar aba de Informações Gerais
    if (workbook.SheetNames.includes('Informações Gerais')) {
      console.log('\n📋 [INFO] Conteúdo da aba Informações Gerais:');
      const infoSheet = workbook.Sheets['Informações Gerais'];
      if (infoSheet) {
        const infoData = XLSX.utils.sheet_to_json(infoSheet, { header: 1 });
        
        console.log('📊 [INFO] Primeiras 10 linhas:');
        infoData.slice(0, 10).forEach((row, index) => {
          console.log(`  Linha ${index + 1}:`, row);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ [TESTE] Erro:', error);
    if (error instanceof Error) {
      console.error('❌ [TESTE] Stack trace:', error.stack);
    }
  }
}

testarXLSXDetalhado().then(() => {
  console.log('\n🏁 Teste XLSX detalhado finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
