"use strict";
/**
 * Singleton para gerenciar o monitoramento automático globalmente
 * Inicia automaticamente quando o servidor sobe
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AutoEmailMonitorService_1 = __importDefault(require("./AutoEmailMonitorService"));
class GlobalEmailMonitorManager {
    static instance;
    autoMonitorService;
    isInitialized = false;
    constructor() {
        this.autoMonitorService = new AutoEmailMonitorService_1.default();
        this.setupGlobalCallbacks();
    }
    /**
     * Singleton pattern - retorna única instância
     */
    static getInstance() {
        if (!GlobalEmailMonitorManager.instance) {
            GlobalEmailMonitorManager.instance = new GlobalEmailMonitorManager();
        }
        return GlobalEmailMonitorManager.instance;
    }
    /**
     * Configura callbacks globais para emails detectados
     */
    setupGlobalCallbacks() {
        this.autoMonitorService.onEmailDetected('global', (emailData) => {
            console.log(`🌍 [GLOBAL] Email detectado: ${emailData.subject} de ${emailData.from}`);
            // Aqui você pode integrar com:
            // - Etapa 2: Salvar em PDF/JSON
            // - Etapa 3: Análise com IA
            // - Etapa 4: Salvar na tabela prompts
            // - Etapa 5: Notificações do sistema
            this.processNewEmail(emailData);
        });
    }
    /**
     * Processa email novo detectado (preparado para próximas etapas)
     */
    processNewEmail(emailData) {
        console.log(`📝 [PROCESSAR] Iniciando processamento do email: ${emailData.emailId}`);
        // TODO: Integrar com próximas etapas
        // - Salvar PDF/JSON (Etapa 2)
        // - Analisar com IA (Etapa 3)
        // - Verificar se é cotação (Etapa 4)
        // - Enviar notificação (Etapa 5)
    }
    /**
     * Inicia o monitoramento automaticamente
     */
    async initializeAutoMonitoring() {
        if (this.isInitialized) {
            console.log('⚠️ Monitoramento já foi inicializado');
            return;
        }
        try {
            console.log('🚀 [GLOBAL] Iniciando monitoramento automático de emails...');
            const result = await this.autoMonitorService.startAutoMonitoring();
            if (result.success) {
                this.isInitialized = true;
                console.log('✅ [GLOBAL] Monitoramento automático iniciado com sucesso');
                console.log('🔄 Sistema verificará emails a cada 10 segundos automaticamente');
            }
            else {
                console.error('❌ [GLOBAL] Falha ao iniciar monitoramento:', result.message);
            }
        }
        catch (error) {
            console.error('❌ [GLOBAL] Erro crítico ao inicializar monitoramento:', error.message);
        }
    }
    /**
     * Para o monitoramento
     */
    async stopAutoMonitoring() {
        try {
            console.log('🛑 [GLOBAL] Parando monitoramento automático...');
            const result = await this.autoMonitorService.stopAutoMonitoring();
            if (result.success) {
                this.isInitialized = false;
                console.log('✅ [GLOBAL] Monitoramento parado com sucesso');
            }
            return result;
        }
        catch (error) {
            console.error('❌ [GLOBAL] Erro ao parar monitoramento:', error.message);
            return {
                success: false,
                message: `Erro ao parar monitoramento: ${error.message}`
            };
        }
    }
    /**
     * Retorna instância do serviço para uso direto nas rotas
     */
    getAutoMonitorService() {
        return this.autoMonitorService;
    }
    /**
     * Verifica se está inicializado
     */
    isMonitoringActive() {
        return this.isInitialized && this.autoMonitorService.getStatus().isRunning;
    }
    /**
     * Reinicia o monitoramento
     */
    async restartAutoMonitoring() {
        console.log('🔄 [GLOBAL] Reiniciando monitoramento...');
        // Parar se estiver rodando
        if (this.isInitialized) {
            await this.stopAutoMonitoring();
            // Aguardar um pouco para garantir que parou
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        // Reiniciar
        await this.initializeAutoMonitoring();
        return {
            success: this.isMonitoringActive(),
            message: this.isMonitoringActive() ? 'Monitoramento reiniciado' : 'Falha ao reiniciar'
        };
    }
    /**
     * Método para ser chamado quando o servidor for finalizado
     */
    async gracefulShutdown() {
        console.log('📤 [GLOBAL] Finalizando monitoramento graciosamente...');
        if (this.isInitialized) {
            await this.stopAutoMonitoring();
        }
        console.log('✅ [GLOBAL] Shutdown do monitoramento concluído');
    }
    /**
     * Obtém o serviço de salvamento de emails
     */
    getEmailSaverService() {
        return this.autoMonitorService.getEmailSaverService();
    }
    /**
     * Obtém interpretação de um email específico
     */
    async getEmailInterpretation(emailId) {
        return await this.autoMonitorService.getEmailInterpretation(emailId);
    }
    /**
     * Lista todas as interpretações
     */
    async listInterpretations() {
        return await this.autoMonitorService.listInterpretations();
    }
}
exports.default = GlobalEmailMonitorManager;
//# sourceMappingURL=GlobalEmailMonitorManager.js.map