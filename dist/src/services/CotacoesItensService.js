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
    async buildPrompt(cotacaoId, produto) {
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
    /**
     * Insere item na cotação usando ID do produto já salvo na base de dados
     */
    async insertWebItemById(cotacaoId, produtoId, produto, quantidade) {
        const item_preco = this.parseNumero(produto.price);
        const provider = this.providerFromUrl(produto.product_url);
        const payload = {
            cotacao_id: cotacaoId,
            produto_id: produtoId, // ID do produto na tabela produtos
            origem: 'web',
            provider: provider || undefined,
            external_url: produto.product_url,
            item_nome: produto.name,
            item_descricao: produto.description,
            item_preco: item_preco ?? undefined,
            item_moeda: 'AOA',
            quantidade: quantidade,
        };
        const { data, error } = await connect_1.default
            .from('cotacoes_itens')
            .insert(payload)
            .select('id')
            .single();
        if (error) {
            throw new Error(`Falha ao inserir item web com ID ${produtoId} na cotação ${cotacaoId}: ${error.message}`);
        }
        return data?.id ?? null;
    }
    /**
     * Insere item na cotação a partir do resultado de job que contém dados do produto e ID salvo
     */
    async insertJobResultItem(cotacaoId, jobResult) {
        // jobResult é o produto individual do array produtos do job
        const produto = jobResult;
        // Buscar o ID do produto salvo nos detalhes do salvamento do job
        // Como não temos acesso direto ao salvamento aqui, vamos usar o método original
        // O salvamento está disponível no resultado completo do job, não no produto individual
        return await this.insertWebItemById(cotacaoId, produto.id, produto, produto.quantidade);
    }
    /**
     * Insere itens de um job completo na cotação, aproveitando os IDs salvos
     */
    async insertJobResultItems(cotacaoId, jobResult) {
        const produtos = jobResult.produtos || [];
        const salvamento = jobResult.salvamento;
        const quantidade = jobResult.quantidade || 1;
        let inseridos = 0;
        // Criar um mapa de nome do produto para ID salvo
        const produtoIdMap = new Map();
        if (salvamento?.detalhes && Array.isArray(salvamento.detalhes)) {
            for (const detalhe of salvamento.detalhes) {
                if (detalhe.detalhes && Array.isArray(detalhe.detalhes)) {
                    for (const item of detalhe.detalhes) {
                        if (item.produto && item.id) {
                            produtoIdMap.set(item.produto, item.id);
                        }
                    }
                }
            }
        }
        // Inserir cada produto
        for (const produto of produtos) {
            try {
                const produtoId = produtoIdMap.get(produto.name);
                if (produtoId) {
                    // Usar o ID do produto salvo
                    const idItem = await this.insertWebItemById(cotacaoId, produtoId, produto, quantidade);
                    if (idItem)
                        inseridos++;
                }
            }
            catch (e) {
                console.error('❌ [COTACAO-ITEM] Erro ao inserir item do job:', e?.message || e);
            }
        }
        return inseridos;
    }
    /**
     * Lista itens de cotação, podendo filtrar por cotacao_id
     */
    async list(cotacao_id) {
        let query = connect_1.default.from('cotacoes_itens').select('*');
        if (cotacao_id) {
            query = query.eq('cotacao_id', cotacao_id);
        }
        console.log('[CotacoesItensService.list] Query:', query);
        const { data, error } = await query;
        console.log('[CotacoesItensService.list] Data:', data);
        console.log('[CotacoesItensService.list] Error:', error);
        if (error)
            throw new Error(error.message);
        return data;
    }
    /**
     * Busca item de cotação por id
     */
    async getById(id) {
        const { data, error } = await connect_1.default.from('cotacoes_itens').select('*').eq('id', id).single();
        if (error)
            throw new Error(error.message);
        return data;
    }
}
exports.default = new CotacoesItensService();
//# sourceMappingURL=CotacoesItensService.js.map