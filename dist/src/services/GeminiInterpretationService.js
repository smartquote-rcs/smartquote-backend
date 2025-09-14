"use strict";
/**
 * Serviço de interpretação de emails usando Google Gemini AI
 * Analisa o conteúdo dos emails e extrai informações estruturadas
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generative_ai_1 = require("@google/generative-ai");
const PythonInterpretationProcessor_1 = require("./PythonInterpretationProcessor");
const CotacoesItensService_1 = __importDefault(require("./CotacoesItensService"));
const WebBuscaJobService_1 = __importDefault(require("./WebBuscaJobService"));
const PromptsService_1 = __importDefault(require("./PromptsService"));
const CotacoesService_1 = __importDefault(require("./CotacoesService"));
const paths_1 = require("../utils/paths");
class GeminiInterpretationService {
    genAI;
    model;
    // Usa singleton compartilhado do processador Python
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY não encontrada nas variáveis de ambiente');
        }
        console.log(`🧠 [GEMINI] Inicializando com modelo: ${model}`);
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model });
    }
    /**
     * Interpreta o conteúdo de um email usando Gemini AI
     */
    async interpretEmail(emailData) {
        const maxRetries = 5;
        let delay = 1000; // 1s inicial
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🧠 [GEMINI] Interpretando email: ${emailData.id} (tentativa ${attempt}/${maxRetries})`);
                const prompt = this.buildPrompt();
                const context = this.buildContext(emailData);
                const result = await this.model.generateContent({
                    contents: [
                        { role: "user", parts: [{ text: context }, { text: prompt }] }
                    ],
                    generationConfig: {
                        temperature: 0.2, // saída mais determinística
                        topP: 0.9,
                        maxOutputTokens: 2050
                    }
                });
                const response = await result.response;
                const text = response.text();
                console.log(`🧠 [GEMINI] Resposta recebida para email ${emailData.id}`);
                // Parse da resposta JSON do Gemini
                const interpretation = this.parseGeminiResponse(text, emailData);
                interpretation.dados_bruto = emailData;
                // Salvar interpretação apenas se for classificado como "pedido"
                if (interpretation.tipo === 'pedido') {
                    await this.saveInterpretation(interpretation);
                    console.log(`💾 [GEMINI] Interpretação salva para pedido ${emailData.id}`);
                }
                else {
                    console.log(`📄 [GEMINI] Interpretação não salva - tipo: ${interpretation.tipo}`);
                }
                console.log(`✅ [GEMINI] Email ${emailData.id} interpretado com sucesso`);
                return interpretation;
            }
            catch (error) {
                console.error(`❌ [GEMINI] Erro na tentativa ${attempt} para email ${emailData.id}:`, error.message);
                // Se for erro 503 (sobrecarga), tenta de novo com backoff
                if (error.message.includes("503") && attempt < maxRetries) {
                    console.warn(`⚠️ [GEMINI] Modelo sobrecarregado. Retentando em ${delay}ms...`);
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2; // aumenta o tempo (backoff exponencial)
                    continue;
                }
                // Se for erro diferente OU acabou as tentativas → retorna fallback
                return this.createFallbackInterpretation(emailData, error.message);
            }
        }
        // Se sair do loop sem sucesso, retorna fallback genérico
        return this.createFallbackInterpretation(emailData, "Máximo de tentativas excedido.");
    }
    /**
     * Constrói o prompt para o Gemini AI
     */
    buildPrompt() {
        return `
Você é um assistente especializado em análise de emails comerciais. Sua tarefa é retornar EXCLUSIVAMENTE um JSON válido e completo, compatível com o schema definido abaixo. Não adicione comentários, explicações ou formatação Markdown.

---

CONTEXTO DA EMPRESA:
Oferecemos soluções em IT Hardware, Automação de Postos, Software, Cloud, Cibersegurança, Realidade Virtual (VR), Internet das Coisas (IoT), Hospitais Inteligentes, Quiosques Self-Service, Business Intelligence (BI), KYC-AML, CCTV e Controle de Acesso.

---

INSTRUÇÕES:
1. Classifique o email:
  - "pedido": somente se o email solicitar (explícita ou implicitamente) serviços ou produtos claramente relacionados ao CONTEXTO DA EMPRESA listado acima.
  - "outro": em qualquer outro caso, mesmo que seja um pedido de produtos fora do contexto (ex.: comida, roupas, viagens etc.).
2. Defina a prioridade: baixa, média, alta ou urgente.
3. A solicitação que foi feita, escreva na primeira pessoa.
4. Extraia os dados disponíveis do cliente/remetente (nome, empresa, email, telefone, website, localização).
5. Atribua um nível de confiança (0–100%).

---

RESPOSTA (JSON):
{
  "tipo": "string",
  "prioridade": "string", 
  "solicitacao": "string",
  "cliente": {
    "nome": "string",
    "empresa": "string",
    "email": "string",
    "telefone": "string",
    "website": "string",
    "localizacao": "string"
  },
  "confianca": number
}
`;
    }
    buildContext(emailData) {
        return `
DADOS DO EMAIL:
- De: ${emailData.from}
- Assunto: ${emailData.subject}
- Data: ${emailData.date}
- Conteúdo: ${emailData.content}

---
`;
    }
    /**
     * Parse da resposta do Gemini AI
     */
    parseGeminiResponse(response, emailData) {
        try {
            // Limpar resposta e extrair JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('JSON não encontrado na resposta');
            }
            const parsedResponse = JSON.parse(jsonMatch[0]);
            return {
                id: this.generateInterpretationId(),
                emailId: emailData.id,
                tipo: parsedResponse.tipo || 'outro',
                prioridade: parsedResponse.prioridade || 'media',
                solicitacao: parsedResponse.solicitacao || [],
                cliente: parsedResponse.cliente || {},
                confianca: parsedResponse.confianca || 50,
                interpretedAt: new Date().toISOString(),
                rawGeminiResponse: response
            };
        }
        catch (error) {
            console.error('❌ [GEMINI] Erro ao fazer parse da resposta:', error);
            return this.createFallbackInterpretation(emailData, `Parse error: ${error}`);
        }
    }
    /**
     * Cria interpretação básica em caso de erro
     */
    createFallbackInterpretation(emailData, errorMessage) {
        return {
            id: this.generateInterpretationId(),
            emailId: emailData.id,
            tipo: 'outro',
            prioridade: 'media',
            solicitacao: '',
            cliente: {
                email: emailData.from
            },
            confianca: 0,
            interpretedAt: new Date().toISOString(),
            rawGeminiResponse: `ERROR: ${errorMessage}`
        };
    }
    /**
     * Salva a interpretação em arquivo JSON e processa com Python
     */
    async saveInterpretation(interpretation) {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const interpretationsDir = (0, paths_1.getDataPath)('interpretations');
            // Criar diretório se não existir
            try {
                (0, paths_1.ensureDir)(interpretationsDir);
            }
            catch (error) {
                // Diretório já existe
            }
            const filename = `${interpretation.interpretedAt.split('T')[0]}_${interpretation.id}_${interpretation.emailId}.json`;
            const filepath = path.join(interpretationsDir, filename);
            await fs.writeFile(filepath, JSON.stringify(interpretation, null, 2), 'utf8');
            console.log(`💾 [GEMINI] Interpretação salva: ${filename}`);
            // 🐍 PROCESSAR COM PYTHON EM PROCESSO FILHO
            console.log(`🐍 [GEMINI] Iniciando processamento Python para interpretação ${interpretation.id}`);
            // Executar processamento Python de forma assíncrona (não bloquear)
            PythonInterpretationProcessor_1.pythonProcessor.processInterpretation(interpretation)
                .then((result) => {
                if (result.success) {
                    console.log(`✅ [PYTHON-SUCCESS] Interpretação ${interpretation.id} processada em ${result.executionTime}ms`);
                    console.log(`📄 [PYTHON-RESULT]`, result.result);
                    // 🌐 Fluxo adicional: buscar na web itens faltantes e inserir na cotação principal
                    (async () => {
                        const payload = result.result || {};
                        let cotacaoPrincipalId = payload?.cotacoes?.principal_id ?? null;
                        try {
                            // Fonte da verdade agora: placeholders em cotacoes_itens (status=false)
                            // Não dependemos mais de payload.faltantes para a busca web
                            let faltantes = [];
                            let cotacaoCriadaLocalmente = false;
                            // 1. Se já existe cotação principal, carregar placeholders pendentes
                            if (cotacaoPrincipalId) {
                                try {
                                    const placeholdersDB = await CotacoesItensService_1.default.listPlaceholders(Number(cotacaoPrincipalId));
                                    if (placeholdersDB.length > 0) {
                                        faltantes = placeholdersDB.map((p) => ({
                                            id: p.id,
                                            item_id: p.id,
                                            nome: p.item_nome,
                                            quantidade: p.quantidade,
                                            query_sugerida: p.pedido,
                                            categoria: 'Geral'
                                        }));
                                        console.log(`🔄 [GEMINI-WEB] Carregados ${faltantes.length} placeholders (faltantes) do BD para busca web`);
                                    }
                                    else {
                                        console.log('ℹ️ [GEMINI-WEB] Nenhum placeholder pendente encontrado na cotação existente');
                                    }
                                }
                                catch (e) {
                                    console.warn('⚠️ [GEMINI-WEB] Falha ao carregar placeholders existentes:', e?.message || e);
                                }
                            }
                            // 2. Se não existe cotação ainda, criá-la e gerar placeholders a partir de dados_extraidos / itens_a_comprar
                            if (!cotacaoPrincipalId) {
                                const itensFonte = (payload?.dados_extraidos?.itens_a_comprar && Array.isArray(payload.dados_extraidos.itens_a_comprar))
                                    ? payload.dados_extraidos.itens_a_comprar
                                    : (Array.isArray(payload.faltantes) ? payload.faltantes : []); // fallback legado apenas para criar placeholders
                                const faltantesBase = itensFonte.map((f) => ({
                                    nome: f.nome || f.item_nome || 'Item não especificado',
                                    categoria: f.categoria || 'Geral',
                                    quantidade: f.quantidade || 1,
                                    prioridade: f.prioridade || 'media'
                                }));
                                if (faltantesBase.length > 0) {
                                    const dadosExtraidos = payload?.dados_extraidos || {
                                        solucao_principal: interpretation.solicitacao,
                                        tipo_de_solucao: 'sistema',
                                        itens_a_comprar: faltantesBase
                                    };
                                    const prompt = await PromptsService_1.default.create({
                                        texto_original: interpretation.solicitacao,
                                        dados_extraidos: dadosExtraidos,
                                        cliente: interpretation.cliente || {},
                                        dados_bruto: interpretation.dados_bruto || {},
                                        origem: { tipo: 'servico', fonte: 'email' },
                                        status: 'analizado'
                                    });
                                    if (prompt.id) {
                                        const nova = {
                                            prompt_id: prompt.id,
                                            status: 'incompleta',
                                            aprovacao: false,
                                            orcamento_geral: 0
                                        };
                                        try {
                                            const criada = await CotacoesService_1.default.create(nova);
                                            cotacaoPrincipalId = criada?.id ?? null;
                                            cotacaoCriadaLocalmente = !!cotacaoPrincipalId;
                                            console.log(`✅ [GEMINI-WEB] Cotação criada (ID ${cotacaoPrincipalId}) para placeholders iniciais`);
                                        }
                                        catch (e) {
                                            console.error('❌ [GEMINI-WEB] Erro ao criar cotação principal:', e?.message || e);
                                        }
                                    }
                                    // Inserir placeholders se criamos a cotação agora
                                    if (cotacaoCriadaLocalmente && cotacaoPrincipalId) {
                                        for (const f of faltantesBase) {
                                            try {
                                                await CotacoesItensService_1.default.insertPlaceholderItem(Number(cotacaoPrincipalId), f);
                                            }
                                            catch (e) {
                                                console.warn('⚠️ [GEMINI-WEB] Falha ao inserir placeholder:', e?.message || e);
                                            }
                                        }
                                        console.log(`🧩 [GEMINI-WEB] ${faltantesBase.length} placeholders inseridos na cotação ${cotacaoPrincipalId}`);
                                        // Recarregar para montar objeto faltantes uniforme
                                        try {
                                            const placeholdersDB = await CotacoesItensService_1.default.listPlaceholders(Number(cotacaoPrincipalId));
                                            faltantes = placeholdersDB.map((p) => ({
                                                id: p.id,
                                                item_id: p.id,
                                                nome: p.item_nome,
                                                quantidade: p.quantidade,
                                                query_sugerida: p.pedido,
                                                categoria: 'Geral'
                                            }));
                                        }
                                        catch { }
                                    }
                                }
                                else {
                                    console.log('ℹ️ [GEMINI-WEB] Nenhum item base para criar cotação/placeholder; busca web será ignorada');
                                }
                            }
                            // 3. Executar busca web somente se houver faltantes (placeholders) atuais
                            if (faltantes.length > 0) {
                                console.log(`🌐 [GEMINI-WEB] Iniciando busca web para ${faltantes.length} faltantes (placeholders)`);
                                const svc = new WebBuscaJobService_1.default();
                                const { resultadosCompletos, produtosWeb } = await svc.createJobsForFaltantesWithReforco(faltantes, interpretation.solicitacao, true);
                                console.log(`🧠 [LLM-FILTER] ${produtosWeb.length} produtos retornados dos jobs web`);
                                // 4. Inserir resultados dos jobs na cotação (cumprindo placeholders)
                                if (cotacaoPrincipalId) {
                                    try {
                                        const inseridos = await svc.insertJobResultsInCotacao(Number(cotacaoPrincipalId), resultadosCompletos);
                                        const total = await svc.recalcOrcamento(Number(cotacaoPrincipalId));
                                        console.log(`🧮 [GEMINI-WEB] Orçamento recalculado: ${total} (itens web inseridos: ${inseridos})`);
                                    }
                                    catch (e) {
                                        console.error('❌ [GEMINI-WEB] Erro ao inserir resultados web na cotação:', e?.message || e);
                                    }
                                }
                                else {
                                    console.log('⚠️ [GEMINI-WEB] Resultados web obtidos mas sem cotação para inserir');
                                }
                            }
                            else {
                                console.log('ℹ️ [GEMINI-WEB] Nenhum faltante (placeholder) disponível para busca web. Etapa ignorada.');
                            }
                        }
                        catch (e) {
                            console.error('❌ [BUSCA-WEB] Falha no fluxo pós-Python:', e?.message || e);
                        }
                    })();
                }
                else {
                    console.error(`❌ [PYTHON-ERROR] Falha ao processar interpretação ${interpretation.id}: ${result.error}`);
                }
            })
                .catch((error) => {
                console.error(`❌ [PYTHON-CRITICAL] Erro crítico no processamento Python: ${error}`);
            });
        }
        catch (error) {
            console.error('❌ [GEMINI] Erro ao salvar interpretação:', error);
        }
    }
    /**
     * Gera ID único para interpretação
     */
    generateInterpretationId() {
        return `interp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Lista interpretações salvas
     */
    async listInterpretations() {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const interpretationsDir = (0, paths_1.getDataPath)('interpretations');
            try {
                const files = await fs.readdir(interpretationsDir);
                const jsonFiles = files.filter(file => file.endsWith('.json'));
                const interpretations = [];
                for (const file of jsonFiles) {
                    const filepath = path.join(interpretationsDir, file);
                    const content = await fs.readFile(filepath, 'utf8');
                    const interpretation = JSON.parse(content);
                    interpretations.push(interpretation);
                }
                // Ordenar por data de interpretação (mais recente primeiro)
                return interpretations.sort((a, b) => new Date(b.interpretedAt).getTime() - new Date(a.interpretedAt).getTime());
            }
            catch (error) {
                console.log('📁 [GEMINI] Nenhuma interpretação encontrada');
                return [];
            }
        }
        catch (error) {
            console.error('❌ [GEMINI] Erro ao listar interpretações:', error);
            return [];
        }
    }
    /**
     * Busca interpretação por email ID
     */
    async getInterpretationByEmailId(emailId) {
        try {
            const interpretations = await this.listInterpretations();
            return interpretations.find(interp => interp.emailId === emailId) || null;
        }
        catch (error) {
            console.error('❌ [GEMINI] Erro ao buscar interpretação:', error);
            return null;
        }
    }
    /**
     * Reformula um email usando Gemini AI com base em um prompt de modificação
     */
    async gerarTemplateEmailTextoIA(relatorioData, emailOriginal, promptModificacao) {
        const maxRetries = 5;
        let delay = 1000; // 1s inicial
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🧠 [GEMINI-EMAIL] Reformulando email (tentativa ${attempt}/${maxRetries})`);
                const prompt = this.buildEmailReformulationPrompt(promptModificacao);
                const context = this.buildEmailReformulationContext(relatorioData, emailOriginal);
                const result = await this.model.generateContent({
                    contents: [
                        { role: "user", parts: [{ text: context }, { text: prompt }] }
                    ],
                    generationConfig: {
                        temperature: 0.3, // Um pouco mais criativo que interpretação
                        topP: 0.9,
                        maxOutputTokens: 3000
                    }
                });
                const response = await result.response;
                const text = response.text();
                console.log(`🧠 [GEMINI-EMAIL] Resposta recebida para reformulação`);
                // Parse da resposta do Gemini
                const reformulationResult = this.parseEmailReformulationResponse(text, emailOriginal, promptModificacao);
                console.log(`✅ [GEMINI-EMAIL] Email reformulado com sucesso`);
                return reformulationResult;
            }
            catch (error) {
                console.error(`❌ [GEMINI-EMAIL] Erro na tentativa ${attempt}:`, error.message);
                // Se for erro 503 (sobrecarga), tenta de novo com backoff
                if (error.message.includes("503") && attempt < maxRetries) {
                    console.warn(`⚠️ [GEMINI-EMAIL] Modelo sobrecarregado. Retentando em ${delay}ms...`);
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2; // aumenta o tempo (backoff exponencial)
                    continue;
                }
                // Se for erro diferente OU acabou as tentativas → retorna fallback
                return this.createFallbackEmailReformulation(emailOriginal, promptModificacao, error.message);
            }
        }
        // Se sair do loop sem sucesso, retorna fallback genérico
        return this.createFallbackEmailReformulation(emailOriginal, promptModificacao, "Máximo de tentativas excedido.");
    }
    /**
     * Constrói o prompt para reformulação de email
     */
    buildEmailReformulationPrompt(promptModificacao) {
        return `
Você é um assistente especializado em reformulação de emails comerciais. Sua tarefa é modificar o email fornecido seguindo as instruções específicas do usuário.

---

INSTRUÇÕES DE REFORMULAÇÃO:
${promptModificacao}

---

DIRETRIZES GERAIS:
1. Mantenha o tom profissional e comercial
2. Preserve informações técnicas importantes (valores, prazos, especificações)
3. Adapte o estilo conforme solicitado, mas mantenha a clareza
4. Se necessário, reorganize a estrutura do email para melhor fluxo
5. Mantenha a assinatura e informações de contato

---

RESPOSTA:
Retorne APENAS o email reformulado, sem comentários adicionais ou formatação Markdown.
Mantenha toda a estrutura necessária do email original, aplicando apenas as modificações solicitadas.
`;
    }
    /**
     * Constrói o contexto para reformulação de email
     */
    buildEmailReformulationContext(relatorioData, emailOriginal) {
        const totalAnalises = relatorioData.analiseLocal.length + relatorioData.analiseWeb.length;
        const valorTotal = relatorioData.orcamentoGeral.toLocaleString('pt-AO', {
            style: 'currency',
            currency: 'AOA',
            minimumFractionDigits: 2
        });
        // Extrair informações dos itens escolhidos
        const itensEscolhidos = this.extractSelectedItems(relatorioData);
        // Extrair dados do cliente de forma estruturada
        const dadosCliente = this.formatClientData(relatorioData.cliente);
        return `
DADOS DO RELATÓRIO:
- ID da Cotação: ${relatorioData.cotacaoId}
- Valor Total: ${valorTotal}
- Total de Análises: ${totalAnalises}
- Análises Locais: ${relatorioData.analiseLocal.length}
- Análises Web: ${relatorioData.analiseWeb.length}

SOLICITAÇÃO ORIGINAL:
${relatorioData.solicitacao}

DADOS DO CLIENTE:
${dadosCliente}

ITENS PRINCIPAIS ESCOLHIDOS:
${itensEscolhidos}

---

EMAIL ORIGINAL A SER REFORMULADO:
${emailOriginal}

---
`;
    }
    /**
     * Extrai os itens principais escolhidos das análises
     */
    extractSelectedItems(relatorioData) {
        const itens = [];
        // Itens das análises locais
        relatorioData.analiseLocal.forEach((analise, index) => {
            if (analise.llm_relatorio?.escolha_principal) {
                const topItem = analise.llm_relatorio.top_ranking?.[0];
                if (topItem) {
                    itens.push(`• ${analise.llm_relatorio.escolha_principal} - ${topItem.preco} (Análise Local ${index + 1})`);
                }
                else {
                    itens.push(`• ${analise.llm_relatorio.escolha_principal} (Análise Local ${index + 1})`);
                }
            }
        });
        // Itens das análises web
        relatorioData.analiseWeb.forEach((analise, index) => {
            if (analise.escolha_principal) {
                const topItem = analise.top_ranking?.[0];
                if (topItem) {
                    itens.push(`• ${analise.escolha_principal} - ${topItem.preco} (Busca Web: ${analise.query.nome})`);
                }
                else {
                    itens.push(`• ${analise.escolha_principal} (Busca Web: ${analise.query.nome})`);
                }
            }
            else if (analise.top_ranking?.[0]) {
                const topItem = analise.top_ranking[0];
                itens.push(`• ${topItem.nome} - ${topItem.preco} (Busca Web: ${analise.query.nome})`);
            }
        });
        return itens.length > 0 ? itens.join('\n') : '• Nenhum item específico selecionado';
    }
    /**
     * Formata os dados do cliente de forma estruturada
     */
    formatClientData(cliente) {
        if (!cliente || typeof cliente !== 'object') {
            return '• Dados do cliente não disponíveis';
        }
        const dados = [];
        if (cliente.nome)
            dados.push(`• Nome: ${cliente.nome}`);
        if (cliente.empresa)
            dados.push(`• Empresa: ${cliente.empresa}`);
        if (cliente.email)
            dados.push(`• Email: ${cliente.email}`);
        if (cliente.telefone)
            dados.push(`• Telefone: ${cliente.telefone}`);
        if (cliente.localizacao)
            dados.push(`• Localização: ${cliente.localizacao}`);
        if (cliente.website)
            dados.push(`• Website: ${cliente.website}`);
        return dados.length > 0 ? dados.join('\n') : '• Dados do cliente não especificados';
    }
    /**
     * Parse da resposta de reformulação do Gemini AI
     */
    parseEmailReformulationResponse(response, emailOriginal, prompt) {
        try {
            // Limpar resposta removendo possível formatação markdown
            const cleanedResponse = response
                .replace(/```[\s\S]*?\n/g, '') // Remove abertura de code blocks
                .replace(/\n```/g, '') // Remove fechamento de code blocks
                .trim();
            // Calcular confiança baseada no tamanho e qualidade da resposta
            let confidence = 85;
            if (cleanedResponse.length < emailOriginal.length * 0.5) {
                confidence = 60; // Resposta muito curta
            }
            else if (cleanedResponse.length > emailOriginal.length * 2) {
                confidence = 70; // Resposta muito longa
            }
            return {
                originalEmail: emailOriginal,
                reformulatedEmail: cleanedResponse,
                prompt: prompt,
                confidence: confidence,
                processedAt: new Date().toISOString(),
                rawGeminiResponse: response
            };
        }
        catch (error) {
            console.error('❌ [GEMINI-EMAIL] Erro ao fazer parse da resposta:', error);
            return this.createFallbackEmailReformulation(emailOriginal, prompt, `Parse error: ${error}`);
        }
    }
    /**
     * Cria resultado de reformulação básico em caso de erro
     */
    createFallbackEmailReformulation(emailOriginal, prompt, errorMessage) {
        return {
            originalEmail: emailOriginal,
            reformulatedEmail: emailOriginal, // Retorna o email original em caso de erro
            prompt: prompt,
            confidence: 0,
            processedAt: new Date().toISOString(),
            rawGeminiResponse: `ERROR: ${errorMessage}`
        };
    }
}
exports.default = GeminiInterpretationService;
//# sourceMappingURL=GeminiInterpretationService.js.map