/**
 * Serviço para salvar emails capturados em diferentes formatos
 */

import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
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
    const fileName = this.generateFileName(email, 'pdf');
    const filePath = path.join(this.pdfDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Cabeçalho do PDF
        doc.fontSize(16).font('Helvetica-Bold').text('Email Capturado', { align: 'center' });
        doc.moveDown();

        // Informações do email
        doc.fontSize(12).font('Helvetica-Bold').text('ID:', { continued: true });
        doc.font('Helvetica').text(` ${email.id}`);

        doc.font('Helvetica-Bold').text('De:', { continued: true });
        doc.font('Helvetica').text(` ${email.from}`);

        doc.font('Helvetica-Bold').text('Assunto:', { continued: true });
        doc.font('Helvetica').text(` ${email.subject}`);

        doc.font('Helvetica-Bold').text('Data:', { continued: true });
        doc.font('Helvetica').text(` ${email.date}`);

        doc.font('Helvetica-Bold').text('Thread ID:', { continued: true });
        doc.font('Helvetica').text(` ${email.threadId}`);

        doc.moveDown();

        // Resumo
        doc.font('Helvetica-Bold').text('Resumo:');
        doc.font('Helvetica').text(email.snippet || 'Sem resumo disponível', {
          width: 500,
          align: 'justify'
        });

        doc.moveDown();

        // Conteúdo completo
        doc.font('Helvetica-Bold').text('Conteúdo Completo:');
        doc.font('Helvetica').text(email.content || 'Conteúdo não disponível', {
          width: 500,
          align: 'justify'
        });

        // Rodapé
        doc.moveDown(2);
        doc.fontSize(10).text(`Salvo em: ${new Date().toLocaleString('pt-BR')}`, {
          align: 'center'
        });

        doc.end();

        stream.on('finish', () => {
          console.log(`📄 Email salvo como PDF: ${fileName}`);
          resolve(filePath);
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
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
}

export default EmailSaverService;
export type { EmailSaveOptions, SavedEmailMetadata };
