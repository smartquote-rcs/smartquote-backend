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
    // Sempre exibir logs do LLM e logs importantes
    if (message.includes('[LLM-FILTER]') || message.includes('Worker') || message.includes('Job')) {
        console.error(`[WORKER] ${message}`);
    }
    else {
        // Em produção, reduzir verbosidade dos logs gerais
        const isDev = process.env.NODE_ENV !== 'production';
        if (isDev) {
            console.error(`[WORKER] ${message}`);
        }
    }
}
// Função para filtrar produtos usando LLM
async function filtrarProdutosComLLM(produtos, termoBusca, quantidade, custo_beneficio, rigor, ponderacao_web_llm) {
    if (!produtos || produtos.length === 0) {
        return { produtos: [], relatorio: {} };
    }
    try {
        log(`🧠 [LLM-FILTER] Iniciando filtro LLM (Groq) para ${produtos.length} produtos`);
        // Filtrar produtos inadequados antes de enviar para o LLM
        const produtosValidos = produtos;
        if (produtosValidos.length === 0) {
            log(`🧠 [LLM-FILTER] Nenhum produto válido encontrado após filtro`);
            return { produtos: [], relatorio: {} };
        }
        log(`🧠 [LLM-FILTER] ${produtosValidos.length} produtos válidos para análise LLM`);
        // Usar a lib groq (deve estar instalada via npm install groq-sdk)
        // @ts-ignore
        const { Groq } = require('groq-sdk');
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            log('❌ [LLM-FILTER] GROQ_API_KEY não encontrada');
            log('🧠 [LLM-FILTER] Sem API key - nenhum produto será salvo');
            return { produtos: [], relatorio: { erro: "API key não disponível" } };
        }
        // Compactar candidatos para o prompt
        const candidatos = produtosValidos.map((p, index) => ({
            index,
            nome: p.name || p.nome || '',
            categoria: p.categoria || p.modelo || '',
            tags: p.tags || [],
            descricao: (p.description || p.descricao || '').substring(0, 400),
            preco: p.price || p.preco || null,
            estoque: p.estoque || null,
            url: p.product_url || p.url || '',
            escala_mercado: p.escala_mercado || 'Nacional',
        }));
        const prompt_sistema = "Você é um Analista de Soluções de T.I. sénior, agindo como o módulo de decisão final do sistema SmartQuote. A sua análise deve ser lógica, objetiva e implacável na aplicação das regras.\n" +
            "A sua tarefa é analisar uma lista de produtos candidatos extraídos da web e gerar um relatório de recomendação, seguindo estritamente o formato JSON especificado.\n" +
            "Responda APENAS com um objeto JSON válido, sem comentários ou texto extra.\n\n" +
            "--- FORMATO DE SAÍDA (SUCESSO ou FALHA PARCIAL) ---\n" +
            "{\n" +
            '  "index": <int>,             // Índice (0, 1, 2...) do melhor candidato ou -1 se nenhum for totalmente elegível\n' +
            '  "relatorio": {\n' +
            '    "escolha_principal": "<string_or_null>",\n' +
            '    "justificativa_escolha": "<string>",\n' +
            '    "top_ranking": [\n' +
            '      {\n' +
            '        "posicao": <int>,\n' +
            '        "nome": "<string>",\n' +
            '        "url": "<string>",\n' +
            '        "preco": "<string_or_null>",\n' +
            '        "justificativa": "<string>",\n' +
            '        "pontos_fortes": ["<string>"],\n' +
            '        "pontos_fracos": ["<string>"],\n' +
            '        "score_estimado": <float>\n' +
            '      }\n' +
            '    ],\n' +
            '    "criterios_avaliacao": {\n' +
            '      "correspondencia_tipo": "<string>",\n' +
            '      "especificacoes": "<string>",\n' +
            '      "custo_beneficio": "<string>",\n' +
            '      "disponibilidade": "<string>",\n' +
            '      "ponderacao_busca_externa": <float> // Valor entre 0.0 e 1.0 indicando prioridade de busca internacional\n' +
            '    }\n' +
            '  }\n' +
            "}\n\n" +
            "--- FORMATO DE SAÍDA (FALHA TOTAL) ---\n" +
            "{\n" +
            '  "index": -1,\n' +
            '  "relatorio": {\n' +
            '    ...            \n' +
            '    "erro": "Produto não encontrado"\n' +
            '  }\n' +
            "}\n\n" +
            "--- REGRAS DE DECISÃO HIERÁRQUICAS ---\n" +
            "**PASSO 1: VERIFICAÇÃO DE ELEGIBILIDADE (REGRAS NÃO NEGOCIÁVEIS)**\n" +
            "   - Para CADA candidato, verifique o seguinte:\n" +
            "     1. **Tipo de Produto:** O tipo fundamental do produto corresponde à QUERY? (Ex: a query pede 'router', o candidato não pode ser um 'switch').\n" +
            "     2. **Validade dos Dados:** O produto tem um `nome` e uma `url` válidos e não vazios?\n" +
            "   - **SE NENHUM candidato passar nestas verificações:** Você DEVE parar imediatamente e retornar o JSON no `Formato de FALHA TOTAL`.\n" +
            "   - **SE HOUVER candidatos que passam:** Prossiga para o Passo 2 apenas com a lista de candidatos que passaram nesta verificação.\n\n" +
            "**PASSO 2: INTERPRETAÇÃO DO PARÂMETRO 'RIGOR'**\n" +
            "   - O 'rigor' (0-5) define  o quão estritamente as especificações da QUERY e dos FILTROS devem ser seguidas.\n" +
            "   - `rigor=0` (genérico): Foque-se no custo-benefício e na relevância geral. As especificações são flexíveis.\n" +
            "   - `rigor=5` (rígido): As especificações são OBRIGATÓRIAS. Um candidato que não cumpra uma especificação explícita do cliente deve ser desqualificado da posição de `index` principal.\n\n" +
            "**PASSO 3: ANÁLISE E GERAÇÃO DO RELATÓRIO**\n" +
            "   - **Cenário A (SUCESSO):** Se existe PELO MENOS UM candidato que cumpre os requisitos do 'rigor'.\n" +
            "     - Escolha o melhor entre os elegíveis e defina o seu `index`.\n" +
            "     - Gere o relatório completo no `Formato de SUCESSO`.\n" +
            "   - **Cenário B (FALHA PARCIAL):** Se existem candidatos do tipo correto, MAS NENHUM cumpre as especificações com o 'rigor' exigido.\n" +
            "     - Você DEVE definir `index: -1` e `escolha_principal: null`.\n" +
            "     - No `top_ranking`, liste os melhores candidatos, mas na `justificativa` de cada um, explique CLARAMENTE qual especificação obrigatória falhou.\n" +
            "   - **`top_ranking`:**\n" +
            "     - Não force um ranking. Liste apenas os candidatos que são genuinamente relevantes (máximo de 5).\n" +
            "     - Para cada candidato, liste os `pontos_fortes` (ex: 'Preço competitivo', 'Descrição detalhada') e `pontos_fracos` (ex: 'Estoque não informado', 'Especificação inferior à ideal').\n" +
            "   - **`criterios_avaliacao`:** Forneça uma análise honesta e técnica para cada critério.\n\n" +
            "--- USO DE PONDERACAO-WEB ---\n" +
            "   - Para cada candidato, avalie implicitamente a prioridade de busca internacional e defina `PONDERACAO-WEB` entre 0.0 e 1.0:\n" +
            "   - cada candidato possui escala_mercado que pode ser 'Nacional' ou 'Internacional'\n" +
            "   - PONDERACAO-WEB é o quão viável uma opção internacional para o produto\n" +
            "   - PONDERACAO-WEB = 1.0 se escala_mercado = 'Internacional' é totalmente considerado\n" +
            "   - PONDERACAO-WEB = 0.0 se escala_mercado = 'Internacional' não é considerado\n" +
            "   - Considere fatores implícitos: tipo do item (serviço, software, hardware), valor, especialização/nicho, urgência, transportabilidade, fragilidade, suporte local e complexidade de importação.\n";
        const userMsg = `TERMO DE BUSCA: ${termoBusca}\n` +
            `QUANTIDADE: ${quantidade || 1}\n` +
            `CUSTO-BENEFÍCIO: ${JSON.stringify(custo_beneficio || {})}\n` +
            `RIGOR: ${rigor || 0}\n` +
            `PONDERACAO-WEB: ${ponderacao_web_llm || 0}\n` +
            `CANDIDATOS: ${JSON.stringify(candidatos)}\n` +
            "Analise e retorne o ranking completo com justificativas.";
        const client = new Groq({ apiKey });
        const resp = await client.chat.completions.create({
            //model: "llama-3.3-70b-versatile",
            model: "openai/gpt-oss-120b",
            messages: [
                { role: "system", content: prompt_sistema },
                { role: "user", content: userMsg }
            ],
            temperature: 0,
            max_tokens: 8000, // Aumentado para acomodar o relatório
            stream: false
        });
        const content = (resp.choices[0].message.content || '').trim();
        log(`🧠 [LLM-FILTER] Resposta bruta: ${content}`);
        // Tentar extrair JSON completo
        let idx = -1;
        let relatorio = {};
        try {
            // Limpar a resposta se necessário
            let cleanedContent = content;
            if (!content.startsWith('{')) {
                // Buscar por JSON na resposta
                const jsonMatch = content.match(/\{.*\}/s);
                if (jsonMatch) {
                    cleanedContent = jsonMatch[0];
                    log(`🧠 [LLM-FILTER] JSON extraído da resposta: ${cleanedContent.substring(0, 200)}...`);
                }
            }
            const data = JSON.parse(cleanedContent);
            idx = data.index;
            relatorio = data.relatorio || data.report || {};
            //prencher o campo url de cada cdato com o url do candidato
            log(`🧠 [LLM-FILTER] Índice extraído via JSON parse: ${idx}`);
            log(`🧠 [LLM-FILTER] Relatório extraído: ${JSON.stringify(relatorio).substring(0, 300)}...`);
        }
        catch (e) {
            log(`🧠 [LLM-FILTER] Erro ao fazer parse do JSON: ${e}`);
            log(`🧠 [LLM-FILTER] Conteúdo que falhou no parse: ${content.substring(0, 500)}...`);
            // Fallback: tentar extrair apenas o índice
            const numberMatch = content.match(/-?\d+/);
            if (numberMatch) {
                try {
                    idx = parseInt(numberMatch[0], 10);
                    log(`🧠 [LLM-FILTER] Índice extraído via regex numérica: ${idx}`);
                    // Tentar extrair relatório manualmente se o JSON falhou
                    const reportMatch = content.match(/"relatorio":\s*\{[^}]*\}/);
                    if (reportMatch) {
                        try {
                            const reportJson = `{${reportMatch[0]}}`;
                            const reportData = JSON.parse(reportJson);
                            relatorio = reportData.relatorio || {};
                            log(`🧠 [LLM-FILTER] Relatório extraído via regex: ${JSON.stringify(relatorio)}`);
                        }
                        catch (reportError) {
                            log(`🧠 [LLM-FILTER] Erro ao extrair relatório via regex: ${reportError}`);
                        }
                    }
                }
                catch {
                    idx = -1;
                }
            }
        }
        // Validar faixa
        if (typeof idx !== 'number' || idx < 0 || idx >= produtosValidos.length) {
            if (idx === -1) {
                log(`🧠 [LLM-FILTER] LLM rejeitou todos os produtos (índice: -1)`);
                return { produtos: [], relatorio: relatorio };
            }
            log(`🧠 [LLM-FILTER] Índice inválido: ${idx}`);
            return { produtos: [], relatorio: { erro: `Índice inválido: ${idx}` } };
        }
        const produtoSelecionado = produtosValidos[idx];
        log(`🧠 [LLM-FILTER] Produto selecionado: ${produtoSelecionado.name || produtoSelecionado.nome}`);
        // Adicionar o relatório ao produto selecionado
        produtoSelecionado.llm_relatorio = relatorio;
        return { produtos: [produtoSelecionado], relatorio: relatorio };
    }
    catch (error) {
        log(`❌ [LLM-FILTER] Erro no filtro LLM (Groq): ${error}`);
        // Em caso de erro, não salvar nenhum produto
        log(`🧠 [LLM-FILTER] Erro no LLM - nenhum produto será salvo`);
        return { produtos: [], relatorio: { erro: `Erro no LLM: ${error}` } };
    }
}
// Classificar produto selecionado em uma categoria de negócio usando LLM (Groq)
async function classificarCategoriaProduto(produto, termoBusca) {
    try {
        // @ts-ignore
        const { Groq } = require('groq-sdk');
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            log('❌ [LLM-CATEG] GROQ_API_KEY não encontrada');
            return null;
        }
        const categorias = [
            'Hardware de Servidores e Storage',
            'Hardware de Posto de Trabalho',
            'Serviços de Cloud',
            'Networking',
            'Cibersegurança',
            'Videovigilância (CCTV)',
            'Controle de Acesso',
            'Software de Produtividade e Colaboração',
            'Business Intelligence (BI)',
            'Software de Conformidade (Compliance)',
            'Software de Gestão (ERP/CRM)',
            'Automação de Postos de Combustível',
            'Quiosques e Autoatendimento',
            'Internet das Coisas (IoT)',
            'Realidade Virtual e Aumentada (VR/AR)',
            'Soluções para Saúde (Health Tech)'
        ];
        const promptSistema = 'Você é um classificador de produtos de TI. Escolha EXATAMENTE uma categoria da lista fornecida.';
        const userMsg = `TERM0: ${termoBusca}\n` +
            `PRODUTO: ${JSON.stringify({
                nome: produto.name || produto.nome,
                descricao: (produto.description || produto.descricao || '').substring(0, 500),
                url: produto.product_url || produto.url || '',
            })}\n` +
            `CATEGORIAS: ${JSON.stringify(categorias)}\n` +
            'Responda APENAS com um JSON: {"categoria": "<uma das categorias exatamente>"}';
        const client = new Groq({ apiKey });
        const resp = await client.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: promptSistema },
                { role: 'user', content: userMsg },
            ],
            temperature: 0,
            max_tokens: 512,
            stream: false,
        });
        const content = (resp.choices?.[0]?.message?.content || '').trim();
        let categoria = null;
        try {
            const match = content.match(/\{[\s\S]*\}/);
            const jsonText = match ? match[0] : content;
            const parsed = JSON.parse(jsonText);
            if (parsed && typeof parsed.categoria === 'string') {
                categoria = parsed.categoria;
            }
        }
        catch {
            // fallback: tenta casar diretamente uma das categorias
            for (const cat of categorias) {
                if (content.includes(cat)) {
                    categoria = cat;
                    break;
                }
            }
        }
        if (categoria && categorias.includes(categoria)) {
            log(`🏷️ [LLM-CATEG] Categoria atribuída: ${categoria}`);
            return categoria;
        }
        log(`⚠️ [LLM-CATEG] Não foi possível determinar categoria. Resposta: ${content.substring(0, 200)}...`);
        return null;
    }
    catch (e) {
        log(`❌ [LLM-CATEG] Erro ao classificar categoria: ${e}`);
        return null;
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
    const { id, termo, numResultados, fornecedores, usuarioId, quantidade, custo_beneficio, rigor, ponderacao_web_llm, refinamento, salvamento, faltante_id, urls_add } = message;
    log(`Worker iniciado para job ${id} - busca: "${termo}"${refinamento ? ' (com refinamento LLM)' : ''}${faltante_id ? ` - Faltante ID: ${faltante_id}` : ''}`);
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
        let sitesParaBusca = [];
        if (urls_add && Array.isArray(urls_add) && urls_add.length > 0) {
            // adicionar em todas as urls * no final, se não tem / adiconar /*
            urls_add.forEach(url => {
                if (!url.url.endsWith('/')) {
                    url.url += '/*';
                }
                else if (url.url.endsWith('-')) {
                    url.url = url.url.slice(0, -1);
                }
                else {
                    url.url += '*';
                }
                sitesParaBusca.push({ url: url.url, escala_mercado: url.escala_mercado });
            });
            enviarMensagem({
                progresso: {
                    etapa: 'busca',
                    fornecedores: sitesParaBusca.length,
                    detalhes: `Iniciando busca em ${sitesParaBusca.length} sites externos...`
                }
            });
        }
        else {
            sitesParaBusca = fornecedoresFiltrados.map(f => ({ url: f.url, escala_mercado: f.escala_mercado }));
            //sitesParaBusca = [{url: "https://loja.sistec.co.ao/*", escala_mercado: "Nacional"}]; // Buscar em todos os sites cadastrados
            enviarMensagem({
                progresso: {
                    etapa: 'busca',
                    fornecedores: sitesParaBusca.length,
                    detalhes: `Iniciando busca em ${sitesParaBusca.length} fornecedores...`
                }
            });
        }
        // 2. Executar busca
        const buscaService = new BuscaAtomatica_1.BuscaAutomatica();
        log(`Buscando "${termo}" em ${sitesParaBusca.length} sites`);
        const resultados = await buscaService.buscarProdutosMultiplosSites(termo.split('|')[0] || termo, sitesParaBusca, numResultados);
        // Combinar resultados
        let todosProdutos = buscaService.combinarResultados(resultados);
        // Adicionar o ID do faltante a todos os produtos
        if (faltante_id) {
            todosProdutos = todosProdutos.map(produto => ({
                ...produto,
                faltante_id: faltante_id
            }));
        }
        enviarMensagem({
            progresso: {
                etapa: 'busca',
                produtos: todosProdutos.length,
                detalhes: `${todosProdutos.length} produtos encontrados`
            }
        });
        // 3. Aplicar filtros se necessário
        const configuracoes = await FornecedorService_1.default.getConfiguracoesSistema();
        // 4. Aplicar refinamento LLM se solicitado
        // Sempre manter um objeto para evitar null access ao definir propriedades posteriormente
        let relatorioLLM = {};
        if (refinamento && todosProdutos.length > 0) {
            enviarMensagem({
                progresso: {
                    etapa: 'busca',
                    detalhes: 'Aplicando refinamento LLM...'
                }
            });
            const produtosAntesLLM = todosProdutos.length;
            const resultadoLLM = await filtrarProdutosComLLM(todosProdutos, termo, quantidade, custo_beneficio, rigor, ponderacao_web_llm);
            todosProdutos = resultadoLLM.produtos;
            relatorioLLM = resultadoLLM.relatorio || {}; // Capturar o relatório (garantir objeto)
            log(`Produtos após refinamento LLM: ${todosProdutos.length} de ${produtosAntesLLM}`);
            // Classificar categoria do(s) produto(s) selecionado(s)
            if (todosProdutos.length > 0) {
                for (const p of todosProdutos) {
                    const categoria = await classificarCategoriaProduto(p, termo);
                    if (categoria) {
                        p.categoria = categoria;
                    }
                }
            }
            if (todosProdutos.length === 0) {
                log(`🧠 [LLM-FILTER] Nenhum produto aprovado pelo LLM; retornando sem recursividade.`);
            }
        }
        // 5. Salvar produtos na base de dados (se houver produtos)
        if (todosProdutos.length > 0 && salvamento) {
            enviarMensagem({
                progresso: {
                    etapa: 'salvamento',
                    detalhes: 'Salvando produtos na base de dados...'
                }
            });
            const produtoService = new ProdutoService_1.ProdutosService();
            const resultadosSalvamento = [];
            // Usar os produtos filtrados pelo LLM (todosProdutos) em vez dos produtos originais
            // Agrupar produtos por fornecedor para salvar corretamente
            const produtosPorFornecedor = new Map();
            // Mapear produtos filtrados para seus fornecedores originais
            for (const produtoFiltrado of todosProdutos) {
                // Encontrar o fornecedor original deste produto
                for (let i = 0; i < resultados.length; i++) {
                    const resultado = resultados[i];
                    const fornecedor = fornecedoresFiltrados[i];
                    if (resultado?.success && resultado.data?.products) {
                        // Verificar se este produto filtrado veio deste fornecedor
                        const produtoOriginal = resultado.data.products.find(p => p.name === produtoFiltrado.name &&
                            p.product_url === produtoFiltrado.product_url);
                        if (produtoOriginal && fornecedor) {
                            if (!produtosPorFornecedor.has(fornecedor.id)) {
                                produtosPorFornecedor.set(fornecedor.id, []);
                            }
                            produtosPorFornecedor.get(fornecedor.id).push(produtoFiltrado);
                            break;
                        }
                    }
                }
            }
            // Salvar produtos agrupados por fornecedor
            for (const [fornecedorId, produtos] of produtosPorFornecedor) {
                const fornecedor = fornecedoresFiltrados.find(f => f.id === fornecedorId);
                if (!fornecedor)
                    continue;
                try {
                    const salvamento = await produtoService.salvarProdutosDaBusca(produtos, fornecedorId, usuarioId || 1);
                    resultadosSalvamento.push({
                        fornecedor: fornecedor.nome,
                        fornecedor_id: fornecedorId,
                        ...salvamento
                    });
                }
                catch (error) {
                    log(`Erro ao salvar produtos do ${fornecedor.nome}: ${error}`);
                    resultadosSalvamento.push({
                        fornecedor: fornecedor.nome,
                        fornecedor_id: fornecedorId,
                        salvos: 0,
                        erros: produtos.length,
                        detalhes: [{ erro: error instanceof Error ? error.message : 'Erro desconhecido' }]
                    });
                }
            }
            const totalSalvos = resultadosSalvamento.reduce((acc, r) => acc + r.salvos, 0);
            const totalErros = resultadosSalvamento.reduce((acc, r) => acc + r.erros, 0);
            // 6. Enviar resultado final
            const tempoTotal = Date.now() - inicioTempo;
            // Garantir que relatorioLLM é um objeto e registrar metadados úteis
            try {
                if (!relatorioLLM || typeof relatorioLLM !== 'object')
                    relatorioLLM = {};
                relatorioLLM.query = termo;
            }
            catch { }
            if (faltante_id) {
                relatorioLLM.faltante_id = faltante_id;
            }
            enviarMensagem({
                status: 'sucesso',
                produtos: todosProdutos,
                quantidade: quantidade,
                relatorio: relatorioLLM, // Incluir relatório do LLM
                salvamento: {
                    salvos: totalSalvos,
                    erros: totalErros,
                    detalhes: resultadosSalvamento
                },
                tempoExecucao: tempoTotal
            });
            log(`Worker concluído - Job ${id}: ${totalSalvos} produtos salvos em ${tempoTotal}ms`);
        }
        else if (!salvamento && todosProdutos.length > 0) {
            // Se não for para salvar, apenas retornar os produtos encontrados
            const tempoTotal = Date.now() - inicioTempo;
            if (faltante_id) {
                try {
                    if (!relatorioLLM || typeof relatorioLLM !== 'object')
                        relatorioLLM = {};
                    relatorioLLM.faltante_id = faltante_id;
                }
                catch { }
            }
            enviarMensagem({
                status: 'sucesso',
                produtos: todosProdutos,
                quantidade: quantidade,
                relatorio: relatorioLLM, // Incluir relatório do LLM mesmo sem salvamento
                salvamento: {
                    salvos: 0,
                    erros: 0,
                    detalhes: []
                },
                tempoExecucao: tempoTotal
            });
            log(`Worker concluído - Job ${id}: ${todosProdutos.length} produtos encontrados (sem salvamento) em ${tempoTotal}ms`);
        }
        else {
            // Nenhum produto encontrado
            const tempoTotal = Date.now() - inicioTempo;
            if (relatorioLLM && faltante_id) {
                relatorioLLM.faltante_id = faltante_id;
            }
            enviarMensagem({
                status: 'sucesso',
                produtos: [],
                relatorio: relatorioLLM, // Incluir relatório do LLM mesmo sem produtos
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