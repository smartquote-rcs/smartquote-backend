"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = __importDefault(require("../infra/supabase/connect"));
const CotacoesItensService_1 = __importDefault(require("./CotacoesItensService"));
const PonderacaoWebService_1 = __importDefault(require("./PonderacaoWebService"));
class WebBuscaJobService {
    apiBaseUrl;
    constructor() {
        // Fallback padrão para o servidor Node desta própria API
        this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:2000';
    }
    sleep(ms) {
        return new Promise(res => setTimeout(res, ms));
    }
    async createJobsForFaltantes(faltantes, solicitacaoFallback, ponderacaoWeb_LLM) {
        const statusUrls = [];
        // Aplicar ponderação LLM se solicitado
        let faltantesProcessados = faltantes;
        if (ponderacaoWeb_LLM) {
            faltantesProcessados = await PonderacaoWebService_1.default.ponderarWebLLM(faltantes);
            console.log(`🧠 [PONDERACAO-WEB] Ponderação aplicada a ${faltantesProcessados.length} faltantes`);
        }
        await Promise.all((faltantesProcessados || []).map(async (f) => {
            const termo = f.query_sugerida || solicitacaoFallback;
            try {
                console.log(`🌐 [WEB-BUSCA] Criando job para: "${termo}" (ID: ${f.id})`);
                console.log(`🔗 [WEB-BUSCA] URL base: ${this.apiBaseUrl}`);
                // Montagem do payload respeitando o BuscaSchema (zod)
                const payload = {
                    produto: termo,
                    quantidade: Number.isFinite(Number(f.quantidade)) && Number(f.quantidade) > 0
                        ? Math.floor(Number(f.quantidade))
                        : 1,
                    salvamento: true,
                    refinamento: true,
                };
                if (typeof f.custo_beneficio !== 'undefined') {
                    payload.custo_beneficio = f.custo_beneficio;
                }
                if (typeof f.rigor === 'number' && isFinite(f.rigor)) {
                    const r = Math.round(f.rigor);
                    payload.rigor = Math.max(0, Math.min(5, r));
                }
                if (typeof f.ponderacao_busca_externa === 'number' && isFinite(f.ponderacao_busca_externa)) {
                    payload.ponderacao_web_llm = Math.max(0, Math.min(1, f.ponderacao_busca_externa));
                }
                // Preferir o item_id (id do item em cotacoes_itens); fallback para id legado
                const faltId = (typeof f.item_id !== 'undefined' && f.item_id !== null)
                    ? f.item_id
                    : f.id;
                if (typeof faltId !== 'undefined' && faltId !== null) {
                    payload.faltante_id = String(faltId);
                }
                const resp = await fetch(`${this.apiBaseUrl}/api/busca-automatica/background`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!resp.ok) {
                    let errorBody = '';
                    try {
                        errorBody = await resp.text();
                    }
                    catch { }
                    throw new Error(`HTTP ${resp.status}: ${resp.statusText}${errorBody ? ` - ${errorBody}` : ''}`);
                }
                const data = (await resp.json());
                console.log(`✅ [WEB-BUSCA] Job criado para "${termo}":`, data);
                if (data?.statusUrl) {
                    statusUrls.push(`${this.apiBaseUrl}${data.statusUrl}`);
                }
                else if (data?.jobId) {
                    statusUrls.push(`${this.apiBaseUrl}/api/busca-automatica/job/${data.jobId}`);
                }
                else {
                    console.warn(`⚠️ [WEB-BUSCA] Job criado mas sem statusUrl/jobId para "${termo}":`, data);
                }
            }
            catch (e) {
                console.error(`❌ [WEB-BUSCA] Erro ao criar job para "${termo}":`, e?.message || e);
            }
        }));
        return statusUrls;
    }
    async waitJobs(statusUrls, maxWaitMs = 30 * 60 * 1000, pollIntervalMs = 2000) {
        const aguardarJob = async (url) => {
            const inicio = Date.now();
            while (Date.now() - inicio < maxWaitMs) {
                try {
                    const r = await fetch(url, { method: 'GET' });
                    const j = (await r.json());
                    const job = j?.job;
                    const status = job?.status;
                    if (status === 'concluido') {
                        if (job?.resultado) {
                            job.resultado.quantidade = job.parametros?.quantidade;
                        }
                        return job?.resultado || { produtos: [] };
                    }
                    if (status === 'erro') {
                        console.warn(`⚠️ [WEB-BUSCA] Job falhou (${url}):`, job?.erro);
                        return { produtos: [] };
                    }
                }
                catch (e) {
                    console.error('❌ [WEB-BUSCA] Erro ao consultar job:', url, e?.message || e);
                }
                await this.sleep(pollIntervalMs);
            }
            console.warn(`⏱️ [WEB-BUSCA] Timeout aguardando job: ${url}`);
            return { produtos: [] };
        };
        const resultadosPorJob = await Promise.all(statusUrls.map(aguardarJob));
        const produtosWeb = resultadosPorJob.flatMap((r) => r?.produtos || []);
        const resultadosCompletos = resultadosPorJob.filter((r) => r && typeof r === 'object' && 'produtos' in r);
        return { resultadosCompletos, produtosWeb };
    }
    async insertJobResultsInCotacao(cotacaoId, resultadosCompletos) {
        let inseridos = 0;
        // Carregar placeholders atuais (status=false) em cotacoes_itens
        let placeholdersRestantes = [];
        try {
            const { data: placeholders, error } = await connect_1.default
                .from('cotacoes_itens')
                .select('id, item_nome, pedido, quantidade')
                .eq('cotacao_id', Number(cotacaoId))
                .eq('status', false);
            if (!error)
                placeholdersRestantes = placeholders || [];
        }
        catch (e) {
            console.warn('⚠️ [PLACEHOLDER] Falha ao carregar placeholders:', e?.message || e);
        }
        for (const resultadoJob of resultadosCompletos) {
            try {
                // Para cada produto retornado, tentar cumprir um placeholder correspondente (status=true + update)
                if (resultadoJob.produtos && resultadoJob.produtos.length > 0) {
                    for (const produto of resultadoJob.produtos) {
                        try {
                            const nome = (produto.name || produto.nome || '').toString();
                            const baseQuery = (produto.base_query || produto.query || '').toString();
                            const faltanteIdFromProduto = produto?.faltante_id ? Number(produto.faltante_id) : null;
                            // Recarregar placeholders pendentes
                            const { data: phs } = await connect_1.default
                                .from('cotacoes_itens')
                                .select('id, item_nome, pedido, quantidade')
                                .eq('cotacao_id', Number(cotacaoId))
                                .eq('status', false);
                            placeholdersRestantes = Array.isArray(phs) ? phs : [];
                            // Preferir correspondência direta por ID do faltante (item_id)
                            let alvo = faltanteIdFromProduto
                                ? placeholdersRestantes.find((p) => Number(p.id) === Number(faltanteIdFromProduto))
                                : undefined;
                            const quantidade = resultadoJob?.quantidade || alvo?.quantidade || 1;
                            const produtoIdSalvo = produto.id;
                            if (alvo) {
                                // Cumprir placeholder: atualizar registro com dados do produto web
                                await CotacoesItensService_1.default.fulfillPlaceholderWithWebProduct(Number(cotacaoId), alvo.id, produto, quantidade, produtoIdSalvo, resultadoJob.relatorio);
                                inseridos++;
                                if (resultadoJob.relatorio) {
                                    resultadoJob.relatorio.id_item_cotacao = alvo.id;
                                }
                                console.log(`✅ [PLACEHOLDER] Cumprido placeholder ${alvo.id} com produto: ${nome}`);
                            }
                        }
                        catch (e) {
                            console.warn('⚠️ [PLACEHOLDER] Falha ao cumprir placeholder/inserir item:', e?.message || e);
                        }
                    }
                }
                else if (resultadoJob?.relatorio) {
                    // Sem produtos, mas com relatório: anexar análise ao placeholder correspondente
                    try {
                        // Recarregar placeholders pendentes
                        const { data: phs } = await connect_1.default
                            .from('cotacoes_itens')
                            .select('id, item_nome, pedido, quantidade')
                            .eq('cotacao_id', Number(cotacaoId))
                            .eq('status', false);
                        placeholdersRestantes = Array.isArray(phs) ? phs : [];
                        const rel = resultadoJob.relatorio;
                        const faltanteIdFromRel = typeof rel?.faltante_id === 'number' ? Number(rel.faltante_id) : null;
                        const relQueryNome = (rel?.query?.nome || rel?.query || '').toString();
                        // Preferir correspondência por ID do faltante; fallback por pedido aproximado
                        let alvo = faltanteIdFromRel
                            ? placeholdersRestantes.find((p) => Number(p.id) === Number(faltanteIdFromRel))
                            : undefined;
                        if (!alvo && relQueryNome) {
                            alvo = placeholdersRestantes.find((p) => p.pedido && p.pedido.toLowerCase().includes(relQueryNome.toLowerCase()));
                        }
                        if (alvo) {
                            await CotacoesItensService_1.default.fulfillPlaceholderWithWebProduct(Number(cotacaoId), alvo.id, null, // sem produto, apenas anexar análise
                            0, undefined, rel);
                            console.log(`📝 [ANALISE] Análise web anexada ao placeholder ${alvo.id} (sem produto)`);
                        }
                        else {
                            console.log('ℹ️ [ANALISE] Não foi possível localizar placeholder para anexar análise web (sem produto)');
                        }
                    }
                    catch (e) {
                        console.warn('⚠️ [ANALISE] Falha ao anexar análise web sem produto:', e?.message || e);
                    }
                }
            }
            catch (e) {
                console.error('❌ [COTACAO-ITEM] Erro ao inserir itens do job:', e?.message || e);
            }
        }
        // Atualizar status da cotação com base em placeholders restantes
        try {
            const { data: phsFinais } = await connect_1.default
                .from('cotacoes_itens')
                .select('id')
                .eq('cotacao_id', Number(cotacaoId))
                .eq('status', false);
            const restantes = (phsFinais || []).length;
            const novoStatus = restantes === 0 ? 'completa' : 'incompleta';
            const { error: updateError } = await connect_1.default
                .from('cotacoes')
                .update({ status: novoStatus })
                .eq('id', Number(cotacaoId));
            if (updateError) {
                console.error('❌ [COTACAO] Erro ao atualizar status:', updateError);
            }
            else if (novoStatus === 'completa') {
                console.log(`🎉 [COTACAO] Cotação ${cotacaoId} marcada como completa`);
                console.log(`💰 [COTACAO] Recalculando orçamento final da cotação ${cotacaoId}`);
                await this.recalcOrcamento(Number(cotacaoId));
            }
        }
        catch (e) {
            console.warn('⚠️ [COTACAO] Falha ao atualizar status com base em placeholders:', e?.message || e);
        }
        return inseridos;
    }
    async recalcOrcamento(cotacaoId) {
        try {
            const { data: itens, error } = await connect_1.default
                .from('cotacoes_itens')
                .select('item_preco, quantidade')
                .eq('cotacao_id', Number(cotacaoId));
            if (!error && Array.isArray(itens)) {
                let total = 0;
                for (const it of itens) {
                    const preco = parseFloat(String(it.item_preco ?? 0));
                    const qtd = parseInt(String(it.quantidade ?? 1));
                    if (!isNaN(preco) && !isNaN(qtd))
                        total += preco * qtd;
                }
                await connect_1.default.from('cotacoes').update({ orcamento_geral: total }).eq('id', Number(cotacaoId));
                return total;
            }
        }
        catch (e) {
            console.error('❌ [COTACAO] Erro ao recalcular orçamento:', e?.message || e);
        }
        return 0;
    }
}
exports.default = WebBuscaJobService;
//# sourceMappingURL=WebBuscaJobService.js.map