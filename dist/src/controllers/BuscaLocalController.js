"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuscaLocalController = void 0;
const PythonInterpretationProcessor_1 = require("../services/PythonInterpretationProcessor");
const BuscaAtomatica_1 = require("../services/BuscaAtomatica");
const FornecedorService_1 = __importDefault(require("../services/FornecedorService"));
const CotacoesItensService_1 = __importDefault(require("../services/CotacoesItensService"));
const connect_1 = __importDefault(require("../infra/supabase/connect"));
const PromptsService_1 = __importDefault(require("../services/PromptsService"));
const CotacoesService_1 = __importDefault(require("../services/CotacoesService"));
class BuscaLocalController {
    buildArgs(opts) {
        const args = [];
        if (opts.limite && Number.isFinite(opts.limite)) {
            args.push('--limite', String(opts.limite));
        }
        if (opts.multilingue === false) {
            args.push('--no-multilingue');
        }
        if (opts.criarCotacao) {
            args.push('--criar-cotacao');
        }
        return args;
    }
    async search(req, res) {
        try {
            const solicitacao = (req.body?.solicitacao || '').toString().trim();
            const limite = Number(req.body?.limite) || undefined;
            const multilingue = req.body?.multilingue !== undefined ? Boolean(req.body.multilingue) : true;
            const criarCotacao = req.body?.criarCotacao ? Boolean(req.body.criarCotacao) : false;
            if (!solicitacao) {
                return res.status(400).json({ success: false, message: 'Campo "solicitacao" é obrigatório' });
            }
            // Executar busca local via worker persistente
            const result = await PythonInterpretationProcessor_1.pythonProcessor.processInterpretation({
                id: `manual_${Date.now()}`,
                emailId: 'manual',
                tipo: 'pedido',
                prioridade: 'media',
                solicitacao,
                cliente: {},
                confianca: 100,
                interpretedAt: new Date().toISOString(),
            });
            if (!result.success || !result.result) {
                return res.status(500).json({ success: false, message: 'Falha na busca local', error: result.error });
            }
            const payload = result.result || {};
            const faltantes = Array.isArray(payload.faltantes) ? payload.faltantes : [];
            const resumoLocal = payload?.resultado_resumo || {};
            const cotacoesInfo = payload.cotacoes || null;
            let produtosWeb = [];
            if (faltantes.length > 0) {
                const fornecedores = await FornecedorService_1.default.getFornecedoresAtivos();
                const sites = fornecedores.map(f => f.url).filter(Boolean);
                const cfg = await FornecedorService_1.default.getConfiguracoesSistema();
                const numPorSite = cfg?.numResultadosPorSite ?? 5;
                const busca = new BuscaAtomatica_1.BuscaAutomatica();
                // para cada faltante, buscar em todos os sites
                const promessas = faltantes.map((f) => busca.buscarProdutosMultiplosSites(f.query_sugerida || solicitacao, sites, numPorSite));
                const resultados = await Promise.all(promessas);
                resultados.forEach(arr => {
                    produtosWeb.push(...(new BuscaAtomatica_1.BuscaAutomatica()).combinarResultados(arr));
                });
            }
            // Garantir uma cotação principal: usar a que o Python criou, ou criar agora
            let itensInseridos = 0;
            let cotacaoPrincipalId = cotacoesInfo?.principal_id ?? null;
            // Novo critério: se houver resultados locais (mesmo sem faltantes/produtosWeb), também criaremos cotação
            const temResultadosLocais = Object.values(resumoLocal).some((arr) => Array.isArray(arr) && arr.length > 0);
            if (!cotacaoPrincipalId && (produtosWeb.length > 0 || faltantes.length > 0 || temResultadosLocais)) {
                // Criar prompt e cotação principal - usar dados do Python se disponível
                const dadosExtraidos = payload?.dados_extraidos || {
                    solucao_principal: solicitacao,
                    tipo_de_solucao: 'sistema',
                    tags_semanticas: [],
                    itens_a_comprar: faltantes.map((f) => ({
                        nome: f.nome || 'Item não especificado',
                        natureza_componente: 'software',
                        prioridade: 'media',
                        categoria: f.categoria || 'Geral',
                        quantidade: f.quantidade || 1
                    }))
                };
                const promptId = await PromptsService_1.default.create({
                    texto_original: solicitacao,
                    dados_extraidos: dadosExtraidos,
                    origem: { tipo: 'servico', fonte: 'api' },
                    status: 'analizado'
                });
                if (promptId) {
                    const nova = {
                        prompt_id: promptId,
                        status: 'incompleta',
                        aprovacao: false,
                        faltantes: faltantes?.length ? faltantes : [],
                        orcamento_geral: 0
                    };
                    try {
                        const criada = await CotacoesService_1.default.create(nova);
                        cotacaoPrincipalId = criada?.id ?? null;
                    }
                    catch (e) {
                        console.error('Erro ao criar cotação principal:', e);
                    }
                }
            }
            // Inserir itens web, se houver
            if (cotacaoPrincipalId && produtosWeb.length > 0) {
                for (const p of produtosWeb) {
                    try {
                        const idItem = await CotacoesItensService_1.default.insertWebItem(Number(cotacaoPrincipalId), p);
                        if (idItem)
                            itensInseridos++;
                    }
                    catch (e) {
                        console.error('Erro ao inserir item web na cotação:', e);
                    }
                }
                // Recalcular orçamento geral na tabela de cotações
                await this.recalcularOrcamento(Number(cotacaoPrincipalId));
            }
            // Inserir pelo menos 1 item local por query (top-1), quando não houver itens web e houver resultados locais
            // Evitar duplicação: só inserir locais pelo Node se o Python NÃO tiver criado cotação
            if (!cotacaoPrincipalId && temResultadosLocais) {
                for (const [qid, arr] of Object.entries(resumoLocal)) {
                    const lista = Array.isArray(arr) ? arr : [];
                    if (!lista.length)
                        continue;
                    const top = lista[0];
                    // payload do Python inclui produto_id para locais
                    const produtoIdLocal = top?.produto_id;
                    if (!produtoIdLocal)
                        continue;
                    try {
                        // inserir item local com snapshot básico
                        await connect_1.default
                            .from('cotacoes_itens')
                            .insert({
                            cotacao_id: Number(cotacaoPrincipalId),
                            origem: 'local',
                            produto_id: produtoIdLocal,
                            item_nome: top?.nome || null,
                            item_descricao: top?.categoria || null,
                            item_preco: top?.preco ?? null,
                            item_moeda: 'AOA',
                            quantidade: 1,
                            payload: { query_id: qid, score: top?.score }
                        });
                        itensInseridos++;
                    }
                    catch (e) {
                        console.error('Erro ao inserir item local na cotação:', e);
                    }
                }
                await this.recalcularOrcamento(Number(cotacaoPrincipalId));
            }
            return res.status(200).json({
                success: true,
                message: 'Busca híbrida concluída',
                dados_python: payload,
                resultados_web: produtosWeb,
                itens_web_inseridos: itensInseridos,
                cotacao_principal_id: cotacaoPrincipalId,
            });
        }
        catch (error) {
            console.error('Erro no fluxo de busca híbrida:', error);
            return res.status(500).json({ success: false, message: 'Erro interno', error: error?.message || String(error) });
        }
    }
    async recalcularOrcamento(cotacaoId) {
        try {
            const { data: itens, error } = await connect_1.default
                .from('cotacoes_itens')
                .select('item_preco, quantidade')
                .eq('cotacao_id', cotacaoId);
            if (!error && Array.isArray(itens)) {
                let total = 0;
                for (const it of itens) {
                    const preco = parseFloat(String(it.item_preco ?? 0));
                    const qtd = parseInt(String(it.quantidade ?? 1));
                    if (!isNaN(preco) && !isNaN(qtd))
                        total += preco * qtd;
                }
                await connect_1.default.from('cotacoes').update({ orcamento_geral: total }).eq('id', cotacaoId);
            }
        }
        catch (e) {
            console.error('Erro ao recalcular orçamento:', e);
        }
    }
}
exports.BuscaLocalController = BuscaLocalController;
exports.default = new BuscaLocalController();
//# sourceMappingURL=BuscaLocalController.js.map