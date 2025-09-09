"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CotacoesItensService_1 = __importDefault(require("../services/CotacoesItensService"));
const WebBuscaJobService_1 = __importDefault(require("../services/WebBuscaJobService"));
const connect_1 = __importDefault(require("../infra/supabase/connect"));
class CotacoesItensController {
    async list(req, res) {
        try {
            const cotacao_id = req.query.cotacao_id ? Number(req.query.cotacao_id) : undefined;
            const itens = await CotacoesItensService_1.default.list(cotacao_id);
            res.json(itens);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao buscar itens de cotação', details: error });
        }
    }
    async get(req, res) {
        try {
            const { id } = req.params;
            const item = await CotacoesItensService_1.default.getById(Number(id));
            if (!item)
                return res.status(404).json({ error: 'Item não encontrado' });
            res.json(item);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao buscar item', details: error });
        }
    }
    async getSugeridosWeb(req, res) {
        try {
            const { id } = req.params;
            const sugeridos = await CotacoesItensService_1.default.getSugeridosWeb(Number(id));
            res.json(sugeridos);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao buscar sugestões web', details: error });
        }
    }
    async getSugeridosLocal(req, res) {
        try {
            const { id } = req.params;
            const sugeridos = await CotacoesItensService_1.default.getSugeridosLocal(Number(id));
            res.json(sugeridos);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao buscar sugestões locais', details: error });
        }
    }
    async replaceProduct(req, res) {
        try {
            const { cotacaoItemId, newProductId, url, nomeProduto } = req.body;
            if (!cotacaoItemId) {
                return res.status(400).json({
                    error: 'cotacaoItemId é obrigatório'
                });
            }
            // 1. Verificar se o item existe
            const existingItem = await CotacoesItensService_1.default.getById(cotacaoItemId);
            if (!existingItem) {
                return res.status(404).json({ error: 'Item de cotação não encontrado' });
            }
            // 2. Buscar dados do novo produto
            let newProduct = null;
            let productError = null;
            if (url && typeof url === 'string' && url.length > 0 && nomeProduto && typeof nomeProduto === 'string' && nomeProduto.length > 0) {
                // Requisição para busca automática
                const axios = require('axios');
                try {
                    const buscaBody = {
                        produto: nomeProduto,
                        urls_add: [
                            {
                                url: url,
                                escala_mercado: 'Internacional'
                            }
                        ],
                        refinamento: false,
                        salvamento: true,
                        quantidade_resultados: 1
                    };
                    let API_BASE_URL;
                    if (process.env.NODE_ENV === 'production') {
                        const port = process.env.PORT || process.env.PORT_DEFAULT || 2000;
                        API_BASE_URL = `http://localhost:${port}`;
                    }
                    else {
                        API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:2000';
                    }
                    const buscaResponse = await axios.post(`${API_BASE_URL}/api/busca-automatica/background`, buscaBody);
                    console.log('Resposta busca-automatica:', buscaResponse.data);
                    // Monitorar o job até completar (como no search)
                    if (buscaResponse.data?.statusUrl) {
                        const statusUrl = `${API_BASE_URL}${buscaResponse.data.statusUrl}`;
                        console.log(`🔄 [REPLACE-PRODUCT] Monitorando job: ${statusUrl}`);
                        const svc = new WebBuscaJobService_1.default();
                        const { resultadosCompletos } = await svc.waitJobs([statusUrl]);
                        console.log(`✅ [REPLACE-PRODUCT] Job completado. Resultados:`, resultadosCompletos[0].salvamento.detalhes[0]);
                        // Extrair ID do produto salvo dos resultados
                        let produtoSalvoId = null;
                        for (const resultado of resultadosCompletos) {
                            // Acessar salvamento diretamente do resultado (não resultado.resultado)
                            const salvamento = resultado?.salvamento;
                            if (salvamento?.detalhes) {
                                for (const fornecedorDetalhe of salvamento.detalhes) {
                                    if (fornecedorDetalhe.detalhes && fornecedorDetalhe.detalhes.length > 0) {
                                        const produtoSalvo = fornecedorDetalhe.detalhes[0];
                                        if (produtoSalvo.id) {
                                            produtoSalvoId = produtoSalvo.id;
                                            console.log(`✅ [REPLACE-PRODUCT] Produto salvo com ID: ${produtoSalvoId}`);
                                            break;
                                        }
                                    }
                                }
                                if (produtoSalvoId)
                                    break;
                            }
                        }
                        if (produtoSalvoId) {
                            // Buscar o produto salvo no banco de dados
                            const { data: produto, error: erro } = await connect_1.default
                                .from('produtos')
                                .select('*')
                                .eq('id', produtoSalvoId)
                                .single();
                            newProduct = produto;
                            productError = erro;
                            if (produto) {
                                console.log(`✅ [REPLACE-PRODUCT] Produto carregado do banco: ${produto.nome}`);
                            }
                        }
                        else {
                            productError = { message: 'Nenhum produto foi salvo na busca automática' };
                            console.log(`❌ [REPLACE-PRODUCT] Nenhum produto salvo para: ${nomeProduto}`);
                        }
                    }
                    else {
                        productError = { message: 'Job de busca não foi criado corretamente' };
                    }
                }
                catch (buscaError) {
                    console.error('Erro na busca-automatica:', buscaError);
                    productError = buscaError;
                }
            }
            else {
                const { data: produto, error: erro } = await connect_1.default
                    .from('produtos')
                    .select('*')
                    .eq('id', newProductId)
                    .single();
                newProduct = produto;
                productError = erro;
            }
            if (productError || !newProduct) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }
            // 3. Atualizar o item da cotação com os dados do novo produto
            const { data: updatedItem, error: updateError } = await connect_1.default
                .from('cotacoes_itens')
                .update({
                produto_id: newProduct.id,
                item_nome: newProduct.nome,
                item_descricao: newProduct.descricao || newProduct.nome,
                item_preco: newProduct.preco,
                external_url: newProduct.url || null,
                provider: newProduct.origem || null
            })
                .eq('id', cotacaoItemId)
                .select()
                .single();
            if (updateError) {
                throw new Error(`Erro ao atualizar item: ${updateError.message}`);
            }
            // 4. Atualizar análises no próprio item (analise_local e analise_web)
            let analiseUpdated = false;
            const analiseUpdates = {};
            // Atualizar análise local no item, se existir
            if (existingItem.analise_local) {
                const currentLocal = existingItem.analise_local;
                const updatedAnaliseLocal = Array.isArray(currentLocal) ? [...currentLocal] : [currentLocal];
                const localIndex = updatedAnaliseLocal.findIndex((item) => item?.llm_relatorio?.escolha_principal === existingItem.item_nome);
                if (localIndex >= 0) {
                    const llm = updatedAnaliseLocal[localIndex].llm_relatorio || {};
                    const currentRanking = Array.isArray(llm.top_ranking) ? llm.top_ranking.slice() : [];
                    // Remover duplicados (por id ou nome) referentes ao novo produto
                    const cleanedRanking = currentRanking.filter((rank) => {
                        const sameId = typeof rank?.id !== 'undefined' && typeof newProduct?.id !== 'undefined' && rank.id === newProduct.id;
                        const sameNome = String(rank?.nome || '').trim().toLowerCase() === String(newProduct?.nome || '').trim().toLowerCase();
                        return !(sameId || sameNome);
                    });
                    // Montar novo primeiro lugar com o produto escolhido e empurrar o antigo primeiro para segundo
                    const novoPrimeiro = {
                        ...(cleanedRanking[0] || {}),
                        nome: newProduct.nome,
                        id: newProduct.id ?? (cleanedRanking[0]?.id),
                        preco: newProduct.preco ?? (cleanedRanking[0]?.preco),
                        justificativa: 'Produto selecionado manualmente pelo usuário',
                        pontos_fortes: ['Escolha do usuário', 'Seleção manual'],
                        pontos_fracos: cleanedRanking[0]?.pontos_fracos || [],
                        score_estimado: 10,
                    };
                    const novoRanking = [novoPrimeiro, ...cleanedRanking];
                    updatedAnaliseLocal[localIndex] = {
                        ...updatedAnaliseLocal[localIndex],
                        llm_relatorio: {
                            ...llm,
                            escolha_principal: newProduct.nome,
                            justificativa_escolha: 'Seleção natural - produto substituído por escolha do usuário',
                            top_ranking: novoRanking,
                        },
                    };
                    analiseUpdates.analise_local = Array.isArray(currentLocal) ? updatedAnaliseLocal : updatedAnaliseLocal[0];
                    analiseUpdated = true;
                }
            }
            // Atualizar análise web no item (analise_web)
            if (existingItem.analise_web) {
                const currentWeb = existingItem.analise_web;
                const updatedAnaliseWeb = Array.isArray(currentWeb) ? [...currentWeb] : [currentWeb];
                const webUpdated = updatedAnaliseWeb.map((aw) => {
                    if (aw?.escolha_principal === existingItem.item_nome) {
                        const rankingAtual = Array.isArray(aw.top_ranking) ? aw.top_ranking.slice() : [];
                        // Remover duplicados com mesma URL ou mesmo nome do novo produto
                        const cleaned = rankingAtual.filter((rank) => {
                            const sameUrl = (newProduct?.url && rank?.url) ? String(rank.url).trim() === String(newProduct.url).trim() : false;
                            const sameNome = String(rank?.nome || '').trim().toLowerCase() === String(newProduct?.nome || '').trim().toLowerCase();
                            return !(sameUrl || sameNome);
                        });
                        const novoPrimeiro = {
                            ...(cleaned[0] || {}),
                            nome: newProduct.nome,
                            preco: newProduct.preco ?? (cleaned[0]?.preco),
                            url: newProduct.url ?? (cleaned[0]?.url),
                            justificativa: 'Produto selecionado manualmente pelo usuário',
                            pontos_fortes: ['Escolha do usuário', 'Seleção manual'],
                            pontos_fracos: cleaned[0]?.pontos_fracos || [],
                            score_estimado: 10,
                        };
                        const novoRanking = [novoPrimeiro, ...cleaned];
                        return {
                            ...aw,
                            escolha_principal: newProduct.nome,
                            justificativa_escolha: 'Seleção natural - produto substituído por escolha do usuário',
                            top_ranking: novoRanking,
                        };
                    }
                    return aw;
                });
                analiseUpdates.analise_web = Array.isArray(currentWeb) ? webUpdated : webUpdated[0];
                analiseUpdated = true;
            }
            if (analiseUpdated) {
                await connect_1.default
                    .from('cotacoes_itens')
                    .update(analiseUpdates)
                    .eq('id', cotacaoItemId);
            }
            res.json({
                success: true,
                message: 'Produto substituído com sucesso',
                updatedItem,
                analiseUpdated
            });
        }
        catch (error) {
            console.error('Erro ao substituir produto:', error);
            res.status(500).json({
                error: 'Erro ao substituir produto',
                details: error instanceof Error ? error.message : error
            });
        }
    }
    async add(req, res) {
        try {
            const { cotacao_id, produto_id, quantidade } = req.body;
            if (!cotacao_id || !produto_id || !quantidade) {
                return res.status(400).json({ error: 'cotacao_id, produto_id e quantidade são obrigatórios' });
            }
            // 2. Buscar dados do novo produto
            const { data: newProduct, error: productError } = await connect_1.default
                .from('produtos')
                .select('*')
                .eq('id', produto_id)
                .single();
            if (productError || !newProduct) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }
            // 3. criar o item da cotação com os dados do novo produto
            const { data: newItem, error: insertError } = await connect_1.default
                .from('cotacoes_itens')
                .insert({
                cotacao_id,
                produto_id,
                item_nome: newProduct.nome,
                item_descricao: newProduct.descricao || newProduct.nome,
                item_preco: newProduct.preco,
                quantidade,
                external_url: newProduct.url || null,
                provider: newProduct.origem || null
            })
                .select()
                .single();
            if (insertError || !newItem) {
                return res.status(500).json({ error: 'Erro ao criar item da cotação', details: insertError?.message });
            }
            res.status(201).json({ success: true, item: newItem });
        }
        catch (error) {
            console.error('Erro ao adicionar item:', error);
            res.status(500).json({
                error: 'Erro ao adicionar item',
                details: error instanceof Error ? error.message : error
            });
        }
    }
    parsePrice(priceStr) {
        if (!priceStr)
            return null;
        try {
            // Remove tudo que não seja dígito, ponto ou vírgula
            let cleanPrice = priceStr.replace(/[^\d.,]/g, '');
            // Normalizar separadores decimais
            // Se tem vírgula, assumir que é separador decimal
            if (cleanPrice.includes(',')) {
                // Se tem ponto E vírgula, ponto é separador de milhar
                if (cleanPrice.includes('.')) {
                    cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.');
                }
                else {
                    // Só vírgula, converter para ponto decimal
                    cleanPrice = cleanPrice.replace(',', '.');
                }
            }
            // Se só tem pontos, verificar se é separador de milhar ou decimal
            else if (cleanPrice.includes('.')) {
                const partes = cleanPrice.split('.');
                if (partes.length > 2 || (partes.length === 2 && partes[1] && partes[1].length === 3)) {
                    // Múltiplos pontos ou último tem 3 dígitos = separador de milhar
                    cleanPrice = cleanPrice.replace(/\./g, '');
                }
                // Senão, assumir que é separador decimal
            }
            const price = parseFloat(cleanPrice);
            return isNaN(price) ? null : price;
        }
        catch {
            return null;
        }
    }
    extractProviderFromUrl(url) {
        if (!url)
            return null;
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        }
        catch {
            return null;
        }
    }
}
exports.default = new CotacoesItensController();
//# sourceMappingURL=CotacoesItensController.js.map