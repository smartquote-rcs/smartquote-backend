import * as XLSX from 'xlsx';

// Ler o arquivo baixado diretamente da rota
const workbook = XLSX.readFile('temp/teste_direto_rota.xlsx');

console.log('📋 [ROTA] Abas encontradas:', workbook.SheetNames);

// Verificar aba de Itens especificamente
if (workbook.SheetNames.includes('Itens')) {
  console.log('\n📦 [ITENS] Dados da aba Itens (da rota HTTP):');
  const itensSheet = workbook.Sheets['Itens'];
  
  if (itensSheet) {
    // Converter para JSON para visualização mais clara
    const jsonData = XLSX.utils.sheet_to_json(itensSheet, { 
      header: 1,
      defval: '' // Usa string vazia para células vazias
    });
    
    console.log('📊 [DADOS] Conteúdo completo da aba Itens:');
    jsonData.forEach((row, index) => {
      console.log(`Linha ${index + 1}:`, row);
    });
    
    // Verificar se há dados após o cabeçalho
    const dadosItens = jsonData.slice(3); // Pular título, linha vazia e cabeçalho
    console.log(`\n📈 [CONTAGEM] Total de linhas de dados: ${dadosItens.length}`);
    
    // Verificar linha específica do item
    if (jsonData.length >= 4) {
      console.log('\n🔍 [ITEM] Linha 4 (dados do item):');
      const itemLinha = jsonData[3] as any[];
      console.log('  Nome:', itemLinha[0] || 'VAZIO');
      console.log('  Descrição:', itemLinha[1] || 'VAZIO');
      console.log('  Preço:', itemLinha[2] || 'VAZIO');
      console.log('  Quantidade:', itemLinha[3] || 'VAZIO');
      console.log('  Subtotal:', itemLinha[4] || 'VAZIO');
      console.log('  Origem:', itemLinha[5] || 'VAZIO');
      console.log('  Provider:', itemLinha[6] || 'VAZIO');
    }
  }
} else {
  console.log('❌ Aba "Itens" não encontrada nas abas:', workbook.SheetNames);
}
