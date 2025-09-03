"use strict";
/**
 * Controller para gerenciar o monitoramento de emails
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GmailMonitorService_1 = __importDefault(require("../services/GmailMonitorService"));
const GlobalEmailMonitorManager_1 = __importDefault(require("../services/GlobalEmailMonitorManager"));
class EmailMonitorController {
    gmailService;
    globalMonitor;
    constructor() {
        this.gmailService = new GmailMonitorService_1.default();
        this.globalMonitor = GlobalEmailMonitorManager_1.default.getInstance();
    }
    /**
     * Endpoint para monitorar emails novos
     */
    async monitorarEmails(req, res) {
        try {
            console.log('🔍 Iniciando monitoramento de emails via API...');
            const emails = await this.gmailService.monitorNewEmails();
            const response = {
                success: true,
                data: {
                    emailsEncontrados: emails.length,
                    emails: emails.map(email => ({
                        id: email.id,
                        de: email.from,
                        assunto: email.subject,
                        data: email.date,
                        resumo: email.snippet.substring(0, 100) + (email.snippet.length > 100 ? '...' : '')
                    }))
                },
                message: `${emails.length} emails novos encontrados e processados`
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('❌ Erro no monitoramento de emails:', error);
            const response = {
                success: false,
                error: error.message || 'Erro interno do servidor',
                message: 'Falha ao monitorar emails'
            };
            res.status(500).json(response);
        }
    }
    /**
     * Endpoint para verificar status do serviço
     */
    async statusServico(req, res) {
        try {
            // Tentar autorizar para verificar se está funcionando
            await this.gmailService.authorize();
            res.status(200).json({
                success: true,
                status: 'ativo',
                message: 'Serviço de monitoramento Gmail funcionando',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                status: 'erro',
                error: error.message,
                message: 'Serviço de monitoramento com problemas'
            });
        }
    }
    /**
     * Endpoint para limpeza de status antigos
     */
    async limparStatusAntigos(req, res) {
        try {
            const dias = parseInt(req.query.dias) || 30;
            this.gmailService.cleanOldEmailStatus(dias);
            res.status(200).json({
                success: true,
                message: `Status de emails antigos limpos (${dias} dias)`
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Erro ao limpar status antigos'
            });
        }
    }
    /**
     * Endpoint para testar a conexão com Gmail
     */
    async testarConexao(req, res) {
        try {
            console.log('🧪 Testando conexão com Gmail...');
            const auth = await this.gmailService.authorize();
            // Fazer uma chamada simples para testar
            const { google } = require('googleapis');
            const gmail = google.gmail({ version: 'v1', auth });
            const response = await gmail.users.getProfile({
                userId: 'me'
            });
            res.status(200).json({
                success: true,
                message: 'Conexão com Gmail funcionando',
                dados: {
                    email: response.data.emailAddress,
                    totalMensagens: response.data.messagesTotal,
                    totalThreads: response.data.threadsTotal
                }
            });
        }
        catch (error) {
            console.error('❌ Erro ao testar conexão:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Falha na conexão com Gmail'
            });
        }
    }
    /**
     * Endpoint para iniciar monitoramento automático
     */
    async iniciarAutoMonitoramento(req, res) {
        try {
            console.log('🚀 Iniciando auto-monitoramento via API...');
            // Usar o singleton global (que já pode estar rodando)
            if (this.globalMonitor.isMonitoringActive()) {
                res.status(200).json({
                    success: true,
                    message: 'Monitoramento automático já está ativo',
                    status: 'já_rodando',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            await this.globalMonitor.initializeAutoMonitoring();
            res.status(200).json({
                success: true,
                message: 'Monitoramento automático iniciado com sucesso',
                status: 'iniciado',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Erro ao iniciar auto-monitoramento:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Erro interno do servidor',
                message: 'Falha ao iniciar auto-monitoramento'
            });
        }
    }
    /**
     * Endpoint para parar monitoramento automático
     */
    async pararAutoMonitoramento(req, res) {
        try {
            console.log('🛑 Parando auto-monitoramento via API...');
            const result = await this.globalMonitor.stopAutoMonitoring();
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    status: 'parado',
                    timestamp: new Date().toISOString()
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        }
        catch (error) {
            console.error('❌ Erro ao parar auto-monitoramento:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Erro interno do servidor',
                message: 'Falha ao parar auto-monitoramento'
            });
        }
    }
    /**
     * Endpoint para verificar status do auto-monitoramento
     */
    async statusAutoMonitoramento(req, res) {
        try {
            const autoService = this.globalMonitor.getAutoMonitorService();
            const status = autoService.getStatus();
            res.status(200).json({
                success: true,
                data: {
                    isRunning: status.isRunning,
                    startTime: status.startTime,
                    lastCheck: status.lastCheck,
                    totalEmailsProcessed: status.totalEmailsProcessed,
                    errorCount: status.errorCount,
                    config: status.config,
                    recentEmails: status.recentEmails.slice(-5), // Últimos 5
                    recentMessages: status.messages.slice(-10), // Últimas 10 mensagens
                    globalStatus: this.globalMonitor.isMonitoringActive() ? 'ativo' : 'inativo'
                },
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Erro ao obter status:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Erro ao obter status do auto-monitoramento'
            });
        }
    }
    /**
     * Endpoint para atualizar configurações do auto-monitoramento
     */
    async atualizarConfigAutoMonitoramento(req, res) {
        try {
            const { intervalSeconds, maxEmails, enabled } = req.body;
            const config = {};
            if (intervalSeconds !== undefined)
                config.intervalSeconds = parseInt(intervalSeconds);
            if (maxEmails !== undefined)
                config.maxEmails = parseInt(maxEmails);
            if (enabled !== undefined)
                config.enabled = Boolean(enabled);
            const autoService = this.globalMonitor.getAutoMonitorService();
            await autoService.updateConfig(config);
            res.status(200).json({
                success: true,
                message: 'Configurações atualizadas',
                config: config,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Erro ao atualizar configuração:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Erro ao atualizar configurações'
            });
        }
    }
    /**
     * Endpoint para obter logs do auto-monitoramento
     */
    async logsAutoMonitoramento(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const autoService = this.globalMonitor.getAutoMonitorService();
            const status = autoService.getStatus();
            res.status(200).json({
                success: true,
                data: {
                    totalMessages: status.messages.length,
                    messages: status.messages.slice(-limit),
                    isRunning: status.isRunning,
                    lastCheck: status.lastCheck,
                    globalStatus: this.globalMonitor.isMonitoringActive() ? 'ativo' : 'inativo'
                },
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Erro ao obter logs'
            });
        }
    }
    /**
     * Endpoint para reiniciar monitoramento automático
     */
    async reiniciarAutoMonitoramento(req, res) {
        try {
            console.log('🔄 Reiniciando auto-monitoramento via API...');
            const result = await this.globalMonitor.restartAutoMonitoring();
            res.status(200).json({
                success: result.success,
                message: result.message,
                status: 'reiniciado',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Erro ao reiniciar auto-monitoramento:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Falha ao reiniciar auto-monitoramento'
            });
        }
    }
    /**
     * Endpoint para listar emails salvos
     */
    async listarEmailsSalvos(req, res) {
        try {
            const autoService = this.globalMonitor.getAutoMonitorService();
            const emailsMetadata = autoService.getSavedEmailsMetadata();
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            const paginatedEmails = emailsMetadata
                .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
                .slice(skip, skip + limit);
            res.status(200).json({
                success: true,
                data: {
                    emails: paginatedEmails,
                    pagination: {
                        page,
                        limit,
                        total: emailsMetadata.length,
                        totalPages: Math.ceil(emailsMetadata.length / limit)
                    }
                },
                message: `${paginatedEmails.length} emails salvos encontrados`,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Erro ao listar emails salvos:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Erro ao listar emails salvos'
            });
        }
    }
    /**
     * Endpoint para verificar se um email foi salvo
     */
    async verificarEmailSalvo(req, res) {
        try {
            const { emailId } = req.params;
            if (!emailId) {
                res.status(400).json({
                    success: false,
                    message: 'ID do email é obrigatório'
                });
                return;
            }
            const autoService = this.globalMonitor.getAutoMonitorService();
            const isSaved = autoService.isEmailSaved(emailId);
            res.status(200).json({
                success: true,
                data: {
                    emailId,
                    isSaved,
                    savedAt: isSaved ? autoService.getSavedEmailsMetadata().find(m => m.id === emailId)?.savedAt : null
                },
                message: isSaved ? 'Email foi salvo' : 'Email não foi salvo'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Erro ao verificar email salvo'
            });
        }
    }
    /**
     * Endpoint para limpar emails salvos antigos
     */
    async limparEmailsSalvosAntigos(req, res) {
        try {
            const daysToKeep = parseInt(req.query.days) || 30;
            const autoService = this.globalMonitor.getAutoMonitorService();
            autoService.cleanOldSavedEmails(daysToKeep);
            res.status(200).json({
                success: true,
                message: `Emails salvos com mais de ${daysToKeep} dias foram removidos`,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Erro ao limpar emails salvos:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Erro ao limpar emails salvos antigos'
            });
        }
    }
    /**
     * Endpoint de teste para simular salvamento de email
     */
    async testarSalvamentoEmail(req, res) {
        try {
            const autoService = this.globalMonitor.getAutoMonitorService();
            // Criar email de teste
            const emailTeste = {
                id: `test_${Date.now()}`,
                threadId: 'thread_test',
                snippet: 'Este é um email de teste para verificar o salvamento',
                from: 'teste@exemplo.com',
                subject: 'Email de Teste - Salvamento Automático',
                date: new Date().toISOString(),
                content: 'Este é o conteúdo completo do email de teste. Aqui podemos verificar se o sistema de salvamento está funcionando corretamente.'
            };
            // Salvar manualmente usando o EmailSaverService
            const emailSaver = autoService.getEmailSaverService();
            const result = await emailSaver.saveEmail(emailTeste, {
                saveAsJSON: true,
                includeRawData: false
            });
            res.status(200).json({
                success: true,
                message: 'Email de teste salvo com sucesso',
                data: {
                    emailId: emailTeste.id,
                    savedFormats: result.formats,
                    savedPaths: result.filePaths,
                    savedAt: result.savedAt
                },
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Erro ao testar salvamento:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Erro ao testar salvamento de email'
            });
        }
    }
}
exports.default = EmailMonitorController;
//# sourceMappingURL=EmailMonitorController.js.map