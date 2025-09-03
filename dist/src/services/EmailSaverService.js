"use strict";
/**
 * Serviço para salvar emails capturados em diferentes formatos
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class EmailSaverService {
    emailsDir = path_1.default.join(process.cwd(), 'src/data/emails');
    jsonDir = path_1.default.join(this.emailsDir, 'json');
    metadataPath = path_1.default.join(this.emailsDir, 'saved_emails_metadata.json');
    constructor() {
        this.ensureDirectories();
    }
    /**
     * Garante que os diretórios necessários existem
     */
    ensureDirectories() {
        const dirs = [this.emailsDir, this.jsonDir];
        dirs.forEach(dir => {
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
        });
    }
    /**
     * Gera nome de arquivo único baseado no email
     */
    generateFileName(email, extension) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeSubject = email.subject
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .trim()
            .substring(0, 30)
            .replace(/\s+/g, '_');
        return `${timestamp}_${email.id}_${safeSubject}.${extension}`;
    }
    /**
     * Salva email em formato JSON
     */
    async saveAsJSON(email, includeRaw = false) {
        const fileName = this.generateFileName(email, 'json');
        const filePath = path_1.default.join(this.jsonDir, fileName);
        const emailDataToSave = {
            ...email,
            savedAt: new Date().toISOString(),
            ...(includeRaw ? {} : { raw: undefined })
        };
        fs_1.default.writeFileSync(filePath, JSON.stringify(emailDataToSave, null, 2), 'utf8');
        console.log(`💾 Email salvo como JSON: ${fileName}`);
        return filePath;
    }
    /**
     * Carrega metadados dos emails salvos
     */
    loadMetadata() {
        try {
            if (!fs_1.default.existsSync(this.metadataPath)) {
                return [];
            }
            const data = fs_1.default.readFileSync(this.metadataPath, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            console.warn('⚠️ Erro ao carregar metadados:', error);
            return [];
        }
    }
    /**
     * Salva metadados dos emails salvos
     */
    saveMetadata(metadata) {
        try {
            fs_1.default.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2));
        }
        catch (error) {
            console.error('❌ Erro ao salvar metadados:', error);
        }
    }
    /**
     * Salva um email em formato JSON
     */
    async saveEmail(email, options = { saveAsJSON: true, includeRawData: false }) {
        console.log(`💾 Salvando email: ${email.subject.substring(0, 50)}...`);
        const savedPaths = [];
        const formats = [];
        try {
            // Salvar como JSON
            if (options.saveAsJSON) {
                const jsonPath = await this.saveAsJSON(email, options.includeRawData);
                savedPaths.push(jsonPath);
                formats.push('json');
            }
            // Criar metadata
            const metadata = {
                id: email.id,
                savedAt: new Date(),
                formats,
                filePaths: savedPaths
            };
            // Salvar metadata
            const allMetadata = this.loadMetadata();
            allMetadata.push(metadata);
            this.saveMetadata(allMetadata);
            console.log(`✅ Email ${email.id} salvo com sucesso em JSON`);
            return metadata;
        }
        catch (error) {
            console.error(`❌ Erro ao salvar email ${email.id}:`, error);
            throw error;
        }
    }
    /**
     * Salva múltiplos emails
     */
    async saveEmails(emails, options = { saveAsJSON: true, includeRawData: false }) {
        console.log(`💾 Salvando ${emails.length} emails...`);
        const results = [];
        for (const email of emails) {
            try {
                const metadata = await this.saveEmail(email, options);
                results.push(metadata);
            }
            catch (error) {
                console.error(`❌ Falha ao salvar email ${email.id}:`, error);
            }
        }
        console.log(`✅ ${results.length}/${emails.length} emails salvos com sucesso`);
        return results;
    }
    /**
     * Verifica se um email já foi salvo
     */
    isEmailSaved(emailId) {
        const metadata = this.loadMetadata();
        return metadata.some(m => m.id === emailId);
    }
    /**
     * Lista emails salvos
     */
    getSavedEmailsMetadata() {
        return this.loadMetadata();
    }
    /**
     * Limpa arquivos antigos
     */
    cleanOldFiles(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const metadata = this.loadMetadata();
        const toKeep = [];
        for (const item of metadata) {
            const itemDate = new Date(item.savedAt);
            if (itemDate > cutoffDate) {
                toKeep.push(item);
            }
            else {
                // Remover arquivos físicos
                for (const filePath of item.filePaths) {
                    try {
                        if (fs_1.default.existsSync(filePath)) {
                            fs_1.default.unlinkSync(filePath);
                            console.log(`🗑️ Arquivo removido: ${path_1.default.basename(filePath)}`);
                        }
                    }
                    catch (error) {
                        console.warn(`⚠️ Erro ao remover arquivo ${filePath}:`, error);
                    }
                }
            }
        }
        this.saveMetadata(toKeep);
        console.log(`🧹 Limpeza concluída. ${toKeep.length}/${metadata.length} emails mantidos`);
    }
    /**
     * Carrega dados completos de um email salvo
     */
    loadEmailFromFile(emailId) {
        try {
            const metadata = this.loadMetadata();
            const emailMeta = metadata.find(item => item.id === emailId);
            if (!emailMeta) {
                console.warn(`⚠️ Email ${emailId} não encontrado nos metadados`);
                return null;
            }
            // Buscar arquivo JSON
            const jsonPath = emailMeta.filePaths.find(path => path.endsWith('.json'));
            if (!jsonPath) {
                console.warn(`⚠️ Arquivo JSON não encontrado para email ${emailId}`);
                return null;
            }
            if (!fs_1.default.existsSync(jsonPath)) {
                console.warn(`⚠️ Arquivo JSON não existe: ${jsonPath}`);
                return null;
            }
            const jsonContent = fs_1.default.readFileSync(jsonPath, 'utf8');
            const emailData = JSON.parse(jsonContent);
            console.log(`📂 Email ${emailId} carregado com sucesso`);
            return emailData;
        }
        catch (error) {
            console.error(`❌ Erro ao carregar email ${emailId}:`, error);
            return null;
        }
    }
}
exports.default = EmailSaverService;
//# sourceMappingURL=EmailSaverService.js.map