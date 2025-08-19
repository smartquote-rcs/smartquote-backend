"use strict";
/**
 * Worker para executar busca automática em background
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BuscaAtomatica_1 = require("../services/BuscaAtomatica");
const FornecedorService_1 = __importDefault(require("../services/FornecedorService"));
const ProdutoService_1 = require("../services/ProdutoService");
// Função auxiliar para enviar mensagens via stdout (apenas JSON)
function enviarMensagem(message) {
    // Usar um prefixo especial para identificar mensagens JSON
    console.log('WORKER_MSG:' + JSON.stringify(message));
}
// Função auxiliar para logs (via stderr para não interferir)
function log(message) {
    // Em produção, reduzir verbosidade dos logs
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
        console.error(`[WORKER] ${message}`);
    }
}
// Escutar mensagens via stdin
process.stdin.setEncoding('utf8');
process.stdin.on('data', async (data) => {
    try {
        const message = JSON.parse(data.trim());
        await processarJob(message);
    }
    catch (error) {
        log(`Erro ao processar mensagem: ${error}`);
        enviarMensagem({
            status: 'erro',
            erro: error instanceof Error ? error.message : 'Erro ao processar mensagem'
        });
        process.exit(1);
    }
});
// Função principal que processa o job
async function processarJob(message) {
    const { id, termo, numResultados, fornecedores, usuarioId } = message;
    log(`Worker iniciado para job ${id} - busca: "${termo}"`);
    const inicioTempo = Date.now();
    try {
        // 1. Buscar fornecedores da base de dados
        enviarMensagem({
            progresso: {
                etapa: 'busca',
                detalhes: 'Carregando fornecedores da base de dados...'
            }
        });
        const fornecedoresBD = await FornecedorService_1.default.getFornecedoresAtivos();
        // Filtrar fornecedores pelos IDs especificados
        const fornecedoresFiltrados = fornecedoresBD.filter(f => fornecedores.includes(f.id));
        if (fornecedoresFiltrados.length === 0) {
            throw new Error('Nenhum fornecedor válido encontrado');
        }
        const sitesParaBusca = fornecedoresFiltrados.map(f => f.url);
        enviarMensagem({
            progresso: {
                etapa: 'busca',
                fornecedores: fornecedoresFiltrados.length,
                detalhes: `Iniciando busca em ${fornecedoresFiltrados.length} fornecedores...`
            }
        });
        // 2. Executar busca
        const buscaService = new BuscaAtomatica_1.BuscaAutomatica();
        log(`Buscando "${termo}" em ${sitesParaBusca.length} sites`);
        const resultados = await buscaService.buscarProdutosMultiplosSites(termo, sitesParaBusca, numResultados);
        // Combinar resultados
        let todosProdutos = buscaService.combinarResultados(resultados);
        enviarMensagem({
            progresso: {
                etapa: 'busca',
                produtos: todosProdutos.length,
                detalhes: `${todosProdutos.length} produtos encontrados`
            }
        });
        // 3. Aplicar filtros se necessário
        const configuracoes = await FornecedorService_1.default.getConfiguracoesSistema();
        const { precoMinimo, precoMaximo } = configuracoes;
        if (precoMinimo !== null || precoMaximo !== null) {
            todosProdutos = buscaService.filtrarPorPreco(todosProdutos, precoMinimo || undefined, precoMaximo || undefined);
            enviarMensagem({
                progresso: {
                    etapa: 'busca',
                    produtos: todosProdutos.length,
                    detalhes: `${todosProdutos.length} produtos após filtro de preço`
                }
            });
        }
        // 4. Salvar produtos na base de dados
        if (todosProdutos.length > 0) {
            enviarMensagem({
                progresso: {
                    etapa: 'salvamento',
                    produtos: todosProdutos.length,
                    detalhes: 'Salvando produtos na base de dados...'
                }
            });
            const produtoService = new ProdutoService_1.ProdutosService();
            const resultadosSalvamento = [];
            for (let i = 0; i < resultados.length; i++) {
                const resultado = resultados[i];
                const fornecedor = fornecedoresFiltrados[i];
                if (!resultado || !fornecedor)
                    continue;
                if (resultado.success && resultado.data && resultado.data.products.length > 0) {
                    try {
                        const salvamento = await produtoService.salvarProdutosDaBusca(resultado.data.products, fornecedor.id, usuarioId || 1);
                        resultadosSalvamento.push({
                            fornecedor: fornecedor.nome,
                            fornecedor_id: fornecedor.id,
                            ...salvamento
                        });
                    }
                    catch (error) {
                        log(`Erro ao salvar produtos do ${fornecedor.nome}: ${error}`);
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
            // 5. Enviar resultado final
            const tempoTotal = Date.now() - inicioTempo;
            enviarMensagem({
                status: 'sucesso',
                produtos: todosProdutos,
                salvamento: {
                    salvos: totalSalvos,
                    erros: totalErros,
                    detalhes: resultadosSalvamento
                },
                tempoExecucao: tempoTotal
            });
            log(`Worker concluído - Job ${id}: ${totalSalvos} produtos salvos em ${tempoTotal}ms`);
        }
        else {
            // Nenhum produto encontrado
            const tempoTotal = Date.now() - inicioTempo;
            enviarMensagem({
                status: 'sucesso',
                produtos: [],
                salvamento: {
                    salvos: 0,
                    erros: 0,
                    detalhes: []
                },
                tempoExecucao: tempoTotal
            });
            log(`Worker concluído - Job ${id}: Nenhum produto encontrado em ${tempoTotal}ms`);
        }
    }
    catch (error) {
        log(`Erro no worker do job ${id}: ${error}`);
        enviarMensagem({
            status: 'erro',
            erro: error instanceof Error ? error.message : 'Erro desconhecido no worker'
        });
    }
    // Encerrar processo
    process.exit(0);
}
// Tratar erros não capturados
process.on('uncaughtException', (error) => {
    log(`Erro não capturado no worker: ${error}`);
    enviarMensagem({
        status: 'erro',
        erro: `Erro não capturado: ${error.message}`
    });
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    log(`Promise rejeitada no worker: ${reason}`);
    enviarMensagem({
        status: 'erro',
        erro: `Promise rejeitada: ${reason}`
    });
    process.exit(1);
});
log('Worker de busca inicializado e aguardando mensagens...');
//# sourceMappingURL=buscaWorker.js.map