"use strict";
/**
 * Controller para gerenciar interpretações de emails via Gemini AI
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiController = void 0;
const GeminiInterpretationService_1 = __importDefault(require("../services/GeminiInterpretationService"));
const GlobalEmailMonitorManager_1 = __importDefault(require("../services/GlobalEmailMonitorManager"));
class GeminiController {
    geminiService;
    constructor() {
        this.geminiService = new GeminiInterpretationService_1.default();
    }
    /**
     * Lista todas as interpretações de emails
     */
    async listarInterpretacoes(req, res) {
        try {
            console.log('📋 [API] Listando interpretações de emails...');
            const interpretations = await this.geminiService.listInterpretations();
            return res.status(200).json({
                success: true,
                message: `${interpretations.length} interpretação(ões) encontrada(s)`,
                data: interpretations,
                count: interpretations.length
            });
        }
        catch (error) {
            console.error('❌ [API] Erro ao listar interpretações:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }
    /**
     * Busca interpretação de um email específico
     */
    async buscarInterpretacaoPorEmail(req, res) {
        try {
            const { emailId } = req.params;
            if (!emailId) {
                return res.status(400).json({
                    success: false,
                    message: 'Email ID é obrigatório'
                });
            }
            console.log(`🔍 [API] Buscando interpretação para email: ${emailId}`);
            const interpretation = await this.geminiService.getInterpretationByEmailId(emailId);
            if (!interpretation) {
                return res.status(404).json({
                    success: false,
                    message: `Interpretação não encontrada para email: ${emailId}`
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Interpretação encontrada',
                data: interpretation
            });
        }
        catch (error) {
            console.error('❌ [API] Erro ao buscar interpretação:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }
    /**
     * Força a interpretação de um email específico
     */
    async interpretarEmail(req, res) {
        try {
            const { emailId } = req.params;
            if (!emailId) {
                return res.status(400).json({
                    success: false,
                    message: 'Email ID é obrigatório'
                });
            }
            console.log(`🧠 [API] Forçando interpretação do email: ${emailId}`);
            // Buscar dados do email salvo
            const emailSaver = GlobalEmailMonitorManager_1.default.getInstance().getEmailSaverService();
            const savedEmails = emailSaver.getSavedEmailsMetadata();
            const emailMetadata = savedEmails.find((email) => email.id === emailId);
            if (!emailMetadata) {
                return res.status(404).json({
                    success: false,
                    message: `Email ${emailId} não encontrado nos arquivos salvos`
                });
            }
            // Carregar dados completos do email
            const emailData = emailSaver.loadEmailFromFile(emailId);
            if (!emailData) {
                return res.status(404).json({
                    success: false,
                    message: `Dados do email ${emailId} não puderam ser carregados`
                });
            }
            // Interpretar com Gemini
            const interpretation = await this.geminiService.interpretEmail(emailData);
            return res.status(200).json({
                success: true,
                message: 'Email interpretado com sucesso',
                data: interpretation
            });
        }
        catch (error) {
            console.error('❌ [API] Erro ao interpretar email:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }
    /**
     * Endpoint de teste para verificar conexão com Gemini
     */
    async testarGemini(req, res) {
        try {
            console.log('🧪 [API] Testando conexão com Gemini AI...');
            const testEmailData = {
                id: 'test_gemini_connection',
                from: 'teste@exemplo.com',
                subject: 'Teste de Conexão Gemini',
                content: 'Este é um email de teste para verificar a conexão com o Gemini AI.',
                date: new Date().toISOString()
            };
            const interpretation = await this.geminiService.interpretEmail(testEmailData);
            return res.status(200).json({
                success: true,
                message: 'Conexão com Gemini AI funcionando',
                data: {
                    gemini_connected: true,
                    test_interpretation: interpretation,
                    confidence: interpretation.confianca
                }
            });
        }
        catch (error) {
            console.error('❌ [API] Erro no teste do Gemini:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Erro na conexão com Gemini AI',
                error: error.message,
                gemini_connected: false
            });
        }
    }
    /**
     * Obtém estatísticas das interpretações
     */
    async obterEstatisticas(req, res) {
        try {
            console.log('📊 [API] Calculando estatísticas das interpretações...');
            const interpretations = await this.geminiService.listInterpretations();
            if (interpretations.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Nenhuma interpretação encontrada',
                    data: {
                        total: 0,
                        tipos: {},
                        prioridades: {},
                        confianca_media: 0,
                        produtos_total: 0
                    }
                });
            }
            // Calcular estatísticas
            const stats = {
                total: interpretations.length,
                tipos: {},
                prioridades: {},
                confianca_media: 0,
                pedidos: 0,
                tamanho_medio_solicitacao: 0
            };
            let confiancaTotal = 0;
            let totalTamanhoSolic = 0;
            interpretations.forEach(interp => {
                // Contar tipos
                stats.tipos[interp.tipo] = (stats.tipos[interp.tipo] || 0) + 1;
                // Contar prioridades
                stats.prioridades[interp.prioridade] = (stats.prioridades[interp.prioridade] || 0) + 1;
                // Somar confiança
                confiancaTotal += interp.confianca;
                // Contar pedidos
                if (interp.tipo === 'pedido') {
                    stats.pedidos++;
                }
                // Somar tamanho de solicitações
                if (typeof interp.solicitacao === 'string') {
                    totalTamanhoSolic += interp.solicitacao.length;
                }
            });
            stats.confianca_media = Math.round(confiancaTotal / interpretations.length);
            stats.tamanho_medio_solicitacao = interpretations.length > 0 ? Math.round(totalTamanhoSolic / interpretations.length) : 0;
            return res.status(200).json({
                success: true,
                message: 'Estatísticas calculadas com sucesso',
                data: stats
            });
        }
        catch (error) {
            console.error('❌ [API] Erro ao calcular estatísticas:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }
}
exports.GeminiController = GeminiController;
exports.default = GeminiController;
//# sourceMappingURL=GeminiController.js.map