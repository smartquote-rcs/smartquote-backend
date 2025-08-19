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
const BuscaAtomatica_1 = require("./BuscaAtomatica");
const FornecedorService_1 = __importDefault(require("./FornecedorService"));
const CotacoesItensService_1 = __importDefault(require("./CotacoesItensService"));
const connect_1 = __importDefault(require("../infra/supabase/connect"));
const PromptsService_1 = __importDefault(require("./PromptsService"));
const CotacoesService_1 = __importDefault(require("./CotacoesService"));
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
        try {
            console.log(`🧠 [GEMINI] Interpretando email: ${emailData.id}`);
            const prompt = this.buildPrompt(emailData);
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log(`🧠 [GEMINI] Resposta recebida para email ${emailData.id}`);
            // Parse da resposta JSON do Gemini
            const interpretation = this.parseGeminiResponse(text, emailData);
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
            console.error(`❌ [GEMINI] Erro ao interpretar email ${emailData.id}:`, error.message);
            // Retornar interpretação básica em caso de erro
            return this.createFallbackInterpretation(emailData, error.message);
        }
    }
    /**
     * Constrói o prompt para o Gemini AI
     */
    buildPrompt(emailData) {
        return `
Você é um assistente especializado em análise de emails comerciais. Analise o email abaixo e extraia informações estruturadas.

Seu objetivo é retornar EXCLUSIVAMENTE um json válido e completo, compatível com o schema abaixo. Não adicione comentários nem formatação Markdown.

---

CONTEXTO DA EMPRESA:
Oferecemos soluções em: IT Hardware, Automação de Postos, Software, Cloud, Cibersegurança, Realidade Virtual (VR), Internet das Coisas (IoT), Hospitais Inteligentes, Quiosques Self-Service, Business Intelligence (BI), KYC-AML, CCTV, Controle de Acesso.

        ---
DADOS DO EMAIL:
- De: ${emailData.from}
- Assunto: ${emailData.subject}
- Data: ${emailData.date}
- Conteúdo: ${emailData.content}

INSTRUÇÕES:
1. Identifique o tipo de email: caso seja um pedido de serviço ou produtos relacionados aos nossos serviços, mesmo que seja implícito, classifique como "pedido", caso contrário, "outro".
2. Determine a prioridade (baixa, media, alta, urgente)
3. A solicitação que foi feita, só reformule em uma frase clara e objetiva sem omitir informações, escreva na primeira pessoa.
4. Identifique dados do cliente/remetente
5. Avalie sua confiança na análise (0-100%)

RESPOSTA EM JSON:
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

Responda APENAS com o JSON válido, sem texto adicional.
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
            const interpretationsDir = path.join(process.cwd(), 'src/data/interpretations');
            // Criar diretório se não existir
            try {
                await fs.mkdir(interpretationsDir, { recursive: true });
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
                        try {
                            const payload = result.result || {};
                            const faltantes = Array.isArray(payload.faltantes) ? payload.faltantes : [];
                            let cotacaoPrincipalId = payload?.cotacoes?.principal_id ?? null;
                            const fornecedores = await FornecedorService_1.default.getFornecedoresAtivos();
                            const sites = fornecedores.map((f) => f.url).filter(Boolean);
                            if (!sites.length)
                                return;
                            const cfg = await FornecedorService_1.default.getConfiguracoesSistema();
                            const numPorSite = cfg?.numResultadosPorSite ?? 5;
                            const busca = new BuscaAtomatica_1.BuscaAutomatica();
                            const promessas = faltantes.map((f) => busca.buscarProdutosMultiplosSites(f.query_sugerida || interpretation.solicitacao, sites, numPorSite));
                            const resultados = await Promise.all(promessas);
                            // Combinar todos os produtos
                            const produtosWeb = resultados.reduce((acc, arr) => {
                                const produtos = (new BuscaAtomatica_1.BuscaAutomatica()).combinarResultados(arr);
                                acc.push(...produtos);
                                return acc;
                            }, []);
                            // Se não há cotação principal ainda, criar uma para receber itens/faltantes
                            if (!cotacaoPrincipalId && (produtosWeb.length > 0 || faltantes.length > 0)) {
                                // Usar dados extraídos do Python se disponível, senão criar estrutura mínima
                                const dadosExtraidos = payload?.dados_extraidos || {
                                    solucao_principal: interpretation.solicitacao,
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
                                    texto_original: interpretation.solicitacao,
                                    dados_extraidos: dadosExtraidos,
                                    origem: { tipo: 'servico', fonte: 'email' },
                                    status: 'analizado',
                                });
                                if (promptId) {
                                    const nova = {
                                        prompt_id: promptId,
                                        status: 'incompleta',
                                        faltantes: faltantes?.length ? faltantes : [],
                                        orcamento_geral: 0,
                                    };
                                    try {
                                        const criada = await CotacoesService_1.default.create(nova);
                                        cotacaoPrincipalId = criada?.id ?? null;
                                    }
                                    catch (e) {
                                        console.error('❌ [COTACAO] Erro ao criar cotação principal:', e?.message || e);
                                    }
                                }
                            }
                            // Inserir itens web na cotação principal
                            let inseridos = 0;
                            if (cotacaoPrincipalId) {
                                for (const p of produtosWeb) {
                                    try {
                                        const idItem = await CotacoesItensService_1.default.insertWebItem(Number(cotacaoPrincipalId), p);
                                        if (idItem)
                                            inseridos++;
                                    }
                                    catch (e) {
                                        console.error('❌ [COTACAO-ITEM] Erro ao inserir item web:', e?.message || e);
                                    }
                                }
                            }
                            // Recalcular orçamento geral
                            try {
                                if (!cotacaoPrincipalId)
                                    return;
                                const { data: itens, error } = await connect_1.default
                                    .from('cotacoes_itens')
                                    .select('item_preco, quantidade')
                                    .eq('cotacao_id', Number(cotacaoPrincipalId));
                                if (!error && Array.isArray(itens)) {
                                    let total = 0;
                                    for (const it of itens) {
                                        const preco = parseFloat(String(it.item_preco ?? 0));
                                        const qtd = parseInt(String(it.quantidade ?? 1));
                                        if (!isNaN(preco) && !isNaN(qtd))
                                            total += preco * qtd;
                                    }
                                    await connect_1.default.from('cotacoes').update({ orcamento_geral: total }).eq('id', Number(cotacaoPrincipalId));
                                    console.log(`🧮 [COTACAO] Orçamento recalculado: ${total} (itens web inseridos: ${inseridos})`);
                                }
                            }
                            catch { }
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
            const interpretationsDir = path.join(process.cwd(), 'src/data/interpretations');
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
}
exports.default = GeminiInterpretationService;
//# sourceMappingURL=GeminiInterpretationService.js.map