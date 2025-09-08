"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testarExportService = testarExportService;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ExportService_1 = require("../src/services/relatorio/ExportService");
// Carregar variáveis de ambiente
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
async function testarExportService() {
    console.log('🧪 [TESTE] Iniciando teste do ExportService...');
    const exportService = new ExportService_1.ExportService();
    try {
        // Testar geração de CSV com cotação 306
        console.log('📄 [TESTE] Testando geração de CSV para cotação 306...');
        const csv = await exportService.gerarCSV(306);
        console.log('✅ [TESTE] CSV gerado com sucesso!');
        console.log('📊 [TESTE] Tamanho do CSV:', csv.length, 'caracteres');
        // Mostrar primeiras linhas
        const csvText = csv.toString();
        const lines = csvText.split('\n').slice(0, 5);
        console.log('📄 [TESTE] Primeiras linhas do CSV:');
        lines.forEach((line, i) => console.log(`${i + 1}: ${line}`));
        // Testar geração de XLSX
        console.log('\n📊 [TESTE] Testando geração de XLSX para cotação 306...');
        const xlsx = await exportService.gerarXLSX(306);
        console.log('✅ [TESTE] XLSX gerado com sucesso!');
        console.log('📊 [TESTE] Tamanho do XLSX:', xlsx.length, 'bytes');
    }
    catch (error) {
        console.error('❌ [TESTE] Erro durante teste:', error);
        if (error instanceof Error) {
            console.error('❌ [TESTE] Stack trace:', error.stack);
        }
        process.exit(1);
    }
    console.log('🎉 [TESTE] Todos os testes passaram!');
}
// Executar apenas se chamado diretamente
if (require.main === module) {
    testarExportService();
}
//# sourceMappingURL=test-export-service.js.map