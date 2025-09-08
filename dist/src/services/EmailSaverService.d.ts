/**
 * Serviço para salvar emails capturados em diferentes formatos
 */
import type { EmailData } from './GmailMonitorService';
interface EmailSaveOptions {
    saveAsJSON?: boolean;
    includeRawData?: boolean;
}
interface SavedEmailMetadata {
    id: string;
    savedAt: Date;
    formats: string[];
    filePaths: string[];
}
declare class EmailSaverService {
    private readonly emailsDir;
    private readonly jsonDir;
    private readonly metadataPath;
    constructor();
    /**
     * Garante que os diretórios necessários existem
     */
    private ensureDirectories;
    /**
     * Gera nome de arquivo único baseado no email
     */
    private generateFileName;
    /**
     * Salva email em formato JSON
     */
    private saveAsJSON;
    /**
     * Carrega metadados dos emails salvos
     */
    private loadMetadata;
    /**
     * Salva metadados dos emails salvos
     */
    private saveMetadata;
    /**
     * Salva um email em formato JSON
     */
    saveEmail(email: EmailData, options?: EmailSaveOptions): Promise<SavedEmailMetadata>;
    /**
     * Salva múltiplos emails
     */
    saveEmails(emails: EmailData[], options?: EmailSaveOptions): Promise<SavedEmailMetadata[]>;
    /**
     * Verifica se um email já foi salvo
     */
    isEmailSaved(emailId: string): boolean;
    /**
     * Lista emails salvos
     */
    getSavedEmailsMetadata(): SavedEmailMetadata[];
    /**
     * Limpa arquivos antigos
     */
    cleanOldFiles(daysToKeep?: number): void;
    /**
     * Carrega dados completos de um email salvo
     */
    loadEmailFromFile(emailId: string): EmailData | null;
}
export default EmailSaverService;
export type { EmailSaveOptions, SavedEmailMetadata };
//# sourceMappingURL=EmailSaverService.d.ts.map