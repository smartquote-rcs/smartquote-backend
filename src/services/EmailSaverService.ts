/**
 * Serviço para salvar emails capturados em diferentes formatos
 */

import fs from 'fs';
import path from 'path';
// import PDFDocument from 'pdfkit';  // Temporariamente comentado para resolver erro tslib
import type { EmailData } from './GmailMonitorService';

interface EmailSaveOptions {
  saveAsJSON?: boolean;
  saveAsPDF?: boolean;
  includeRawData?: boolean;
}

interface SavedEmailMetadata {
  id: string;
  savedAt: Date;
  formats: string[]; // ['json', 'pdf']
  filePaths: string[];
}

class EmailSaverService {
  private readonly emailsDir = path.join(__dirname, '../data/emails');
  private readonly jsonDir = path.join(this.emailsDir, 'json');
  private readonly pdfDir = path.join(this.emailsDir, 'pdf');
  private readonly metadataPath = path.join(this.emailsDir, 'saved_emails_metadata.json');

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Garante que os diretórios necessários existem
   */
  private ensureDirectories(): void {
    const dirs = [this.emailsDir, this.jsonDir, this.pdfDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Gera nome de arquivo único baseado no email
   */
  private generateFileName(email: EmailData, extension: string): string {
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
  private async saveAsJSON(email: EmailData, includeRaw: boolean = false): Promise<string> {
    const fileName = this.generateFileName(email, 'json');
    const filePath = path.join(this.jsonDir, fileName);

    const emailDataToSave = {
      ...email,
      savedAt: new Date().toISOString(),
      ...(includeRaw ? {} : { raw: undefined })
    };

    fs.writeFileSync(filePath, JSON.stringify(emailDataToSave, null, 2), 'utf8');
    console.log(`💾 Email salvo como JSON: ${fileName}`);
    
    return filePath;
  }

  /**
   * Salva email em formato PDF
   */
  private async saveAsPDF(email: EmailData): Promise<string> {
    // Temporariamente desabilitado devido a problema com tslib
    console.log('⚠️  Geração de PDF temporariamente desabilitada');
    const fileName = this.generateFileName(email, 'txt');
    const filePath = path.join(this.pdfDir, fileName);

    // Criar arquivo de texto simples como alternativa temporária
    const content = `Email Capturado
================

ID: ${email.id}
De: ${email.from}
Assunto: ${email.subject}
Data: ${email.date}
Thread ID: ${email.threadId}

Resumo:
${email.snippet || 'Sem resumo disponível'}

Conteúdo Completo:
${email.content || 'Conteúdo não disponível'}

Salvo em: ${new Date().toLocaleString('pt-BR')}
`;

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`📄 Email salvo como TXT: ${fileName}`);
    
    return filePath;
  }

  /**
   * Carrega metadados dos emails salvos
   */
  private loadMetadata(): SavedEmailMetadata[] {
    try {
      if (!fs.existsSync(this.metadataPath)) {
        return [];
      }
      const data = fs.readFileSync(this.metadataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('⚠️ Erro ao carregar metadados:', error);
      return [];
    }
  }

  /**
   * Salva metadados dos emails salvos
   */
  private saveMetadata(metadata: SavedEmailMetadata[]): void {
    try {
      fs.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar metadados:', error);
    }
  }

  /**
   * Salva um email nos formatos especificados
   */
  async saveEmail(
    email: EmailData, 
    options: EmailSaveOptions = { saveAsJSON: true, saveAsPDF: true, includeRawData: false }
  ): Promise<SavedEmailMetadata> {
    console.log(`💾 Salvando email: ${email.subject.substring(0, 50)}...`);

    const savedPaths: string[] = [];
    const formats: string[] = [];

    try {
      // Salvar como JSON
      if (options.saveAsJSON) {
        const jsonPath = await this.saveAsJSON(email, options.includeRawData);
        savedPaths.push(jsonPath);
        formats.push('json');
      }

      // Salvar como PDF
      if (options.saveAsPDF) {
        const pdfPath = await this.saveAsPDF(email);
        savedPaths.push(pdfPath);
        formats.push('pdf');
      }

      // Criar metadata
      const metadata: SavedEmailMetadata = {
        id: email.id,
        savedAt: new Date(),
        formats,
        filePaths: savedPaths
      };

      // Salvar metadata
      const allMetadata = this.loadMetadata();
      allMetadata.push(metadata);
      this.saveMetadata(allMetadata);

      console.log(`✅ Email ${email.id} salvo com sucesso em ${formats.length} formato(s)`);
      return metadata;

    } catch (error) {
      console.error(`❌ Erro ao salvar email ${email.id}:`, error);
      throw error;
    }
  }

  /**
   * Salva múltiplos emails
   */
  async saveEmails(
    emails: EmailData[], 
    options: EmailSaveOptions = { saveAsJSON: true, saveAsPDF: true, includeRawData: false }
  ): Promise<SavedEmailMetadata[]> {
    console.log(`💾 Salvando ${emails.length} emails...`);

    const results: SavedEmailMetadata[] = [];

    for (const email of emails) {
      try {
        const metadata = await this.saveEmail(email, options);
        results.push(metadata);
      } catch (error) {
        console.error(`❌ Falha ao salvar email ${email.id}:`, error);
      }
    }

    console.log(`✅ ${results.length}/${emails.length} emails salvos com sucesso`);
    return results;
  }

  /**
   * Verifica se um email já foi salvo
   */
  isEmailSaved(emailId: string): boolean {
    const metadata = this.loadMetadata();
    return metadata.some(m => m.id === emailId);
  }

  /**
   * Lista emails salvos
   */
  getSavedEmailsMetadata(): SavedEmailMetadata[] {
    return this.loadMetadata();
  }

  /**
   * Limpa arquivos antigos
   */
  cleanOldFiles(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const metadata = this.loadMetadata();
    const toKeep: SavedEmailMetadata[] = [];

    for (const item of metadata) {
      const itemDate = new Date(item.savedAt);
      
      if (itemDate > cutoffDate) {
        toKeep.push(item);
      } else {
        // Remover arquivos físicos
        for (const filePath of item.filePaths) {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`🗑️ Arquivo removido: ${path.basename(filePath)}`);
            }
          } catch (error) {
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
  loadEmailFromFile(emailId: string): EmailData | null {
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

      if (!fs.existsSync(jsonPath)) {
        console.warn(`⚠️ Arquivo JSON não existe: ${jsonPath}`);
        return null;
      }

      const jsonContent = fs.readFileSync(jsonPath, 'utf8');
      const emailData = JSON.parse(jsonContent) as EmailData;
      
      console.log(`📂 Email ${emailId} carregado com sucesso`);
      return emailData;

    } catch (error) {
      console.error(`❌ Erro ao carregar email ${emailId}:`, error);
      return null;
    }
  }
}

export default EmailSaverService;
export type { EmailSaveOptions, SavedEmailMetadata };
