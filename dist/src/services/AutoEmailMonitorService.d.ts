/**
 * Serviço para gerenciar o monitoramento automático de emails
 * Usa o padrão de workers em background similar ao JobManager
 */
import EmailSaverService from './EmailSaverService';
import { EmailInterpretation } from './GeminiInterpretationService';
interface AutoMonitorStatus {
    isRunning: boolean;
    startTime: Date | null;
    lastCheck: Date | null;
    totalEmailsProcessed: number;
    errorCount: number;
    config: {
        intervalSeconds: number;
        maxEmails: number;
        enabled: boolean;
    };
    recentEmails: any[];
    messages: string[];
}
interface EmailDetectedEvent {
    emailId: string;
    from: string;
    subject: string;
    date: string;
    content: string;
}
declare class AutoEmailMonitorService {
    private worker;
    private status;
    private messages;
    private callbacks;
    private emailSaver;
    private geminiService;
    private workerComm;
    private pollInterval;
    private processingEmails;
    private lockDir;
    private exitHandlersRegistered;
    constructor();
    /**
     * Inicia o monitoramento automático
     */
    startAutoMonitoring(): Promise<{
        success: boolean;
        message: string;
        error?: string;
    }>;
    /**
     * Para o monitoramento automático
     */
    stopAutoMonitoring(): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Registra handlers de saída para encerrar worker e liberar locks
     */
    private registerExitHandlers;
    /**
     * Configura os handlers do worker
     */
    private setupWorkerHandlers;
    /**
     * Processa mensagens do worker
     */
    private processWorkerMessage;
    /**
     * Manipula detecção de novo email
     */
    private handleEmailDetected;
    /**
     * Manipula erros de monitoramento
     */
    private handleMonitoringError;
    /**
     * Atualiza status com dados do worker
     */
    private updateStatusFromWorker;
    /**
     * Envia comando para o worker
     */
    private sendCommandToWorker;
    /**
     * Adiciona mensagem ao log
     */
    private addMessage;
    /**
     * Retorna status atual
     */
    getStatus(): AutoMonitorStatus;
    /**
     * Registra callback para quando emails são detectados
     */
    onEmailDetected(key: string, callback: (emailData: EmailDetectedEvent) => void): void;
    /**
     * Remove callback
     */
    removeEmailCallback(key: string): void;
    /**
     * Atualiza configurações do worker
     */
    updateConfig(newConfig: Partial<AutoMonitorStatus['config']>): Promise<void>;
    /**
     * Solicita emails recentes do worker
     */
    getRecentEmails(limit?: number): Promise<any[]>;
    /**
     * Obtém lista de emails salvos
     */
    getSavedEmailsMetadata(): import("./EmailSaverService").SavedEmailMetadata[];
    /**
     * Verifica se um email já foi salvo
     */
    isEmailSaved(emailId: string): boolean;
    /**
     * Limpa emails antigos salvos
     */
    cleanOldSavedEmails(daysToKeep?: number): void;
    /**
     * Obtém o serviço de salvamento de emails
     */
    getEmailSaverService(): EmailSaverService;
    /**
     * Interpreta email usando Gemini AI
     */
    private interpretEmailWithGemini;
    /**
     * Obtém interpretação de um email específico
     */
    getEmailInterpretation(emailId: string): Promise<EmailInterpretation | null>;
    /**
     * Lista todas as interpretações
     */
    listInterpretations(): Promise<EmailInterpretation[]>;
    /**
     * Inicia polling de mensagens para produção
     */
    private startMessagePolling;
    /**
     * Para polling de mensagens
     */
    private stopMessagePolling;
    /**
     * Verifica se um email já foi processado anteriormente
     */
    private isEmailAlreadyProcessed;
    /**
     * Marca um email como processado no status
     */
    private markEmailAsProcessed;
}
export default AutoEmailMonitorService;
export type { EmailDetectedEvent, AutoMonitorStatus };
//# sourceMappingURL=AutoEmailMonitorService.d.ts.map