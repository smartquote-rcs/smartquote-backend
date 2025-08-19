"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = __importDefault(require("../infra/supabase/connect"));
class CotacoesItensService {
    parseNumero(precoStr) {
        if (!precoStr)
            return null;
        try {
            const numeroLimpo = precoStr.replace(/[^\d.,]/g, '');
            const normalizado = numeroLimpo.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
            const n = parseFloat(normalizado);
            return isNaN(n) ? null : n;
        }
        catch {
            return null;
        }
    }
    providerFromUrl(url) {
        if (!url)
            return null;
        try {
            const u = new URL(url);
            return u.hostname;
        }
        catch {
            return null;
        }
    }
    async insertWebItem(cotacaoId, produto) {
        const item_preco = this.parseNumero(produto.price);
        const provider = this.providerFromUrl(produto.product_url);
        const payload = {
            cotacao_id: cotacaoId,
            origem: 'web',
            provider: provider || undefined,
            external_url: produto.product_url,
            item_nome: produto.name,
            item_descricao: produto.description,
            item_preco: item_preco ?? undefined,
            item_moeda: 'AOA',
            quantidade: 1,
        };
        const { data, error } = await connect_1.default
            .from('cotacoes_itens')
            .insert(payload)
            .select('id')
            .single();
        if (error) {
            throw new Error(`Falha ao inserir item web na cotação ${cotacaoId}: ${error.message}`);
        }
        return data?.id ?? null;
    }
}
exports.default = new CotacoesItensService();
//# sourceMappingURL=CotacoesItensService.js.map