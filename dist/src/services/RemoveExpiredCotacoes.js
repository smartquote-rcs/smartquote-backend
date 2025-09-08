"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removerCotacoesExpiradasHoje = removerCotacoesExpiradasHoje;
const CotacoesService_1 = __importDefault(require("./CotacoesService"));
/**
 * Remove todas as cotações cujo prazo_validade é igual à data atual.
 * Deve ser chamado periodicamente ou no boot do servidor.
 */
async function removerCotacoesExpiradasHoje() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeISO = hoje.toISOString().slice(0, 10); // yyyy-mm-dd
    const cotacoes = await CotacoesService_1.default.getAll();
    for (const cotacao of cotacoes) {
        if (cotacao.prazo_validade && cotacao.prazo_validade.slice(0, 10) === hojeISO) {
            try {
                await CotacoesService_1.default.delete(cotacao.id);
                console.log(`Cotação ${cotacao.id} removida por expiração do prazo de validade (${cotacao.prazo_validade})`);
            }
            catch (err) {
                console.error(`Erro ao remover cotação ${cotacao.id}:`, err);
            }
        }
    }
}
//# sourceMappingURL=RemoveExpiredCotacoes.js.map