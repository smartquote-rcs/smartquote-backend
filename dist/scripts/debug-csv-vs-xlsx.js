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
async function compararCSVvsXLSX() {
    console.log('🧪 [TESTE] Comparando CSV vs XLSX...');
    try {
        const exportService = new ExportService_1.ExportService();
        // Gerar ambos os formatos
        console.log('\n📄 Gerando CSV...');
        const csv = await exportService.gerarCSV(306);
        console.log('\n📊 Gerando XLSX...');
        const xlsxBuffer = await exportService.gerarXLSX(306);
        // Salvar ambos
        fs_1.default.writeFileSync('temp/comparacao_306.csv', csv);
        fs_1.default.writeFileSync('temp/comparacao_306.xlsx', xlsxBuffer);
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
        }
        else {
            console.log('❌ [XLSX] Aba "Itens" não encontrada!');
        }
    }
    catch (error) {
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
//# sourceMappingURL=debug-csv-vs-xlsx.js.map