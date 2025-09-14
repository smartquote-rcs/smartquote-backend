"use strict";
/**
 * Serviço de comunicação entre worker e processo principal
 * Funciona tanto com IPC quanto com arquivos em produção
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerCommunication = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class WorkerCommunication {
    messageDir = path_1.default.join(__dirname, '../data/worker-messages');
    messageFile = path_1.default.join(this.messageDir, 'messages.json');
    isIPCAvailable;
    constructor() {
        this.isIPCAvailable = !!(process.send && process.connected);
        if (!this.isIPCAvailable) {
            this.ensureMessageDirectory();
            console.log('📡 [WORKER-COMM] IPC não disponível, usando comunicação via arquivos');
        }
        else {
            console.log('📡 [WORKER-COMM] IPC disponível, usando comunicação direta');
        }
    }
    /**
     * Garante que o diretório de mensagens existe
     */
    ensureMessageDirectory() {
        if (!fs_1.default.existsSync(this.messageDir)) {
            fs_1.default.mkdirSync(this.messageDir, { recursive: true });
        }
    }
    /**
     * Envia mensagem do worker para o processo principal
     */
    sendMessage(type, data) {
        const message = {
            type: 'WORKER_MSG',
            payload: {
                action: type,
                timestamp: new Date().toISOString(),
                data
            }
        };
        if (this.isIPCAvailable) {
            // Usar IPC normal
            try {
                process.send(message);
                console.log(`📤 [IPC] Mensagem enviada: ${type}`);
            }
            catch (error) {
                console.error(`❌ [IPC] Erro ao enviar mensagem:`, error);
                this.fallbackToFile(message);
            }
        }
        else {
            // Fallback para arquivo
            this.fallbackToFile(message);
        }
    }
    /**
     * Fallback: salva mensagem em arquivo para o processo principal ler
     */
    fallbackToFile(message) {
        try {
            let messages = [];
            // Ler mensagens existentes
            if (fs_1.default.existsSync(this.messageFile)) {
                const content = fs_1.default.readFileSync(this.messageFile, 'utf8');
                if (content.trim()) {
                    messages = JSON.parse(content);
                }
            }
            // Adicionar nova mensagem
            messages.push(message);
            // Manter apenas últimas 50 mensagens
            if (messages.length > 50) {
                messages = messages.slice(-50);
            }
            // Salvar arquivo
            fs_1.default.writeFileSync(this.messageFile, JSON.stringify(messages, null, 2));
            console.log(`📤 [FILE] Mensagem salva: ${message.payload.action}`);
        }
        catch (error) {
            console.error(`❌ [FILE] Erro ao salvar mensagem:`, error);
        }
    }
    /**
     * Lê mensagens do arquivo (para o processo principal)
     */
    readMessages() {
        try {
            if (!fs_1.default.existsSync(this.messageFile)) {
                return [];
            }
            const content = fs_1.default.readFileSync(this.messageFile, 'utf8');
            if (!content.trim()) {
                return [];
            }
            const messages = JSON.parse(content);
            // Limpar arquivo após ler
            fs_1.default.writeFileSync(this.messageFile, '[]');
            return messages;
        }
        catch (error) {
            console.error(`❌ [FILE] Erro ao ler mensagens:`, error);
            return [];
        }
    }
    /**
     * Verifica se há mensagens pendentes
     */
    hasMessages() {
        try {
            if (!fs_1.default.existsSync(this.messageFile)) {
                return false;
            }
            const content = fs_1.default.readFileSync(this.messageFile, 'utf8');
            if (!content.trim()) {
                return false;
            }
            const messages = JSON.parse(content);
            return Array.isArray(messages) && messages.length > 0;
        }
        catch (error) {
            return false;
        }
    }
}
exports.WorkerCommunication = WorkerCommunication;
exports.default = WorkerCommunication;
//# sourceMappingURL=WorkerCommunication.js.map