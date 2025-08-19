"use strict";
/**
 * Worker para monitoramento automático de emails em background
 * Executa verificações periódicas sem bloquear o servidor principal
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GmailMonitorService_1 = __importDefault(require("../services/GmailMonitorService"));
const WorkerCommunication_1 = __importDefault(require("../services/WorkerCommunication"));
class EmailMonitorWorker {
    gmailService;
    config;
    isRunning = false;
    intervalId = null;
    processedEmails = [];
    lastCheck = new Date();
    errorCount = 0;
    maxErrors = 5;
    communication;
    constructor() {
        this.gmailService = new GmailMonitorService_1.default();
        this.communication = new WorkerCommunication_1.default();
        this.config = {
            intervalSeconds: 10, // Verificar a cada 10 segundos
            maxEmails: 4,
            enabled: true
        };
    }
    /**
     * Inicia o monitoramento automático
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Monitoramento já está rodando');
            return;
        }
        console.log('🚀 Iniciando monitoramento automático de emails...');
        console.log(`📅 Intervalo: ${this.config.intervalSeconds} segundos`);
        console.log(`📧 Máximo de emails por verificação: ${this.config.maxEmails}`);
        this.isRunning = true;
        this.errorCount = 0;
        this.lastCheck = new Date();
        // Fazer primeira verificação imediatamente
        await this.checkEmails();
        // Configurar intervalo
        this.intervalId = setInterval(async () => {
            if (this.config.enabled && this.errorCount < this.maxErrors) {
                await this.checkEmails();
            }
        }, this.config.intervalSeconds * 1000);
        console.log('✅ Monitoramento automático iniciado com sucesso');
    }
    /**
     * Para o monitoramento automático
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Monitoramento não está rodando');
            return;
        }
        console.log('🛑 Parando monitoramento automático...');
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('✅ Monitoramento automático parado');
    }
    /**
     * Verifica emails novos
     */
    async checkEmails() {
        try {
            const startTime = Date.now();
            this.lastCheck = new Date();
            console.log(`📡 [${this.lastCheck.toISOString()}] Verificando emails novos...`);
            const newEmails = await this.gmailService.monitorNewEmails();
            if (newEmails.length > 0) {
                console.log(`📬 [NOVO] ${newEmails.length} emails encontrados!`);
                // Processar emails encontrados
                for (const email of newEmails) {
                    const processed = {
                        id: email.id,
                        from: email.from,
                        subject: email.subject,
                        date: email.date,
                        timestamp: new Date().toISOString()
                    };
                    this.processedEmails.push(processed);
                    // Manter apenas últimos 50 emails processados
                    if (this.processedEmails.length > 50) {
                        this.processedEmails = this.processedEmails.slice(-50);
                    }
                    console.log(`  ✉️  ${email.subject.substring(0, 40)}... (${email.from})`);
                    // Enviar mensagem para processo pai usando sistema robusto
                    console.log(`📤 [DEBUG] Enviando mensagem EMAIL_DETECTED para o processo pai...`);
                    this.communication.sendMessage('EMAIL_DETECTED', {
                        emailId: email.id,
                        from: email.from,
                        subject: email.subject,
                        date: email.date,
                        content: email.content.substring(0, 200) + '...'
                    });
                    console.log(`📤 [DEBUG] Mensagem EMAIL_DETECTED enviada!`);
                }
                // Reset contador de erros após sucesso
                this.errorCount = 0;
            }
            else {
                console.log(`✅ [${this.lastCheck.toLocaleTimeString()}] Nenhum email novo`);
            }
            const duration = Date.now() - startTime;
            console.log(`⏱️  Verificação concluída em ${duration}ms`);
        }
        catch (error) {
            this.errorCount++;
            console.error(`❌ [ERRO ${this.errorCount}/${this.maxErrors}] Falha na verificação:`, error.message);
            if (this.errorCount >= this.maxErrors) {
                console.error('🚨 Muitos erros consecutivos. Parando monitoramento automático.');
                this.stop();
                this.communication.sendMessage('MONITORING_ERROR', {
                    error: `Monitoramento parado após ${this.maxErrors} erros consecutivos`,
                    lastError: error.message
                });
            }
        }
    }
    /**
     * Envia mensagem para o processo pai
     */
    sendMessageToParent(type, data) {
        console.log(`📤 [DEBUG] sendMessageToParent called with type: ${type}`);
        console.log(`📤 [DEBUG] Data:`, JSON.stringify(data, null, 2));
        console.log(`📤 [DEBUG] process.send available:`, !!process.send);
        console.log(`📤 [DEBUG] process.connected:`, process.connected);
        if (process.send) {
            const message = {
                type: 'WORKER_MSG',
                payload: {
                    action: type,
                    timestamp: new Date().toISOString(),
                    data
                }
            };
            console.log(`📤 [DEBUG] Sending message:`, JSON.stringify(message, null, 2));
            try {
                process.send(message);
                console.log(`📤 [DEBUG] Message sent successfully!`);
            }
            catch (error) {
                console.error(`📤 [ERROR] Failed to send message:`, error);
            }
        }
        else {
            console.warn(`📤 [WARNING] process.send not available - running standalone?`);
        }
    }
    /**
     * Retorna status atual do monitoramento
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            config: this.config,
            lastCheck: this.lastCheck,
            totalProcessed: this.processedEmails.length,
            recentEmails: this.processedEmails.slice(-5),
            errorCount: this.errorCount,
            maxErrors: this.maxErrors,
            uptime: this.isRunning ? Date.now() - this.lastCheck.getTime() : 0
        };
    }
    /**
     * Atualiza configurações
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ Configuração atualizada:', this.config);
        if (!this.config.enabled && this.isRunning) {
            this.stop();
        }
    }
    /**
     * Retorna emails processados recentemente
     */
    getRecentEmails(limit = 10) {
        return this.processedEmails.slice(-limit);
    }
}
// Execução quando chamado como worker
if (require.main === module) {
    const worker = new EmailMonitorWorker();
    // Manipular mensagens do processo pai
    process.on('message', async (message) => {
        if (message.type === 'WORKER_CMD') {
            const { action, params } = message.payload;
            switch (action) {
                case 'START':
                    await worker.start();
                    break;
                case 'STOP':
                    worker.stop();
                    break;
                case 'STATUS':
                    const status = worker.getStatus();
                    worker.sendMessageToParent('STATUS_RESPONSE', status);
                    break;
                case 'UPDATE_CONFIG':
                    worker.updateConfig(params);
                    break;
                case 'GET_RECENT_EMAILS':
                    const emails = worker.getRecentEmails(params?.limit || 10);
                    worker.sendMessageToParent('RECENT_EMAILS_RESPONSE', emails);
                    break;
                default:
                    console.log('❓ Ação desconhecida:', action);
            }
        }
    });
    // Iniciar automaticamente
    worker.start().catch(console.error);
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('📤 Recebido SIGTERM, parando worker...');
        worker.stop();
        process.exit(0);
    });
    process.on('SIGINT', () => {
        console.log('📤 Recebido SIGINT, parando worker...');
        worker.stop();
        process.exit(0);
    });
}
exports.default = EmailMonitorWorker;
//# sourceMappingURL=emailMonitorWorker.js.map