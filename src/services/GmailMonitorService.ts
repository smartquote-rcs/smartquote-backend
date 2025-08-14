/**
 * Serviço para monitorar e processar emails do Gmail
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

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

interface EmailProcessingStatus {
  processed: string[]; // IDs dos emails já processados
  lastCheck: Date;
}

class GmailMonitorService {
  private oauth2Client: OAuth2Client | null = null;
  private readonly tokenPath = path.join(__dirname, '../tData.json');
  private readonly credentialsPath = path.join(__dirname, '../cData.json');
  private readonly statusPath = path.join(__dirname, '../data/email_status.json');
  private readonly scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

  constructor() {
    this.ensureDataDirectory();
  }

  /**
   * Garante que o diretório de dados existe
   */
  private ensureDataDirectory(): void {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Carrega credenciais e autoriza o cliente
   */
  async authorize(): Promise<OAuth2Client> {
    if (this.oauth2Client) {
      return this.oauth2Client;
    }

    // Tentar carregar credenciais de variáveis de ambiente primeiro
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

    if (clientId && clientSecret) {
      // Usar credenciais de variáveis de ambiente (PRODUÇÃO)
      console.log('🔑 Usando credenciais do ambiente');
      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );
    } else {
      // Carregar credenciais do arquivo (DESENVOLVIMENTO)
      console.log('🔑 Usando credenciais do arquivo');
      const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
      const { client_id, client_secret, redirect_uris } = credentials.web;
      
      this.oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );
    }

    // Tentar carregar token de variáveis de ambiente primeiro
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const expiryDate = process.env.GOOGLE_TOKEN_EXPIRY;

    if (accessToken && refreshToken) {
      // Usar tokens de variáveis de ambiente (PRODUÇÃO)
      console.log('🔑 Usando tokens do ambiente');
      this.oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: expiryDate ? parseInt(expiryDate) : undefined,
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
        token_type: 'Bearer'
      });
    } else {
      // Tentar carregar token do arquivo (DESENVOLVIMENTO)
      try {
        const token = fs.readFileSync(this.tokenPath, 'utf8');
        this.oauth2Client.setCredentials(JSON.parse(token));
        console.log('🔑 Token OAuth2 carregado do arquivo');
      } catch (error) {
        console.warn('⚠️  Token não encontrado. É necessário autorizar manualmente.');
        throw new Error('Token OAuth2 não encontrado. Configure as variáveis de ambiente ou execute a autorização manual.');
      }
    }

    return this.oauth2Client;
  }

  /**
   * Carrega o status do processamento de emails
   */
  private loadProcessingStatus(): EmailProcessingStatus {
    try {
      const data = fs.readFileSync(this.statusPath, 'utf8');
      const status = JSON.parse(data);
      return {
        processed: status.processed || [],
        lastCheck: new Date(status.lastCheck || '2025-01-01')
      };
    } catch (error) {
      // Se arquivo não existe, criar status inicial
      return {
        processed: [],
        lastCheck: new Date()
      };
    }
  }

  /**
   * Salva o status do processamento de emails
   */
  private saveProcessingStatus(status: EmailProcessingStatus): void {
    fs.writeFileSync(this.statusPath, JSON.stringify(status, null, 2));
  }

  /**
   * Lista emails da caixa de entrada
   */
  async listRecentEmails(maxResults: number = 4): Promise<string[]> {
    const auth = await this.authorize();
    const gmail = google.gmail({ version: 'v1', auth });

    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults * 2, // Buscar mais para filtrar duplicados
        labelIds: ['INBOX'],
        q: 'is:unread OR newer_than:1d' // Emails não lidos ou dos últimos 1 dia
      });

      return response.data.messages?.map(msg => msg.id!) || [];
    } catch (error) {
      console.error('❌ Erro ao listar emails:', error);
      throw error;
    }
  }

  /**
   * Obtém conteúdo completo de um email
   */
  async getEmailContent(messageId: string): Promise<EmailData | null> {
    const auth = await this.authorize();
    const gmail = google.gmail({ version: 'v1', auth });

    try {
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = response.data;
      const headers = message.payload?.headers || [];

      // Extrair informações dos headers
      const getHeader = (name: string) => {
        const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
        return header?.value || '';
      };

      const from = getHeader('from');
      const subject = getHeader('subject');
      const date = getHeader('date');

      // Decodificar o corpo do email
      const content = this.decodeEmailBody(message);

      return {
        id: messageId,
        threadId: message.threadId || '',
        snippet: message.snippet || '',
        from,
        subject,
        date,
        content,
        raw: message
      };
    } catch (error) {
      console.error(`❌ Erro ao obter email ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Decodifica o corpo do email
   */
  private decodeEmailBody(message: any): string {
    const payload = message.payload;
    
    if (!payload) return '';

    // Se tem partes múltiplas (multipart)
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf8');
        }
      }
      
      // Se não encontrou text/plain, tentar HTML
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          const htmlContent = Buffer.from(part.body.data, 'base64').toString('utf8');
          // Remover tags HTML básicas (implementação simples)
          return htmlContent.replace(/<[^>]*>/g, '').trim();
        }
      }
    }

    // Email simples (não multipart)
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf8');
    }

    return message.snippet || '';
  }

  /**
   * Monitora emails novos (não processados anteriormente)
   */
  async monitorNewEmails(): Promise<EmailData[]> {
    console.log('📧 Iniciando monitoramento de emails...');
    
    const status = this.loadProcessingStatus();
    const emailIds = await this.listRecentEmails(4);
    
    // Filtrar apenas emails não processados
    const newEmailIds = emailIds.filter(id => !status.processed.includes(id));
    
    if (newEmailIds.length === 0) {
      console.log('✅ Nenhum email novo encontrado');
      return [];
    }

    console.log(`📬 ${newEmailIds.length} emails novos encontrados`);
    
    const newEmails: EmailData[] = [];
    
    for (const emailId of newEmailIds.slice(0, 4)) { // Limitar a 4
      const emailData = await this.getEmailContent(emailId);
      if (emailData) {
        newEmails.push(emailData);
        status.processed.push(emailId);
        console.log(`✅ Email processado: ${emailData.subject.substring(0, 50)}...`);
      }
    }

    // Atualizar status
    status.lastCheck = new Date();
    this.saveProcessingStatus(status);

    return newEmails;
  }

  /**
   * Remove emails antigos do status (limpeza)
   */
  cleanOldEmailStatus(daysToKeep: number = 30): void {
    const status = this.loadProcessingStatus();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Manter apenas últimos IDs processados (implementação simples)
    // Em produção, você poderia verificar a data real dos emails
    if (status.processed.length > 100) {
      status.processed = status.processed.slice(-50); // Manter últimos 50
    }

    this.saveProcessingStatus(status);
    console.log(`🧹 Limpeza do status de emails realizada`);
  }
}

export { GmailMonitorService };
export type { EmailData };
export default GmailMonitorService;
