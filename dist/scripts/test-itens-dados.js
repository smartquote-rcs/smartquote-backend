"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ExportService_1 = require("../src/services/relatorio/ExportService");
// Carregar variáveis de ambiente
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
async function testarDadosItens() {
    console.log('🧪 [TESTE] Verificando dados dos itens...');
    try {
        const exportService = new ExportService_1.ExportService();
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
    }
    catch (error) {
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
//# sourceMappingURL=test-itens-dados.js.map