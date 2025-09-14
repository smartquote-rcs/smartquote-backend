"use strict";
/**
 * Serviço para gerenciar o monitoramento automático de emails
 * Usa o padrão de workers em background similar ao JobManager
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const paths_1 = require("../utils/paths");
const fs_1 = __importDefault(require("fs"));
const EmailSaverService_1 = __importDefault(require("./EmailSaverService"));
const GeminiInterpretationService_1 = __importDefault(require("./GeminiInterpretationService"));
const WorkerCommunication_1 = __importDefault(require("./WorkerCommunication"));
class AutoEmailMonitorService {
    worker = null;
    status;
    messages = [];
    callbacks = new Map();
    emailSaver;
    geminiService;
    workerComm;
    pollInterval = null;
    // Dedup: locks em memória por processo e por arquivo (entre processos)
    processingEmails = new Set();
    lockDir = (0, paths_1.getLocksDir)();
    exitHandlersRegistered = false;
    constructor() {
        this.emailSaver = new EmailSaverService_1.default();
        this.geminiService = new GeminiInterpretationService_1.default();
        this.workerComm = new WorkerCommunication_1.default();
        this.status = {
            isRunning: false,
            startTime: null,
            lastCheck: null,
            totalEmailsProcessed: 0,
            errorCount: 0,
            config: {
                intervalSeconds: 10,
                maxEmails: 4,
                enabled: true
            },
            recentEmails: [],
            messages: []
        };
        // Garante pasta de locks
        try {
            (0, paths_1.ensureDir)(this.lockDir);
        }
        catch { }
        this.registerExitHandlers();
    }
    /**
     * Inicia o monitoramento automático
     */
    async startAutoMonitoring() {
        if (this.worker) {
            return {
                success: false,
                message: 'Monitoramento automático já está rodando'
            };
        }
        try {
            console.log('🚀 Iniciando worker de monitoramento automático...');
            // Detectar ambiente
            const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
            const isProduction = process.env.NODE_ENV === 'production';
            console.log(`🔧 Ambiente: ${isDevelopment ? 'desenvolvimento' : 'produção'}`);
            // Executar worker diretamente em Node.js para IPC funcionar
            const workerPath = path_1.default.join(__dirname, '../workers/emailMonitorWorker.ts');
            console.log(`📁 Worker path: ${workerPath}`);
            if (isDevelopment) {
                // Desenvolvimento: usar ts-node/register
                console.log('🔧 Usando ts-node/register para desenvolvimento');
                this.worker = (0, child_process_1.spawn)('node', ['-r', 'ts-node/register', workerPath], {
                    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                    cwd: path_1.default.join(__dirname, '../..'),
                    env: { ...process.env }
                });
            }
            else {
                // Produção: compilar TypeScript ou usar JavaScript
                const jsWorkerPath = path_1.default.join(__dirname, '../workers/emailMonitorWorker.js');
                // Verificar se arquivo JS existe
                const fs = require('fs');
                if (fs.existsSync(jsWorkerPath)) {
                    console.log('🔧 Usando arquivo JavaScript compilado para produção');
                    this.worker = (0, child_process_1.spawn)('node', [jsWorkerPath], {
                        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                        cwd: path_1.default.join(__dirname, '../..'),
                        env: { ...process.env }
                    });
                }
                else {
                    console.log('🔧 Fallback: usando ts-node em produção');
                    this.worker = (0, child_process_1.spawn)('node', ['-r', 'ts-node/register', workerPath], {
                        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                        cwd: path_1.default.join(__dirname, '../..'),
                        env: { ...process.env }
                    });
                }
            }
            this.setupWorkerHandlers();
            // Enviar comando de start
            this.sendCommandToWorker('START', {});
            // Iniciar polling para mensagens em produção
            this.startMessagePolling();
            this.status.isRunning = true;
            this.status.startTime = new Date();
            this.addMessage('Monitoramento automático iniciado');
            return {
                success: true,
                message: 'Monitoramento automático iniciado com sucesso'
            };
        }
        catch (error) {
            console.error('❌ Erro ao iniciar monitoramento automático:', error);
            return {
                success: false,
                message: 'Erro ao iniciar monitoramento automático',
                error: error.message
            };
        }
    }
    /**
     * Para o monitoramento automático
     */
    async stopAutoMonitoring() {
        if (!this.worker) {
            return {
                success: false,
                message: 'Monitoramento automático não está rodando'
            };
        }
        try {
            console.log('🛑 Parando worker de monitoramento automático...');
            this.sendCommandToWorker('STOP', {});
            // Parar polling
            this.stopMessagePolling();
            // Aguardar um pouco e depois terminar o processo
            setTimeout(() => {
                if (this.worker) {
                    this.worker.kill('SIGTERM');
                }
            }, 2000);
            this.status.isRunning = false;
            this.addMessage('Monitoramento automático parado');
            return {
                success: true,
                message: 'Monitoramento automático parado com sucesso'
            };
        }
        catch (error) {
            console.error('❌ Erro ao parar monitoramento automático:', error);
            return {
                success: false,
                message: 'Erro ao parar monitoramento automático'
            };
        }
    }
    /**
     * Registra handlers de saída para encerrar worker e liberar locks
     */
    registerExitHandlers() {
        if (this.exitHandlersRegistered)
            return;
        this.exitHandlersRegistered = true;
        const cleanup = async () => {
            try {
                await this.stopAutoMonitoring();
            }
            catch { }
            // Não removemos arquivos de lock aqui; cada handler os remove no finally
        };
        process.once('exit', () => { cleanup(); });
        process.once('SIGINT', () => { cleanup(); process.exit(0); });
        process.once('SIGTERM', () => { cleanup(); process.exit(0); });
    }
    /**
     * Configura os handlers do worker
     */
    setupWorkerHandlers() {
        if (!this.worker)
            return;
        this.worker.stdout?.on('data', (data) => {
            const output = data.toString().trim();
            console.log(`[AUTO-MONITOR] ${output}`);
            this.addMessage(output);
        });
        this.worker.stderr?.on('data', (data) => {
            const error = data.toString().trim();
            if (!error.includes('ExperimentalWarning')) {
                console.error(`[AUTO-MONITOR ERROR] ${error}`);
                this.addMessage(`ERRO: ${error}`);
                this.status.errorCount++;
            }
        });
        this.worker.on('message', (message) => {
            this.processWorkerMessage(message);
        });
        this.worker.on('exit', (code) => {
            console.log(`🔚 Worker de monitoramento saiu com código: ${code}`);
            this.worker = null;
            this.status.isRunning = false;
            this.addMessage(`Worker finalizado (código: ${code})`);
        });
        this.worker.on('error', (error) => {
            console.error('❌ Erro no worker de monitoramento:', error);
            this.addMessage(`Erro no worker: ${error.message}`);
            this.status.errorCount++;
        });
    }
    /**
     * Processa mensagens do worker
     */
    processWorkerMessage(message) {
        console.log(`📨 [DEBUG] Mensagem recebida do worker:`, message);
        if (message.type === 'WORKER_MSG') {
            const { action, data, timestamp } = message.payload;
            console.log(`📨 [DEBUG] Action: ${action}, Data:`, data);
            switch (action) {
                case 'EMAIL_DETECTED':
                    console.log(`📧 [DEBUG] Chamando handleEmailDetected...`);
                    this.handleEmailDetected(data);
                    break;
                case 'MONITORING_ERROR':
                    this.handleMonitoringError(data);
                    break;
                case 'STATUS_RESPONSE':
                    this.updateStatusFromWorker(data);
                    break;
                case 'RECENT_EMAILS_RESPONSE':
                    this.status.recentEmails = data;
                    break;
                default:
                    console.log(`📨 Mensagem do worker: ${action}`, data);
            }
            this.addMessage(`[${new Date(timestamp).toLocaleTimeString()}] ${action}`);
        }
    }
    /**
     * Manipula detecção de novo email
     */
    async handleEmailDetected(emailData) {
        console.log(`📧 [AUTO-DETECTED] Novo email: ${emailData.subject}`);
        console.log(`📧 [DEBUG] Email data:`, {
            id: emailData.emailId,
            from: emailData.from,
            subject: emailData.subject,
            date: emailData.date,
            contentLength: emailData.content?.length || 0
        });
        // ✅ Dedup 1: por processo (evita concorrência intra-processo)
        if (this.processingEmails.has(emailData.emailId)) {
            console.log(`🔁 [LOCK-MEM] Email ${emailData.emailId} já em processamento neste processo — ignorando.`);
            return;
        }
        this.processingEmails.add(emailData.emailId);
        // ✅ Dedup 2: lock por arquivo (evita concorrência entre processos)
        const lockPath = path_1.default.join(this.lockDir, `${emailData.emailId}.lock`);
        let lockFd = null;
        try {
            // Tenta criar lock exclusivo; falha se já existir
            lockFd = await fs_1.default.promises.open(lockPath, 'wx');
        }
        catch (e) {
            if (e && (e.code === 'EEXIST' || e.code === 'EACCES')) {
                console.log(`🔒 [LOCK-FILE] Já existe lock para ${emailData.emailId} — outro processo está tratando. Ignorando.`);
                this.processingEmails.delete(emailData.emailId);
                return;
            }
            // Outro erro inesperado: loga mas tenta seguir para não travar o fluxo
            console.warn(`⚠️ [LOCK-FILE] Erro ao criar lock para ${emailData.emailId}: ${e?.message || e}`);
        }
        // ✅ Dedup 3: verificação rápida se já foi salvo
        const isAlreadySaved = this.emailSaver.isEmailSaved(emailData.emailId);
        if (isAlreadySaved) {
            console.log(`🔄 [DUPLICADO] Email ${emailData.emailId} já foi salvo anteriormente - ignorando`);
            this.addMessage(`🔄 Email duplicado ignorado: ${emailData.subject.substring(0, 50)}...`);
            // Libera lock antes de sair
            try {
                if (lockFd)
                    await lockFd.close();
            }
            catch { }
            try {
                await fs_1.default.promises.unlink(lockPath);
            }
            catch { }
            this.processingEmails.delete(emailData.emailId);
            return;
        }
        this.status.totalEmailsProcessed++;
        this.status.lastCheck = new Date();
        // Converter EmailDetectedEvent para EmailData
        const emailToAnalyze = {
            id: emailData.emailId,
            threadId: '', // Será preenchido pelo worker se necessário
            snippet: emailData.subject, // Usar assunto como snippet temporário
            from: emailData.from,
            subject: emailData.subject,
            date: emailData.date,
            content: emailData.content
        };
        try {
            // 1. REGISTRO DE STATUS (marca como processado para evitar reprocessamento)
            console.log(`📝 [STATUS] Registrando email ${emailData.emailId} como processado...`);
            await this.markEmailAsProcessed(emailData.emailId);
            this.addMessage(`📝 Status registrado: ${emailData.subject.substring(0, 50)}...`);
            // 2. INTERPRETAÇÃO COM GEMINI AI
            console.log(`🧠 [GEMINI] Iniciando interpretação do email ${emailData.emailId}...`);
            const interpretation = await this.interpretEmailWithGemini(emailToAnalyze);
            // 3. SALVAMENTO CONDICIONAL (apenas se for "pedido")
            if (interpretation.tipo === 'pedido') {
                console.log(`📋 [PEDIDO-DETECTED] Email classificado como pedido - salvando dados...`);
                // Salvar email em JSON
                await this.emailSaver.saveEmail(emailToAnalyze, {
                    saveAsJSON: true,
                    includeRawData: false
                });
                // Criar notificação informando que um pedido por email foi detectado
                try {
                    const NotificationService = require('../services/NotificationService').NotificationService;
                    const notificationService = new NotificationService();
                    await notificationService.create({
                        title: 'Pedido por Email Detectado',
                        subject: `Novo pedido detectado por email: ${emailData.subject}`,
                        type: 'pedido_email',
                        url_redir: '/emails/' + emailData.emailId
                    });
                    console.log(`🔔 Notificação criada: Pedido por email detectado (${emailData.subject})`);
                }
                catch (err) {
                    console.error('Erro ao criar notificação de pedido por email:', err);
                }
                console.log(`💾 [AUTO-SAVED] Email ${emailData.emailId} salvo como pedido`);
                this.addMessage(`💾 📋 Pedido salvo: ${emailData.subject.substring(0, 50)}... (${interpretation.confianca}% confiança)`);
            }
            else {
                console.log(`📄 [OUTRO-EMAIL] Email classificado como "${interpretation.tipo}" - não será salvo`);
                this.addMessage(`📄 Email ignorado (${interpretation.tipo}): ${emailData.subject.substring(0, 50)}...`);
            }
        }
        catch (error) {
            console.error(`❌ [PROCESS-ERROR] Falha ao processar email ${emailData.emailId}:`, error);
            this.addMessage(`❌ Erro ao processar email: ${error}`);
        }
        finally {
            // Libera lock de arquivo e de memória
            try {
                if (lockFd)
                    await lockFd.close();
            }
            catch { }
            try {
                await fs_1.default.promises.unlink(lockPath);
            }
            catch { }
            this.processingEmails.delete(emailData.emailId);
        }
        // Executar callbacks registrados
        this.callbacks.forEach((callback, key) => {
            try {
                callback(emailData);
            }
            catch (error) {
                console.error(`❌ Erro no callback ${key}:`, error);
            }
        });
    }
    /**
     * Manipula erros de monitoramento
     */
    handleMonitoringError(errorData) {
        console.error('🚨 Erro no monitoramento automático:', errorData);
        this.status.errorCount++;
        this.addMessage(`ERRO: ${errorData.error}`);
    }
    /**
     * Atualiza status com dados do worker
     */
    updateStatusFromWorker(workerStatus) {
        this.status.config = workerStatus.config;
        this.status.lastCheck = new Date(workerStatus.lastCheck);
        this.status.recentEmails = workerStatus.recentEmails;
        this.status.errorCount = workerStatus.errorCount;
    }
    /**
     * Envia comando para o worker
     */
    sendCommandToWorker(action, params) {
        if (this.worker && this.worker.connected) {
            this.worker.send({
                type: 'WORKER_CMD',
                payload: { action, params }
            });
        }
    }
    /**
     * Adiciona mensagem ao log
     */
    addMessage(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.messages.push(`[${timestamp}] ${message}`);
        // Manter apenas últimas 100 mensagens
        if (this.messages.length > 100) {
            this.messages = this.messages.slice(-100);
        }
        this.status.messages = [...this.messages];
    }
    /**
     * Retorna status atual
     */
    getStatus() {
        return {
            ...this.status,
            messages: [...this.messages]
        };
    }
    /**
     * Registra callback para quando emails são detectados
     */
    onEmailDetected(key, callback) {
        this.callbacks.set(key, callback);
    }
    /**
     * Remove callback
     */
    removeEmailCallback(key) {
        this.callbacks.delete(key);
    }
    /**
     * Atualiza configurações do worker
     */
    updateConfig(newConfig) {
        return new Promise((resolve) => {
            this.sendCommandToWorker('UPDATE_CONFIG', newConfig);
            this.status.config = { ...this.status.config, ...newConfig };
            resolve();
        });
    }
    /**
     * Solicita emails recentes do worker
     */
    async getRecentEmails(limit = 10) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve(this.status.recentEmails);
            }, 3000);
            this.sendCommandToWorker('GET_RECENT_EMAILS', { limit });
            // Se worker responder, use os dados mais recentes
            const originalRecentEmails = this.status.recentEmails;
            this.status.recentEmails = [];
            setTimeout(() => {
                if (this.status.recentEmails.length > 0) {
                    clearTimeout(timeout);
                    resolve(this.status.recentEmails.slice(0, limit));
                }
                else {
                    resolve(originalRecentEmails.slice(0, limit));
                }
            }, 1500);
        });
    }
    /**
     * Obtém lista de emails salvos
     */
    getSavedEmailsMetadata() {
        return this.emailSaver.getSavedEmailsMetadata();
    }
    /**
     * Verifica se um email já foi salvo
     */
    isEmailSaved(emailId) {
        return this.emailSaver.isEmailSaved(emailId);
    }
    /**
     * Limpa emails antigos salvos
     */
    cleanOldSavedEmails(daysToKeep = 30) {
        this.emailSaver.cleanOldFiles(daysToKeep);
    }
    /**
     * Obtém o serviço de salvamento de emails
     */
    getEmailSaverService() {
        return this.emailSaver;
    }
    /**
     * Interpreta email usando Gemini AI
     */
    async interpretEmailWithGemini(emailData) {
        try {
            console.log(`🧠 [GEMINI] Iniciando interpretação do email ${emailData.id}...`);
            const interpretation = await this.geminiService.interpretEmail(emailData);
            console.log(`🧠 [GEMINI-SUCCESS] Email ${emailData.id} interpretado: ${interpretation.tipo} (${interpretation.confianca}% confiança)`);
            const solicit = interpretation.solicitacao ? String(interpretation.solicitacao) : '';
            if (solicit) {
                this.addMessage(`🧠 Interpretado: ${interpretation.tipo} - ${solicit.substring(0, 50)}...`);
            }
            else {
                this.addMessage(`🧠 Interpretado: ${interpretation.tipo}`);
            }
            return interpretation;
        }
        catch (error) {
            console.error(`❌ [GEMINI-ERROR] Falha ao interpretar email ${emailData.id}:`, error.message);
            this.addMessage(`❌ Erro na interpretação: ${error.message}`);
            // Retornar interpretação básica em caso de erro
            return {
                id: `interp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                emailId: emailData.id,
                tipo: 'outro',
                prioridade: 'media',
                solicitacao: '',
                cliente: { email: emailData.from },
                confianca: 0,
                interpretedAt: new Date().toISOString(),
                rawGeminiResponse: `ERROR: ${error.message}`
            };
        }
    }
    /**
     * Obtém interpretação de um email específico
     */
    async getEmailInterpretation(emailId) {
        return await this.geminiService.getInterpretationByEmailId(emailId);
    }
    /**
     * Lista todas as interpretações
     */
    async listInterpretations() {
        return await this.geminiService.listInterpretations();
    }
    /**
     * Inicia polling de mensagens para produção
     */
    startMessagePolling() {
        // Debug: mostrar environment
        console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
        // Só fazer polling se IPC não estiver disponível
        const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
        console.log(`🔧 isDevelopment: ${isDevelopment}`);
        if (isDevelopment) {
            console.log('🔧 Desenvolvimento: usando IPC direto, polling desabilitado');
            return;
        }
        console.log('🔧 Produção: iniciando polling de mensagens a cada 2 segundos');
        this.pollInterval = setInterval(() => {
            try {
                if (this.workerComm.hasMessages()) {
                    console.log('📨 Mensagens encontradas, processando...');
                    const messages = this.workerComm.readMessages();
                    messages.forEach(message => {
                        this.processWorkerMessage(message);
                    });
                }
            }
            catch (error) {
                console.error('❌ Erro no polling de mensagens:', error);
            }
        }, 2000); // Polling a cada 2 segundos
    }
    /**
     * Para polling de mensagens
     */
    stopMessagePolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            console.log('⏹️ Polling de mensagens parado');
        }
    }
    /**
     * Verifica se um email já foi processado anteriormente
     */
    async isEmailAlreadyProcessed(emailId) {
        try {
            const fs = await import('fs/promises');
            const statusPath = (0, paths_1.getDataPath)('email_status.json');
            const data = await fs.readFile(statusPath, 'utf8');
            const status = JSON.parse(data);
            return Array.isArray(status.processed) && status.processed.includes(emailId);
        }
        catch (error) {
            // Se arquivo não existe ou erro de leitura, considerar como não processado
            return false;
        }
    }
    /**
     * Marca um email como processado no status
     */
    async markEmailAsProcessed(emailId) {
        try {
            const fs = await import('fs/promises');
            const statusPath = (0, paths_1.getDataPath)('email_status.json');
            let status = {
                processed: [],
                lastCheck: new Date().toISOString()
            };
            try {
                const data = await fs.readFile(statusPath, 'utf8');
                status = JSON.parse(data);
                // Garantir que processed é um array
                if (!Array.isArray(status.processed)) {
                    status.processed = [];
                }
            }
            catch (error) {
                // Arquivo não existe, usar status inicial
            }
            // Adicionar email se não existir
            if (!status.processed.includes(emailId)) {
                status.processed.push(emailId);
                status.lastCheck = new Date().toISOString();
                // Manter apenas últimos 100 IDs para evitar arquivo muito grande
                if (status.processed.length > 100) {
                    status.processed = status.processed.slice(-100);
                }
                await fs.writeFile(statusPath, JSON.stringify(status, null, 2), 'utf8');
                console.log(`📝 [STATUS] Email ${emailId} marcado como processado`);
            }
        }
        catch (error) {
            console.error(`❌ [STATUS-ERROR] Erro ao marcar email como processado:`, error);
            throw error;
        }
    }
}
exports.default = AutoEmailMonitorService;
//# sourceMappingURL=AutoEmailMonitorService.js.map