"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ExportService_1 = require("../src/services/relatorio/ExportService");
// Carregar variáveis de ambiente
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
async function testarConteudo() {
    console.log('🧪 [TESTE] Verificando conteúdo dos exports...');
    try {
        const exportService = new ExportService_1.ExportService();
        // Testar CSV e mostrar conteúdo completo
        console.log('\n📄 [TESTE] CSV COMPLETO para cotação 306:');
        const csv = await exportService.gerarCSV(306);
        console.log('='.repeat(80));
        console.log(csv);
        console.log('='.repeat(80));
        // Salvar para inspeção
        fs_1.default.writeFileSync('temp/teste_cotacao_306.csv', csv);
        console.log('💾 [TESTE] CSV salvo em temp/teste_cotacao_306.csv');
        // Testar XLSX
        console.log('\n📊 [TESTE] Gerando XLSX...');
        const xlsxBuffer = await exportService.gerarXLSX(306);
        fs_1.default.writeFileSync('temp/teste_cotacao_306.xlsx', xlsxBuffer);
        console.log('💾 [TESTE] XLSX salvo em temp/teste_cotacao_306.xlsx');
    }
    catch (error) {
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
//# sourceMappingURL=test-export-content.js.map