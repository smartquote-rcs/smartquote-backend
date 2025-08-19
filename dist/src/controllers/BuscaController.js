"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BuscaAtomatica_1 = require("../services/BuscaAtomatica");
const BuscaSchema_1 = require("../schemas/BuscaSchema");
const FornecedorService_1 = __importDefault(require("../services/FornecedorService"));
const ProdutoService_1 = require("../services/ProdutoService");
const JobManager_1 = require("../services/JobManager");
class BuscaController {
    /**
     * Realiza busca automática de produtos
     */
    async buscarProdutos(req, res) {
        // Validação usando schema
        const parsed = BuscaSchema_1.buscaSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({
                success: false,
                message: "Dados inválidos",
                errors
            });
        }
        try {
            const { produto } = parsed.data;
            // Buscar sites ativos da base de dados
            const sitesFromDB = await FornecedorService_1.default.getFornecedoresAtivos();
            if (sitesFromDB.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Nenhum fornecedor ativo encontrado na base de dados"
                });
            }
            // Extrair URLs para busca
            const sitesParaBusca = sitesFromDB.map(site => site.url);
            // Buscar configurações do sistema
            const configuracoes = await FornecedorService_1.default.getConfiguracoesSistema();
            const numResultados = configuracoes.numResultadosPorSite;
            const precoMin = configuracoes.precoMinimo;
            const precoMax = configuracoes.precoMaximo;
            // Instanciar o serviço de busca
            const buscaService = new BuscaAtomatica_1.BuscaAutomatica();
            // Registrar tempo de início
            const inicioTempo = Date.now();
            // Realizar busca em múltiplos sites
            console.log(`Iniciando busca por "${produto}" em ${sitesParaBusca.length} sites`);
            console.log(`Sites: ${sitesFromDB.map(s => s.nome).join(', ')}`);
            console.log(`Configurações: ${numResultados} resultados por site`);
            const resultados = await buscaService.buscarProdutosMultiplosSites(produto, sitesParaBusca, numResultados);
            // Combinar todos os resultados
            let todosProdutos = buscaService.combinarResultados(resultados);
            // Log para debug
            console.log(`Produtos antes dos filtros: ${todosProdutos.length}`);
            console.log(`Configuração: ${numResultados} produtos por site x ${sitesParaBusca.length} sites = máximo ${numResultados * sitesParaBusca.length}`);
            // Aplicar filtros de preço das configurações do sistema (se definidos)
            if (precoMin !== null || precoMax !== null) {
                todosProdutos = buscaService.filtrarPorPreco(todosProdutos, precoMin || undefined, precoMax || undefined);
                console.log(`Produtos após filtro de preço: ${todosProdutos.length}`);
            }
            // LIMITE ADICIONAL: Se ainda há muitos produtos, limitar ao total esperado
            const limiteTotal = numResultados * sitesParaBusca.length;
            if (todosProdutos.length > limiteTotal) {
                console.log(`⚠️  Limitando ${todosProdutos.length} produtos para ${limiteTotal}`);
                todosProdutos = todosProdutos.slice(0, limiteTotal);
            }
            // ===== SALVAMENTO NA BASE DE DADOS =====
            let resultadosSalvamento = [];
            if (todosProdutos.length > 0) {
                console.log(`💾 Iniciando salvamento de produtos na base de dados...`);
                const produtoService = new ProdutoService_1.ProdutosService();
                // Salvar produtos por fornecedor
                for (let i = 0; i < resultados.length; i++) {
                    const resultado = resultados[i];
                    const fornecedor = sitesFromDB[i];
                    if (!resultado || !fornecedor)
                        continue;
                    if (resultado.success && resultado.data && resultado.data.products.length > 0) {
                        try {
                            const salvamento = await produtoService.salvarProdutosDaBusca(resultado.data.products, fornecedor.id, 1 // TODO: usar ID do usuário autenticado
                            );
                            resultadosSalvamento.push({
                                fornecedor: fornecedor.nome,
                                fornecedor_id: fornecedor.id,
                                ...salvamento
                            });
                        }
                        catch (error) {
                            console.error(`Erro ao salvar produtos do ${fornecedor.nome}:`, error);
                            resultadosSalvamento.push({
                                fornecedor: fornecedor.nome,
                                fornecedor_id: fornecedor.id,
                                salvos: 0,
                                erros: resultado.data?.products.length || 0,
                                detalhes: [{ erro: error instanceof Error ? error.message : 'Erro desconhecido' }]
                            });
                        }
                    }
                }
                const totalSalvos = resultadosSalvamento.reduce((acc, r) => acc + r.salvos, 0);
                const totalErros = resultadosSalvamento.reduce((acc, r) => acc + r.erros, 0);
                console.log(`📊 Salvamento concluído: ${totalSalvos} produtos salvos, ${totalErros} erros`);
            }
            // Calcular tempo de busca
            const tempoTotal = Date.now() - inicioTempo;
            // Criar resposta estruturada
            const resposta = buscaService.criarRespostaBusca(todosProdutos, sitesParaBusca, {
                precoMin: precoMin || undefined,
                precoMax: precoMax || undefined
            }, tempoTotal);
            // Log dos resultados
            console.log(`Busca concluída: ${resposta.total} produtos encontrados em ${tempoTotal}ms`);
            // Retornar resposta
            const totalSalvos = resultadosSalvamento.reduce((acc, r) => acc + r.salvos, 0);
            const totalErrosSalvamento = resultadosSalvamento.reduce((acc, r) => acc + r.erros, 0);
            return res.status(200).json({
                success: true,
                message: `Busca realizada com sucesso. ${resposta.total} produtos encontrados, ${totalSalvos} salvos na BD.`,
                data: resposta,
                configuracoes_utilizadas: {
                    sites_pesquisados: sitesFromDB.map(site => site.nome),
                    total_fornecedores: sitesFromDB.length,
                    resultados_por_site: numResultados,
                    filtros_preco: {
                        minimo: precoMin,
                        maximo: precoMax
                    }
                },
                salvamento_bd: {
                    total_produtos_salvos: totalSalvos,
                    total_erros: totalErrosSalvamento,
                    detalhes_por_fornecedor: resultadosSalvamento
                }
            });
        }
        catch (error) {
            console.error("Erro na busca automática:", error);
            return res.status(500).json({
                success: false,
                message: "Erro interno do servidor durante a busca",
                error: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }
    }
    /**
     * Inicia busca automática em background e retorna job ID imediatamente
     */
    async buscarProdutosBackground(req, res) {
        // Validação usando schema
        const parsed = BuscaSchema_1.buscaSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({
                success: false,
                message: "Dados inválidos",
                errors
            });
        }
        try {
            const { produto } = parsed.data;
            // Buscar fornecedores ativos para validar que existem sites para buscar
            const sitesFromDB = await FornecedorService_1.default.getFornecedoresAtivos();
            if (sitesFromDB.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Nenhum fornecedor ativo encontrado na base de dados"
                });
            }
            // Buscar configurações do sistema
            const configuracoes = await FornecedorService_1.default.getConfiguracoesSistema();
            const numResultados = configuracoes.numResultadosPorSite;
            // Criar job em background
            const jobId = JobManager_1.jobManager.criarJob(produto, numResultados, sitesFromDB.map(f => f.id), 1 // TODO: usar ID do usuário autenticado
            );
            // Responder imediatamente com o job ID
            return res.status(202).json({
                success: true,
                message: `Busca iniciada em background. Use o job ID para acompanhar o progresso.`,
                jobId: jobId,
                statusUrl: `/api/busca/job/${jobId}`,
                parametros: {
                    termo: produto,
                    numResultados: numResultados,
                    fornecedores: sitesFromDB.length
                }
            });
        }
        catch (error) {
            console.error("Erro ao iniciar busca em background:", error);
            return res.status(500).json({
                success: false,
                message: "Erro interno do servidor ao iniciar busca",
                error: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }
    }
    /**
     * Retorna o status de um job
     */
    async getJobStatus(req, res) {
        try {
            const jobId = req.params.jobId;
            if (!jobId) {
                return res.status(400).json({
                    success: false,
                    message: "Job ID é obrigatório"
                });
            }
            const job = JobManager_1.jobManager.getStatusJob(jobId);
            if (!job) {
                return res.status(404).json({
                    success: false,
                    message: "Job não encontrado"
                });
            }
            return res.status(200).json({
                success: true,
                job: job
            });
        }
        catch (error) {
            console.error("Erro ao buscar status do job:", error);
            return res.status(500).json({
                success: false,
                message: "Erro interno do servidor",
                error: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }
    }
    /**
     * Lista todos os jobs
     */
    async listarJobs(req, res) {
        try {
            const limite = req.query.limite ? parseInt(req.query.limite) : 50;
            const jobs = JobManager_1.jobManager.listarJobs(limite);
            return res.status(200).json({
                success: true,
                message: `${jobs.length} jobs encontrados`,
                jobs: jobs
            });
        }
        catch (error) {
            console.error("Erro ao listar jobs:", error);
            return res.status(500).json({
                success: false,
                message: "Erro interno do servidor",
                error: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }
    }
    /**
     * Cancela um job
     */
    async cancelarJob(req, res) {
        try {
            const jobId = req.params.jobId;
            if (!jobId) {
                return res.status(400).json({
                    success: false,
                    message: "Job ID é obrigatório"
                });
            }
            const cancelado = JobManager_1.jobManager.cancelarJob(jobId);
            if (!cancelado) {
                return res.status(400).json({
                    success: false,
                    message: "Job não pode ser cancelado (não encontrado ou já finalizado)"
                });
            }
            return res.status(200).json({
                success: true,
                message: "Job cancelado com sucesso"
            });
        }
        catch (error) {
            console.error("Erro ao cancelar job:", error);
            return res.status(500).json({
                success: false,
                message: "Erro interno do servidor",
                error: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }
    }
    /**
     * Retorna lista de sites disponíveis
     */
    async getSites(req, res) {
        try {
            const sitesAtivos = await FornecedorService_1.default.getFornecedoresAtivos();
            const configuracoes = await FornecedorService_1.default.getConfiguracoesSistema();
            return res.status(200).json({
                success: true,
                message: "Sites disponíveis para busca",
                data: {
                    sites_ativos: sitesAtivos,
                    total_sites: sitesAtivos.length,
                    configuracoes: configuracoes
                }
            });
        }
        catch (error) {
            console.error("Erro ao buscar sites:", error);
            return res.status(500).json({
                success: false,
                message: "Erro ao buscar sites disponíveis",
                error: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }
    }
    /**
     * Retorna configurações padrão
     */
    async getConfig(req, res) {
        try {
            const configuracoes = await FornecedorService_1.default.getConfiguracoesSistema();
            return res.status(200).json({
                success: true,
                message: "Configurações do sistema",
                data: configuracoes
            });
        }
        catch (error) {
            console.error("Erro ao buscar configurações:", error);
            return res.status(500).json({
                success: false,
                message: "Erro ao buscar configurações",
                error: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }
    }
    /**
     * Lista produtos salvos de um fornecedor
     */
    async getProdutosPorFornecedor(req, res) {
        try {
            const fornecedorIdParam = req.params.fornecedorId;
            if (!fornecedorIdParam) {
                return res.status(400).json({
                    success: false,
                    message: "ID do fornecedor é obrigatório"
                });
            }
            const fornecedorId = parseInt(fornecedorIdParam);
            if (isNaN(fornecedorId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID do fornecedor inválido"
                });
            }
            const produtoService = new ProdutoService_1.ProdutosService();
            const produtos = await produtoService.getProdutosPorFornecedor(fornecedorId);
            // Buscar informações do fornecedor
            const fornecedor = await FornecedorService_1.default.getFornecedorById(fornecedorId);
            return res.status(200).json({
                success: true,
                message: `Produtos do fornecedor encontrados`,
                data: {
                    fornecedor: fornecedor ? {
                        id: fornecedor.id,
                        nome: fornecedor.nome,
                        site: fornecedor.site
                    } : null,
                    produtos: produtos,
                    total: produtos.length
                }
            });
        }
        catch (error) {
            console.error("Erro ao buscar produtos do fornecedor:", error);
            return res.status(500).json({
                success: false,
                message: "Erro ao buscar produtos do fornecedor",
                error: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }
    }
}
exports.default = new BuscaController();
//# sourceMappingURL=BuscaController.js.map