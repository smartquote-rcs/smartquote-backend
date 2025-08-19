/**
 * Serviço para monitorar e processar emails do Gmail
 */
import { OAuth2Client } from 'google-auth-library';
interface EmailData {
    id: string;
    threadId: string;
    snippet: string;
    from: string;
    subject: string;
    date: string;
    content: string;
    raw?: any;
}
declare class GmailMonitorService {
    private oauth2Client;
    private readonly tokenPath;
    private readonly credentialsPath;
    private readonly statusPath;
    private readonly scopes;
    constructor();
    /**
     * Garante que o diretório de dados existe
     */
    private ensureDataDirectory;
    /**
     * Carrega credenciais e autoriza o cliente
     */
    authorize(): Promise<OAuth2Client>;
    /**
     * Carrega o status do processamento de emails
     */
    private loadProcessingStatus;
    /**
     * Salva o status do processamento de emails
     */
    private saveProcessingStatus;
    /**
     * Lista emails da caixa de entrada
     */
    listRecentEmails(maxResults?: number): Promise<string[]>;
    /**
     * Obtém conteúdo completo de um email
     */
    getEmailContent(messageId: string): Promise<EmailData | null>;
    /**
     * Decodifica o corpo do email
     */
    private decodeEmailBody;
    /**
     * Monitora emails novos (não processados anteriormente)
     */
    monitorNewEmails(): Promise<EmailData[]>;
    /**
     * Remove emails antigos do status (limpeza)
     */
    cleanOldEmailStatus(daysToKeep?: number): void;
}
export { GmailMonitorService };
export type { EmailData };
export default GmailMonitorService;
//# sourceMappingURL=GmailMonitorService.d.ts.map