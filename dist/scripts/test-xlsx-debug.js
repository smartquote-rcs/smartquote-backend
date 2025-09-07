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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const XLSX = __importStar(require("xlsx"));
const ExportService_1 = require("../src/services/relatorio/ExportService");
// Carregar variáveis de ambiente
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
async function testarXLSXDetalhado() {
    console.log('🧪 [TESTE] Verificando XLSX detalhadamente...');
    try {
        const exportService = new ExportService_1.ExportService();
        // Gerar XLSX
        const xlsxBuffer = await exportService.gerarXLSX(306);
        // Salvar arquivo temporário
        const tempPath = 'temp/debug_cotacao_306.xlsx';
        fs_1.default.writeFileSync(tempPath, xlsxBuffer);
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
        }
        else {
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
    }
    catch (error) {
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
//# sourceMappingURL=test-xlsx-debug.js.map