/**
 * Singleton para gerenciar o monitoramento automático globalmente
 * Inicia automaticamente quando o servidor sobe
 */
import AutoEmailMonitorService from './AutoEmailMonitorService';
declare class GlobalEmailMonitorManager {
    private static instance;
    private autoMonitorService;
    private isInitialized;
    private constructor();
    /**
     * Singleton pattern - retorna única instância
     */
    static getInstance(): GlobalEmailMonitorManager;
    /**
     * Configura callbacks globais para emails detectados
     */
    private setupGlobalCallbacks;
    /**
     * Processa email novo detectado (preparado para próximas etapas)
     */
    private processNewEmail;
    /**
     * Inicia o monitoramento automaticamente
     */
    initializeAutoMonitoring(): Promise<void>;
    /**
     * Para o monitoramento
     */
    stopAutoMonitoring(): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Retorna instância do serviço para uso direto nas rotas
     */
    getAutoMonitorService(): AutoEmailMonitorService;
    /**
     * Verifica se está inicializado
     */
    isMonitoringActive(): boolean;
    /**
     * Reinicia o monitoramento
     */
    restartAutoMonitoring(): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Método para ser chamado quando o servidor for finalizado
     */
    gracefulShutdown(): Promise<void>;
    /**
     * Obtém o serviço de salvamento de emails
     */
    getEmailSaverService(): import("./EmailSaverService").default;
    /**
     * Obtém interpretação de um email específico
     */
    getEmailInterpretation(emailId: string): Promise<import("./GeminiInterpretationService").EmailInterpretation | null>;
    /**
     * Lista todas as interpretações
     */
    listInterpretations(): Promise<import("./GeminiInterpretationService").EmailInterpretation[]>;
}
export default GlobalEmailMonitorManager;
//# sourceMappingURL=GlobalEmailMonitorManager.d.ts.map