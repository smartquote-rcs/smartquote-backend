"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatorioService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const connect_1 = __importDefault(require("../infra/supabase/connect"));
const PDFGenerator_1 = require("./relatorio/PDFGenerator");
const AnaliseLocalRenderer_1 = require("./relatorio/renderers/AnaliseLocalRenderer");
const AnaliseWebRenderer_1 = require("./relatorio/renderers/AnaliseWebRenderer");
const AnaliseCacheRenderer_1 = require("./relatorio/renderers/AnaliseCacheRenderer");
const AnaliseExternaRenderer_1 = require("./relatorio/renderers/AnaliseExternaRenderer");
/**
 * Unifica os campos principais de DadosBruto em uma string coesa
 */
function formarStringComdadosBrutos(dados) {
    if (!dados)
        return '';
    const partes = [];
    if (dados.snippet)
        partes.push(`Assunto: ${dados.snippet}`);
    if (dados.subject && dados.subject !== dados.snippet)
        partes.push(`Título: ${dados.subject}`);
    if (dados.from)
        partes.push(`Remetente: ${dados.from}`);
    if (dados.date)
        partes.push(`Data: ${dados.date}`);
    return partes.join(' | ');
}
class RelatorioService {
    constructor() {
    }
    /**
     * Verifica se a cotação está completa e gera relatório automaticamente
     */
    async verificarEgerarRelatorio(cotacaoId) {
        try {
            // Buscar status atual da cotação
            const { data: cotacao, error } = await connect_1.default
                .from('cotacoes')
                .select('status, orcamento_geral, aprovacao')
                .eq('id', cotacaoId)
                .single();
            if (error || !cotacao) {
                console.error('❌ [RELATORIO] Erro ao buscar status da cotação:', error);
                return "";
            }
            // Buscar e processar analise_web_externa de todos os itens
            const { data: itensComAnaliseExterna, error: itensExternaError } = await connect_1.default
                .from('cotacoes_itens')
                .select('id, item_nome, pedido, analise_web_externa')
                .eq('cotacao_id', cotacaoId)
                .not('analise_web_externa', 'is', null);
            const analiseExterna = [];
            if (!itensExternaError && itensComAnaliseExterna) {
                for (const item of itensComAnaliseExterna) {
                    const externa = item.analise_web_externa;
                    if (externa) {
                        if (Array.isArray(externa)) {
                            for (const analiseItem of externa) {
                                if (analiseItem) {
                                    const analiseComItem = {
                                        ...analiseItem,
                                        id_item_cotacao: item.id,
                                        item_nome: item.item_nome,
                                        pedido: item.pedido,
                                    };
                                    analiseExterna.push(analiseComItem);
                                }
                            }
                        }
                        else {
                            const analiseComItem = {
                                ...externa,
                                id_item_cotacao: item.id,
                                item_nome: item.item_nome,
                                pedido: item.pedido,
                            };
                            analiseExterna.push(analiseComItem);
                        }
                    }
                }
            }
            // Verificar se está completa
            //&& cotacao.aprovacao == true
            if (cotacao.status === 'completa' && cotacao.orcamento_geral > 0 || true) {
                console.log(`📊 [RELATORIO] Cotação ${cotacaoId} está completa. Gerando relatório automaticamente...`);
                try {
                    const pdfPath = await this.gerarRelatorioCompleto(cotacaoId);
                    console.log(`✅ [RELATORIO] Relatório gerado automaticamente: ${pdfPath}`);
                    // Atualizar a cotação com o caminho do relatório
                    await connect_1.default
                        .from('relatorios')
                        .update({
                        relatorio_path: pdfPath
                    })
                        .eq('cotacao_id', cotacaoId);
                    return pdfPath;
                }
                catch (reportError) {
                    console.error('❌ [RELATORIO] Erro ao gerar relatório automaticamente:', reportError);
                    return "";
                }
            }
            return "";
        }
        catch (error) {
            console.error('❌ [RELATORIO] Erro geral na verificação:', error);
            return "";
        }
    }
    /**
     * Gera dados de relatorio
     */
    async gerarDadosRelatorio(cotacaoId) {
        try {
            // Buscar dados básicos da cotação incluindo proposta_email
            const { data: cotacao, error: cotacaoError } = await connect_1.default
                .from('cotacoes')
                .select(`
          id, 
          prompt_id, 
          orcamento_geral,
          proposta_email,
          prompt:prompts(id, texto_original, cliente, dados_bruto)
        `)
                .eq('id', cotacaoId)
                .single();
            if (cotacaoError || !cotacao) {
                throw new Error(`Dados da cotação não encontrados: ${cotacaoError?.message}`);
            }
            // Buscar analise_web e analise_local dos itens individuais da cotação
            const { data: itensComAnaliseWeb, error: itensWebError } = await connect_1.default
                .from('cotacoes_itens')
                .select('id, item_nome, analise_web')
                .eq('cotacao_id', cotacaoId)
                .not('analise_web', 'is', null);
            const { data: itensComAnaliseLocal, error: itensLocalError } = await connect_1.default
                .from('cotacoes_itens')
                .select('id, item_nome, analise_local, pedido')
                .eq('cotacao_id', cotacaoId)
                .not('analise_local', 'is', null);
            // Buscar analise_cache (cache) dos itens
            const { data: itensComAnaliseCache, error: itensCacheError } = await connect_1.default
                .from('cotacoes_itens')
                .select('id, item_nome, analise_cache, pedido')
                .eq('cotacao_id', cotacaoId)
                .not('analise_cache', 'is', null);
            //conta quantos produtos foram selecionados, quantos itens com status true
            const { data: itensEncontrados, error: itensEncontradosE } = await connect_1.default
                .from('cotacoes_itens')
                .select('id')
                .eq('cotacao_id', cotacaoId)
                .is('status', true);
            const numProdutosEscolhidos = itensEncontrados ? itensEncontrados.length : 0;
            // Processar dados das análises locais
            const analiseLocal = [];
            if (!itensLocalError && itensComAnaliseLocal) {
                for (const item of itensComAnaliseLocal) {
                    if (item.analise_local) {
                        // Se analise_local é um array
                        if (Array.isArray(item.analise_local)) {
                            for (const analiseItem of item.analise_local) {
                                if (analiseItem) {
                                    const analiseComItem = {
                                        ...analiseItem,
                                        id_item_cotacao: item.id,
                                        item_nome: item.item_nome,
                                        pedido: item.pedido
                                    };
                                    analiseLocal.push(analiseComItem);
                                }
                            }
                        }
                        else {
                            // Se analise_local é um objeto único
                            const analiseComItem = {
                                ...item.analise_local,
                                id_item_cotacao: item.id,
                                item_nome: item.item_nome,
                                pedido: item.pedido
                            };
                            analiseLocal.push(analiseComItem);
                        }
                    }
                }
            }
            // Processar dados das análises em cache
            const analiseCache = [];
            if (!itensCacheError && itensComAnaliseCache) {
                for (const item of itensComAnaliseCache) {
                    if (item.analise_cache) {
                        const cache = item.analise_cache;
                        if (Array.isArray(cache)) {
                            for (const analiseItem of cache) {
                                if (analiseItem) {
                                    const analiseComItem = {
                                        ...analiseItem,
                                        id_item_cotacao: item.id,
                                        item_nome: item.item_nome,
                                        pedido: item.pedido,
                                    };
                                    analiseCache.push(analiseComItem);
                                }
                            }
                        }
                        else {
                            const analiseComItem = {
                                ...cache,
                                id_item_cotacao: item.id,
                                item_nome: item.item_nome,
                                pedido: item.pedido,
                            };
                            analiseCache.push(analiseComItem);
                        }
                    }
                }
            }
            // Agregar analise_web de todos os itens
            const analiseWeb = [];
            if (!itensWebError && itensComAnaliseWeb) {
                for (const item of itensComAnaliseWeb) {
                    if (item.analise_web) {
                        // Se analise_web é um array
                        if (Array.isArray(item.analise_web)) {
                            for (const analiseItem of item.analise_web) {
                                if (analiseItem) {
                                    const analiseComItem = {
                                        ...analiseItem,
                                        id_item_cotacao: item.id,
                                        item_nome: item.item_nome
                                    };
                                    analiseWeb.push(analiseComItem);
                                }
                            }
                        }
                        else {
                            // Se analise_web é um objeto único
                            const analiseComItem = {
                                ...item.analise_web,
                                id_item_cotacao: item.id,
                                item_nome: item.item_nome
                            };
                            analiseWeb.push(analiseComItem);
                        }
                    }
                }
            }
            // Buscar e processar analise_web_externa de todos os itens
            const { data: itensComAnaliseExterna, error: itensExternaError } = await connect_1.default
                .from('cotacoes_itens')
                .select('id, item_nome, analise_web_externa')
                .eq('cotacao_id', cotacaoId)
                .not('analise_web_externa', 'is', null);
            const analiseExterna = [];
            if (!itensExternaError && itensComAnaliseExterna) {
                for (const item of itensComAnaliseExterna) {
                    const externa = item.analise_web_externa;
                    if (externa) {
                        if (Array.isArray(externa)) {
                            for (const analiseItem of externa) {
                                if (analiseItem) {
                                    const analiseComItem = {
                                        ...analiseItem,
                                        id_item_cotacao: item.id,
                                        item_nome: item.item_nome,
                                    };
                                    analiseExterna.push(analiseComItem);
                                }
                            }
                        }
                        else {
                            const analiseComItem = {
                                ...externa,
                                id_item_cotacao: item.id,
                                item_nome: item.item_nome,
                            };
                            analiseExterna.push(analiseComItem);
                        }
                    }
                }
            }
            const promptObj = cotacao.prompt;
            formarStringComdadosBrutos(promptObj?.dados_bruto);
            // Estruturar dados para o relatório
            // promptObj já normalizado acima; manter uso como objeto
            const data = {
                cotacaoId: cotacao.id,
                promptId: cotacao.prompt_id,
                solicitacao: promptObj?.texto_original || 'Solicitação não encontrada',
                orcamentoGeral: cotacao.orcamento_geral,
                cliente: promptObj?.cliente || {},
                propostaEmail: cotacao.proposta_email,
                analiseCache,
                analiseLocal,
                analiseWeb,
                analiseExterna,
                numProdutosEscolhidos
            };
            console.log(`📋 [RELATORIO] Dados processados - Local: ${analiseLocal.length}, Web: ${analiseWeb.length} (de ${itensComAnaliseLocal?.length || 0} + ${itensComAnaliseWeb?.length || 0} itens)`);
            return data;
        }
        catch (error) {
            console.error('❌ [RELATORIO] Erro ao gerar dados do relatório:', error);
            return null;
        }
    }
    /**
     * Gera relatório completo em PDF para download direto (retorna buffer)
     */
    async gerarRelatorioParaDownload(cotacaoId) {
        console.log(`📊 [RELATORIO] Iniciando geração de relatório para download da cotação ${cotacaoId}`);
        try {
            const data = await this.gerarDadosRelatorio(cotacaoId);
            // Gerar PDF como buffer
            const pdfBuffer = await this.gerarPDFBuffer(data);
            console.log(`✅ [RELATORIO] PDF gerado com sucesso para download`);
            return pdfBuffer;
        }
        catch (error) {
            console.error('❌ [RELATORIO] Erro ao gerar relatório para download:', error);
            throw error;
        }
    }
    /**
     * Gera o arquivo PDF como buffer para download direto
     */
    async gerarPDFBuffer(data) {
        return new Promise(async (resolve, reject) => {
            try {
                // Criar documento PDF
                const doc = new pdfkit_1.default({
                    margin: 50,
                    size: 'A4',
                    info: {
                        Title: `Relatório de Cotação ${data.cotacaoId}`,
                        Author: 'SmartQuote System',
                        Subject: 'Relatório de Análise de Cotação',
                        Keywords: 'cotação, análise, relatório, smartquote'
                    }
                });
                // Armazenar dados em chunks para formar o buffer
                const chunks = [];
                doc.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(chunks);
                    console.log(`📄 [RELATORIO] PDF buffer gerado com ${pdfBuffer.length} bytes`);
                    resolve(pdfBuffer);
                });
                doc.on('error', (error) => {
                    console.error('❌ [RELATORIO] Erro ao gerar PDF buffer:', error);
                    reject(error);
                });
                // Inicializar componentes
                const pdfGenerator = new PDFGenerator_1.PDFGenerator(doc);
                // Gerar conteúdo do PDF
                pdfGenerator.adicionarCabecalho(data);
                await pdfGenerator.adicionarSecaoProposta(data);
                // Adicionar condições comerciais
                pdfGenerator.adicionarCondicoesComerciais(data);
                // Adicionar template de email (aguardando pois é assíncrono)
                await pdfGenerator.adicionarTemplateEmail(data);
                // Adicionar análises por pesquisa (query/pedido)
                const analiseLocalRenderer = new AnaliseLocalRenderer_1.AnaliseLocalRenderer();
                const analiseCacheRenderer = new AnaliseCacheRenderer_1.AnaliseCacheRenderer();
                const analiseWebRenderer = new AnaliseWebRenderer_1.AnaliseWebRenderer();
                const analiseExternaRenderer = new AnaliseExternaRenderer_1.AnaliseExternaRenderer();
                // Agrupar por "pesquisa" usando pedido/query/item_nome
                const gruposMap = new Map();
                const norm = (s) => (typeof s === 'string' ? s : String(s || ''))
                    .trim()
                    .toLowerCase();
                const getQueryNome = (q) => {
                    if (!q)
                        return '';
                    if (typeof q === 'string')
                        return q;
                    return q.nome || q.query_sugerida || '';
                };
                const makeKeyAndTitle = (item) => {
                    const id = item?.id_item_cotacao ?? item?.id;
                    const analise = item?.llm_relatorio || item;
                    const pedido = item?.pedido;
                    const queryStr = getQueryNome(item?.query) || getQueryNome(analise?.query);
                    const itemNome = item?.item_nome;
                    const key = id != null ? `id:${id}` : norm(pedido || queryStr || itemNome || `item-${Math.random()}`);
                    const titulo = (pedido && String(pedido).trim()) || (queryStr && String(queryStr)) || (itemNome && String(itemNome)) || (id != null ? `Item ${id}` : 'Item');
                    return { key, titulo: String(titulo) };
                };
                const pushLocal = (item) => {
                    const { key, titulo } = makeKeyAndTitle(item);
                    if (!gruposMap.has(key))
                        gruposMap.set(key, { titulo, locais: [], caches: [], webs: [], externas: [] });
                    gruposMap.get(key).locais.push(item);
                };
                const pushCache = (item) => {
                    const { key, titulo } = makeKeyAndTitle(item);
                    if (!gruposMap.has(key))
                        gruposMap.set(key, { titulo, locais: [], caches: [], webs: [], externas: [] });
                    gruposMap.get(key).caches.push(item);
                };
                const pushWeb = (item) => {
                    const { key, titulo } = makeKeyAndTitle(item);
                    if (!gruposMap.has(key))
                        gruposMap.set(key, { titulo, locais: [], caches: [], webs: [], externas: [] });
                    gruposMap.get(key).webs.push(item);
                };
                const pushExterna = (item) => {
                    const { key, titulo } = makeKeyAndTitle(item);
                    if (!gruposMap.has(key))
                        gruposMap.set(key, { titulo, locais: [], caches: [], webs: [], externas: [] });
                    gruposMap.get(key).externas.push(item);
                };
                const locaisArr = Array.isArray(data.analiseLocal) ? data.analiseLocal : (data.analiseLocal ? [data.analiseLocal] : []);
                const cachesArr = Array.isArray(data.analiseCache) ? data.analiseCache : (data.analiseCache ? [data.analiseCache] : []);
                const websArr = Array.isArray(data.analiseWeb) ? data.analiseWeb : (data.analiseWeb ? [data.analiseWeb] : []);
                const externasArr = Array.isArray(data.analiseExterna) ? data.analiseExterna : (data.analiseExterna ? [data.analiseExterna] : []);
                locaisArr.forEach(pushLocal);
                cachesArr.forEach(pushCache);
                websArr.forEach(pushWeb);
                externasArr.forEach(pushExterna);
                const grupos = Array.from(gruposMap.values());
                // Renderizar cada grupo com cabeçalho da pesquisa e subseções Local/Web
                grupos.forEach((grupo) => {
                    // Nova página para cada pesquisa
                    doc.addPage();
                    const margin = doc.page.margins.left;
                    const pageWidth = doc.page.width;
                    const contentWidth = pageWidth - margin * 2;
                    // Cabeçalho da pesquisa
                    doc
                        .font('Helvetica-Bold')
                        .fontSize(14)
                        .fillColor('#003087')
                        .text(`Pesquisa: ${grupo.titulo}`, margin, doc.y);
                    doc
                        .strokeColor('#E5E7EB')
                        .lineWidth(0.5)
                        .moveTo(margin, doc.y + 8)
                        .lineTo(margin + contentWidth, doc.y + 8)
                        .stroke();
                    doc.y += 18;
                    const grupoData = {
                        ...data,
                        analiseLocal: grupo.locais,
                        analiseCache: grupo.caches,
                        analiseWeb: grupo.webs,
                        analiseExterna: grupo.externas,
                    };
                    // Sub-seção: Análise Local
                    analiseLocalRenderer.adicionarSecaoAnaliseLocal(doc, grupoData);
                    // Pequeno espaçamento/divisor entre local e cache
                    const dividerY = doc.y;
                    doc
                        .strokeColor('#E5E7EB')
                        .lineWidth(0.5)
                        .moveTo(margin, dividerY)
                        .lineTo(margin + contentWidth, dividerY)
                        .stroke();
                    doc.y += 10;
                    // Sub-seção: Análise Cache
                    analiseCacheRenderer.adicionarSecaoAnaliseCache(doc, grupoData);
                    // Divisor entre cache e web
                    const dividerY2 = doc.y;
                    doc
                        .strokeColor('#E5E7EB')
                        .lineWidth(0.5)
                        .moveTo(margin, dividerY2)
                        .lineTo(margin + contentWidth, dividerY2)
                        .stroke();
                    doc.y += 10;
                    // Sub-seção: Análise Web
                    analiseWebRenderer.adicionarSecaoAnaliseWeb(doc, grupoData);
                    // Divisor entre web e externa
                    const dividerY3File = doc.y;
                    doc
                        .strokeColor('#E5E7EB')
                        .lineWidth(0.5)
                        .moveTo(margin, dividerY3File)
                        .lineTo(margin + contentWidth, dividerY3File)
                        .stroke();
                    doc.y += 10;
                    // Sub-seção: Análise Externa (após Web)
                    analiseExternaRenderer.adicionarSecaoAnaliseExterna(doc, grupoData);
                });
                // Adicionar rodapé
                pdfGenerator.adicionarRodape();
                // Finalizar documento
                doc.end();
            }
            catch (error) {
                console.error('❌ [RELATORIO] Erro ao criar PDF buffer:', error);
                reject(error);
            }
        });
    }
    /**
     * Gera relatório completo em PDF
     */
    async gerarRelatorioCompleto(cotacaoId) {
        console.log(`📊 [RELATORIO] Iniciando geração de relatório para cotação ${cotacaoId}`);
        try {
            const data = await this.gerarDadosRelatorio(cotacaoId);
            // Gerar PDF
            const pdfPath = await this.gerarPDF(data);
            console.log(`✅ [RELATORIO] PDF gerado com sucesso: ${pdfPath}`);
            return pdfPath;
        }
        catch (error) {
            console.error('❌ [RELATORIO] Erro ao gerar relatório completo:', error);
            throw error;
        }
    }
    /**
     * Gera o arquivo PDF usando os componentes modulares
     */
    async gerarPDF(data) {
        return new Promise(async (resolve, reject) => {
            try {
                // Criar documento PDF
                const doc = new pdfkit_1.default({
                    margin: 50,
                    size: 'A4',
                    info: {
                        Title: `Relatório de Cotação ${data.cotacaoId}`,
                        Author: 'SmartQuote System',
                        Subject: 'Relatório de Análise de Cotação',
                        Keywords: 'cotação, análise, relatório, smartquote'
                    }
                });
                // Configurar caminho do arquivo
                const fileName = `relatorio_cotacao_${data.cotacaoId}_${Date.now()}.pdf`;
                const filePath = path_1.default.join(process.cwd(), 'uploads', 'relatorios', fileName);
                // Garantir que o diretório existe
                const dir = path_1.default.dirname(filePath);
                if (!fs_1.default.existsSync(dir)) {
                    fs_1.default.mkdirSync(dir, { recursive: true });
                }
                // Stream para arquivo
                const stream = fs_1.default.createWriteStream(filePath);
                doc.pipe(stream);
                // Inicializar componentes
                const pdfGenerator = new PDFGenerator_1.PDFGenerator(doc);
                // Gerar conteúdo do PDF
                pdfGenerator.adicionarCabecalho(data);
                await pdfGenerator.adicionarSecaoProposta(data);
                // Adicionar condições comerciais
                pdfGenerator.adicionarCondicoesComerciais(data);
                // Adicionar template de email (aguardando pois é assíncrono)
                await pdfGenerator.adicionarTemplateEmail(data);
                // Adicionar análises por pesquisa (query/pedido)
                const analiseLocalRenderer = new AnaliseLocalRenderer_1.AnaliseLocalRenderer();
                const analiseCacheRenderer = new AnaliseCacheRenderer_1.AnaliseCacheRenderer();
                const analiseWebRenderer = new AnaliseWebRenderer_1.AnaliseWebRenderer();
                const analiseExternaRenderer = new AnaliseExternaRenderer_1.AnaliseExternaRenderer();
                // Agrupar por "pesquisa" usando pedido/query/item_nome
                const gruposMap = new Map();
                const norm = (s) => (typeof s === 'string' ? s : String(s || ''))
                    .trim()
                    .toLowerCase();
                const getQueryNome = (q) => {
                    if (!q)
                        return '';
                    if (typeof q === 'string')
                        return q;
                    return q.nome || q.query_sugerida || '';
                };
                const makeKeyAndTitle = (item) => {
                    const id = item?.id_item_cotacao ?? item?.id;
                    const analise = item?.llm_relatorio || item;
                    const pedido = item?.pedido;
                    const queryStr = getQueryNome(item?.query) || getQueryNome(analise?.query);
                    const itemNome = item?.item_nome;
                    const key = id != null ? `id:${id}` : norm(pedido || queryStr || itemNome || `item-${Math.random()}`);
                    const titulo = (pedido && String(pedido).trim()) || (queryStr && String(queryStr)) || (itemNome && String(itemNome)) || (id != null ? `Item ${id}` : 'Item');
                    return { key, titulo: String(titulo) };
                };
                const pushLocal = (item) => {
                    const { key, titulo } = makeKeyAndTitle(item);
                    if (!gruposMap.has(key))
                        gruposMap.set(key, { titulo, locais: [], caches: [], webs: [], externas: [] });
                    gruposMap.get(key).locais.push(item);
                };
                const pushWeb = (item) => {
                    const { key, titulo } = makeKeyAndTitle(item);
                    if (!gruposMap.has(key))
                        gruposMap.set(key, { titulo, locais: [], caches: [], webs: [], externas: [] });
                    gruposMap.get(key).webs.push(item);
                };
                const pushExterna = (item) => {
                    const { key, titulo } = makeKeyAndTitle(item);
                    if (!gruposMap.has(key))
                        gruposMap.set(key, { titulo, locais: [], caches: [], webs: [], externas: [] });
                    gruposMap.get(key).externas.push(item);
                };
                const locaisArr = Array.isArray(data.analiseLocal) ? data.analiseLocal : (data.analiseLocal ? [data.analiseLocal] : []);
                const websArr = Array.isArray(data.analiseWeb) ? data.analiseWeb : (data.analiseWeb ? [data.analiseWeb] : []);
                const externasArr2 = Array.isArray(data.analiseExterna) ? data.analiseExterna : (data.analiseExterna ? [data.analiseExterna] : []);
                locaisArr.forEach(pushLocal);
                websArr.forEach(pushWeb);
                externasArr2.forEach(pushExterna);
                const grupos = Array.from(gruposMap.values());
                grupos.forEach((grupo) => {
                    // Nova página para cada pesquisa
                    doc.addPage();
                    const margin = doc.page.margins.left;
                    const pageWidth = doc.page.width;
                    const contentWidth = pageWidth - margin * 2;
                    // Cabeçalho da pesquisa
                    doc
                        .font('Helvetica-Bold')
                        .fontSize(14)
                        .fillColor('#003087')
                        .text(`Pesquisa: ${grupo.titulo}`, margin, doc.y);
                    doc
                        .strokeColor('#E5E7EB')
                        .lineWidth(0.5)
                        .moveTo(margin, doc.y + 8)
                        .lineTo(margin + contentWidth, doc.y + 8)
                        .stroke();
                    doc.y += 18;
                    const grupoData = {
                        ...data,
                        analiseLocal: grupo.locais,
                        analiseCache: grupo.caches,
                        analiseWeb: grupo.webs,
                        analiseExterna: grupo.externas,
                    };
                    analiseLocalRenderer.adicionarSecaoAnaliseLocal(doc, grupoData);
                    // Divisor
                    const dividerY = doc.y;
                    doc
                        .strokeColor('#E5E7EB')
                        .lineWidth(0.5)
                        .moveTo(margin, dividerY)
                        .lineTo(margin + contentWidth, dividerY)
                        .stroke();
                    doc.y += 10;
                    // Cache
                    analiseCacheRenderer.adicionarSecaoAnaliseCache(doc, grupoData);
                    // Divisor entre cache e web
                    const dividerY2 = doc.y;
                    doc
                        .strokeColor('#E5E7EB')
                        .lineWidth(0.5)
                        .moveTo(margin, dividerY2)
                        .lineTo(margin + contentWidth, dividerY2)
                        .stroke();
                    doc.y += 10;
                    analiseWebRenderer.adicionarSecaoAnaliseWeb(doc, grupoData);
                    // Divisor entre web e externa
                    const dividerY3 = doc.y;
                    doc
                        .strokeColor('#E5E7EB')
                        .lineWidth(0.5)
                        .moveTo(margin, dividerY3)
                        .lineTo(margin + contentWidth, dividerY3)
                        .stroke();
                    doc.y += 10;
                    // Sub-seção: Análise Externa (após Web)
                    analiseExternaRenderer.adicionarSecaoAnaliseExterna(doc, grupoData);
                });
                // Adicionar rodapé
                pdfGenerator.adicionarRodape();
                // Finalizar documento
                doc.end();
                // Aguardar conclusão
                stream.on('finish', () => {
                    console.log(`📄 [RELATORIO] PDF salvo em: ${filePath}`);
                    resolve(filePath);
                });
                stream.on('error', (error) => {
                    console.error('❌ [RELATORIO] Erro ao salvar PDF:', error);
                    reject(error);
                });
            }
            catch (error) {
                console.error('❌ [RELATORIO] Erro ao criar PDF:', error);
                reject(error);
            }
        });
    }
    /**
     * Verifica se existe relatório para uma cotação
     */
    async verificarExistenciaRelatorio(cotacaoId) {
        try {
            const { data, error } = await connect_1.default
                .from('relatorios')
                .select('id')
                .eq('cotacao_id', cotacaoId)
                .limit(1);
            if (error) {
                console.error('❌ [RELATORIO] Erro ao verificar existência:', error);
                return false;
            }
            return data && data.length > 0;
        }
        catch (error) {
            console.error('❌ [RELATORIO] Erro geral na verificação de existência:', error);
            return false;
        }
    }
}
exports.RelatorioService = RelatorioService;
exports.default = new RelatorioService();
//# sourceMappingURL=RelatorioService.js.map