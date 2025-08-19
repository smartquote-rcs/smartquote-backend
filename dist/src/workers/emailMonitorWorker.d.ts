/**
 * Worker para monitoramento automático de emails em background
 * Executa verificações periódicas sem bloquear o servidor principal
 */
interface MonitoringConfig {
    intervalSeconds: number;
    maxEmails: number;
    enabled: boolean;
}
interface ProcessedEmailSummary {
    id: string;
    from: string;
    subject: string;
    date: string;
    timestamp: string;
}
declare class EmailMonitorWorker {
    private gmailService;
    private config;
    private isRunning;
    private intervalId;
    private processedEmails;
    private lastCheck;
    private errorCount;
    private maxErrors;
    private communication;
    constructor();
    /**
     * Inicia o monitoramento automático
     */
    start(): Promise<void>;
    /**
     * Para o monitoramento automático
     */
    stop(): void;
    /**
     * Verifica emails novos
     */
    private checkEmails;
    /**
     * Envia mensagem para o processo pai
     */
    sendMessageToParent(type: string, data: any): void;
    /**
     * Retorna status atual do monitoramento
     */
    getStatus(): {
        isRunning: boolean;
        config: MonitoringConfig;
        lastCheck: Date;
        totalProcessed: number;
        recentEmails: ProcessedEmailSummary[];
        errorCount: number;
        maxErrors: number;
        uptime: number;
    };
    /**
     * Atualiza configurações
     */
    updateConfig(newConfig: Partial<MonitoringConfig>): void;
    /**
     * Retorna emails processados recentemente
     */
    getRecentEmails(limit?: number): ProcessedEmailSummary[];
}
export default EmailMonitorWorker;
//# sourceMappingURL=emailMonitorWorker.d.ts.map