"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = __importDefault(require("../src/infra/supabase/connect"));
/**
 * Script para verificar preços de itens de cotação
 * Verifica se os itens têm preços salvos corretamente
 */
async function verificarPrecosItens() {
    console.log('🔍 Verificando preços de itens de cotação...\n');
    // Buscar últimas 3 cotações
    const { data: cotacoes, error: errorCotacoes } = await connect_1.default
        .from('cotacoes')
        .select('id, orcamento_geral')
        .order('id', { ascending: false })
        .limit(3);
    if (errorCotacoes || !cotacoes) {
        console.error('❌ Erro ao buscar cotações:', errorCotacoes);
        return;
    }
    console.log(`📋 Encontradas ${cotacoes.length} cotações recentes\n`);
    for (const cotacao of cotacoes) {
        console.log(`\n========================================`);
        console.log(`📦 COTAÇÃO #${cotacao.id}`);
        console.log(`💰 Orçamento Geral: R$ ${cotacao.orcamento_geral || 0}`);
        console.log(`========================================\n`);
        // Buscar itens da cotação
        const { data: itens, error: errorItens } = await connect_1.default
            .from('cotacoes_itens')
            .select('*')
            .eq('cotacao_id', cotacao.id);
        if (errorItens) {
            console.error('❌ Erro ao buscar itens:', errorItens);
            continue;
        }
        if (!itens || itens.length === 0) {
            console.log('⚠️  Nenhum item encontrado\n');
            continue;
        }
        console.log(`📦 Total de itens: ${itens.length}\n`);
        for (const item of itens) {
            console.log(`---`);
            console.log(`Item ID: ${item.id}`);
            console.log(`Nome: ${item.item_nome || '(sem nome)'}`);
            console.log(`Produto ID: ${item.produto_id || '(null)'}`);
            console.log(`Preço (item_preco): ${item.item_preco === null ? 'NULL ❌' : `R$ ${item.item_preco} ✅`}`);
            console.log(`Quantidade: ${item.quantidade || 1}`);
            console.log(`Status: ${item.status}`);
            // Se tem produto_id, buscar preço do produto
            if (item.produto_id) {
                const { data: produto } = await connect_1.default
                    .from('produtos')
                    .select('preco')
                    .eq('id', item.produto_id)
                    .single();
                if (produto) {
                    console.log(`Preço do produto (tabela produtos): ${produto.preco === null ? 'NULL ❌' : `R$ ${produto.preco} ✅`}`);
                }
            }
            console.log('');
        }
    }
    console.log('\n✅ Verificação concluída!');
}
verificarPrecosItens()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error('Erro:', error);
    process.exit(1);
});
//# sourceMappingURL=test-cotacao-itens-precos.js.map