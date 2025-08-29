"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuscaLocalController = void 0;
const PythonInterpretationProcessor_1 = require("../services/PythonInterpretationProcessor");
const WebBuscaJobService_1 = __importDefault(require("../services/WebBuscaJobService"));
const connect_1 = __importDefault(require("../infra/supabase/connect"));
const PromptsService_1 = __importDefault(require("../services/PromptsService"));
const CotacoesService_1 = __importDefault(require("../services/CotacoesService"));
const RelatorioService_1 = __importDefault(require("../services/RelatorioService"));
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
            const searchWeb = req.body?.searchWeb !== undefined ? Boolean(req.body.searchWeb) : true;
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
            console.log(`🔍 [BUSCA-LOCAL] Processando busca para: "${solicitacao}"`);
            console.log(`📊 [BUSCA-LOCAL] Produtos não encontrados no banco de dados: ${faltantes.length}`);
            console.log(`🏠 [BUSCA-LOCAL] Resultados locais: ${Object.keys(resumoLocal).length} queries`);
            console.log(`📋 [BUSCA-LOCAL] Cotação: ${cotacoesInfo?.principal_id || 'Nenhuma'}`);
            let produtosWeb = [];
            let resultadosCompletos = [];
            if (faltantes.length > 0) {
                console.log(`🌐 [BUSCA-LOCAL] Iniciando busca web para ${faltantes.length} faltantes`);
                const svc = new WebBuscaJobService_1.default();
                const statusUrls = await svc.createJobsForFaltantes(faltantes, solicitacao);
                console.log(`🚀 [BUSCA-LOCAL] Jobs criados: ${statusUrls.length}`);
                const { resultadosCompletos: resultados, produtosWeb: aprovados } = await svc.waitJobs(statusUrls);
                produtosWeb = aprovados;
                resultadosCompletos = resultados;
                console.log(`✅ [BUSCA-LOCAL] Jobs concluídos: ${produtosWeb.length} produtos aprovados`);
                console.log(`📋 [BUSCA-LOCAL] Resultados completos: ${resultadosCompletos.length} jobs`);
                // Verificar se precisamos criar cotação para produtos web
                if (produtosWeb.length > 0 && !cotacoesInfo?.principal_id) {
                    console.log(`📝 [BUSCA-LOCAL] Cotação será criada para receber ${produtosWeb.length} produtos web`);
                }
            }
            // Usar a cotação que o Python já criou, ou criar apenas se necessário
            let cotacaoPrincipalId = cotacoesInfo?.principal_id ?? null;
            const temResultadosLocais = Object.values(resumoLocal).some((arr) => Array.isArray(arr) && arr.length > 0);
            console.log(`🏗️ [BUSCA-LOCAL] Verificando cotação:`);
            console.log(`   - Cotação: ${cotacaoPrincipalId || 'Nenhuma'}`);
            console.log(`   - Produtos web: ${produtosWeb.length}`);
            console.log(`   - Faltantes: ${faltantes.length}`);
            // Só criar cotação se o Python não criou e realmente precisarmos
            if (!cotacaoPrincipalId && (produtosWeb.length > 0 || faltantes.length > 0)) {
                console.log(`📝 [BUSCA-LOCAL] Criando nova cotação para produtos web/faltantes`);
                const dadosExtraidos = payload?.dados_extraidos || {
                    solucao_principal: solicitacao,
                    tipo_de_solucao: 'sistema',
                    itens_a_comprar: faltantes.map((f) => ({
                        nome: f.nome || 'Item não especificado',
                        natureza_componente: 'software',
                        prioridade: 'media',
                        categoria: f.categoria || 'Geral',
                        quantidade: f.quantidade || 1
                    }))
                };
                const prompt = await PromptsService_1.default.create({
                    texto_original: solicitacao,
                    dados_extraidos: dadosExtraidos,
                    dados_bruto: payload?.dados_bruto || {},
                    origem: { tipo: 'servico', fonte: 'api' },
                    status: 'analizado'
                });
                if (prompt.id) {
                    const nova = {
                        prompt_id: prompt.id,
                        status: 'incompleta',
                        aprovacao: false,
                        faltantes: faltantes?.length ? faltantes : [],
                        orcamento_geral: 0
                    };
                    try {
                        const criada = await CotacoesService_1.default.create(nova);
                        cotacaoPrincipalId = criada?.id ?? null;
                        console.log(`✅ [BUSCA-LOCAL] Cotação criada com sucesso: ID ${cotacaoPrincipalId}`);
                    }
                    catch (e) {
                        console.error('❌ [BUSCA-LOCAL] Erro ao criar cotação principal:', e);
                    }
                }
            }
            else if (cotacaoPrincipalId) {
                console.log(`📋 [BUSCA-LOCAL] Usando cotação existente: ID ${cotacaoPrincipalId}`);
            }
            else {
                console.log(`ℹ️ [BUSCA-LOCAL] Nenhuma cotação necessária (apenas resultados locais)`);
            }
            // Inserir itens web, se houver
            if (cotacaoPrincipalId && resultadosCompletos.length > 0 && searchWeb) {
                console.log(`🔧 [BUSCA-LOCAL] Iniciando inserção de ${resultadosCompletos.length} resultados de jobs na cotação ${cotacaoPrincipalId}`);
                try {
                    const svc = new WebBuscaJobService_1.default();
                    const inseridos = await svc.insertJobResultsInCotacao(Number(cotacaoPrincipalId), resultadosCompletos);
                    await svc.recalcOrcamento(Number(cotacaoPrincipalId));
                    console.log(`✅ [BUSCA-LOCAL] ${inseridos} itens web inseridos na cotação ${cotacaoPrincipalId}`);
                }
                catch (e) {
                    console.error('❌ [BUSCA-LOCAL] Erro ao inserir itens web na cotação:', e);
                    console.error('❌ [BUSCA-LOCAL] Stack trace:', e?.stack);
                }
            }
            else {
                console.log(`⚠️ [BUSCA-LOCAL] Condições não atendidas para inserção web:`);
                console.log(`   - cotacaoPrincipalId: ${cotacaoPrincipalId}`);
            }
            // O Python já cria os itens locais automaticamente, não precisamos duplicar aqui
            // Apenas recalcular orçamento se houver resultados locais
            if (cotacaoPrincipalId && temResultadosLocais) {
                await this.recalcularOrcamento(Number(cotacaoPrincipalId));
            }
            // Relatório será gerado automaticamente pelo WebBuscaJobService quando a cotação estiver completa
            // Verificar e gerar relatório automaticamente
            await RelatorioService_1.default.verificarEgerarRelatorio(Number(cotacaoPrincipalId));
            return res.status(200).json({
                success: true,
                message: 'Busca híbrida concluída',
                dados_python: payload,
                resultados_web: produtosWeb,
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