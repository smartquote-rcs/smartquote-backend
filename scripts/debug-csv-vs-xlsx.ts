import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { ExportService } from '../src/services/relatorio/ExportService';

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

async function compararCSVvsXLSX() {
  console.log('🧪 [TESTE] Comparando CSV vs XLSX...');
  
  try {
    const exportService = new ExportService();
    
    // Gerar ambos os formatos
    console.log('\n📄 Gerando CSV...');
    const csv = await exportService.gerarCSV(306);
    
    console.log('\n📊 Gerando XLSX...');
    const xlsxBuffer = await exportService.gerarXLSX(306);
    
    // Salvar ambos
    fs.writeFileSync('temp/comparacao_306.csv', csv);
    fs.writeFileSync('temp/comparacao_306.xlsx', xlsxBuffer);
    
    console.log('\n📄 [CSV] Linhas com "ITENS":');
    const csvLines = csv.split('\n');
    csvLines.forEach((line, index) => {
      if (line.includes('ITENS') || line.includes('Servidor') || line.includes('Nome,Descrição')) {
        console.log(`  Linha ${index + 1}: ${line}`);
      }
    });
    
    console.log('\n📊 [XLSX] Verificando estrutura interna...');
    
    // Ler XLSX de volta e analisar cada célula da aba Itens
    const workbook = XLSX.readFile('temp/comparacao_306.xlsx');
    const itensSheet = workbook.Sheets['Itens'];
    
    if (itensSheet) {
      console.log('\n🔍 [XLSX] Células da aba Itens:');
      
      // Verificar o range da planilha
      const range = XLSX.utils.decode_range(itensSheet['!ref'] || 'A1:A1');
      console.log(`📐 Range da planilha: ${itensSheet['!ref']}`);
      
      // Listar todas as células
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = itensSheet[cellRef];
          if (cell && cell.v) {
            console.log(`  ${cellRef}: "${cell.v}"`);
          }
        }
      }
      
      // Converter para array e mostrar
      console.log('\n📊 [XLSX] Como array:');
      const arrayData = XLSX.utils.sheet_to_json(itensSheet, { header: 1 });
      arrayData.forEach((row, index) => {
        if (Array.isArray(row) && row.length > 0) {
          console.log(`  Linha ${index + 1}:`, JSON.stringify(row));
        }
      });
      
    } else {
      console.log('❌ [XLSX] Aba "Itens" não encontrada!');
    }
    
  } catch (error) {
    console.error('❌ [TESTE] Erro:', error);
    if (error instanceof Error) {
      console.error('❌ [TESTE] Stack trace:', error.stack);
    }
  }
}

compararCSVvsXLSX().then(() => {
  console.log('\n🏁 Comparação finalizada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
