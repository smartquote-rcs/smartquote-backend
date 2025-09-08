"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
// Função de teste simples
async function testarEndpointCSV() {
    try {
        const response = await fetch('http://localhost:2000/api/relatorios/gerar-csv/306', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Remover autenticação temporariamente para teste
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [TESTE] Erro na resposta:', response.status, errorText);
            return;
        }
        const csvContent = await response.text();
        console.log('✅ [TESTE] CSV gerado com sucesso!');
        console.log('📄 [TESTE] Primeiras linhas do CSV:');
        console.log(csvContent.substring(0, 500) + '...');
        // Salvar arquivo para verificação
        fs_1.default.writeFileSync('teste-relatorio-306.csv', csvContent, 'utf8');
        console.log('💾 [TESTE] Arquivo salvo como teste-relatorio-306.csv');
    }
    catch (error) {
        console.error('❌ [TESTE] Erro durante teste:', error);
    }
}
testarEndpointCSV();
//# sourceMappingURL=test-endpoint-csv.js.map