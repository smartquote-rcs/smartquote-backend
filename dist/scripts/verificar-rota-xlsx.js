"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const XLSX = __importStar(require("xlsx"));
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
            const itemLinha = jsonData[3];
            console.log('  Nome:', itemLinha[0] || 'VAZIO');
            console.log('  Descrição:', itemLinha[1] || 'VAZIO');
            console.log('  Preço:', itemLinha[2] || 'VAZIO');
            console.log('  Quantidade:', itemLinha[3] || 'VAZIO');
            console.log('  Subtotal:', itemLinha[4] || 'VAZIO');
            console.log('  Origem:', itemLinha[5] || 'VAZIO');
            console.log('  Provider:', itemLinha[6] || 'VAZIO');
        }
    }
}
else {
    console.log('❌ Aba "Itens" não encontrada nas abas:', workbook.SheetNames);
}
//# sourceMappingURL=verificar-rota-xlsx.js.map