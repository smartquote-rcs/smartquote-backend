/**
 * Serviço de comunicação entre worker e processo principal
 * Funciona tanto com IPC quanto com arquivos em produção
 */

import fs from 'fs';
import path from 'path';

interface WorkerMessage {
  type: string;
  payload: {
    action: string;
    timestamp: string;
    data: any;
  };
}

export class WorkerCommunication {
  private readonly messageDir = path.join(__dirname, '../data/worker-messages');
  private readonly messageFile = path.join(this.messageDir, 'messages.json');
  private isIPCAvailable: boolean;

  constructor() {
    this.isIPCAvailable = !!(process.send && process.connected);
    
    if (!this.isIPCAvailable) {
      this.ensureMessageDirectory();
      console.log('📡 [WORKER-COMM] IPC não disponível, usando comunicação via arquivos');
    } else {
      console.log('📡 [WORKER-COMM] IPC disponível, usando comunicação direta');
    }
  }

  /**
   * Garante que o diretório de mensagens existe
   */
  private ensureMessageDirectory(): void {
    if (!fs.existsSync(this.messageDir)) {
      fs.mkdirSync(this.messageDir, { recursive: true });
    }
  }

  /**
   * Envia mensagem do worker para o processo principal
   */
  sendMessage(type: string, data: any): void {
    const message: WorkerMessage = {
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
        process.send!(message);
        console.log(`📤 [IPC] Mensagem enviada: ${type}`);
      } catch (error) {
        console.error(`❌ [IPC] Erro ao enviar mensagem:`, error);
        this.fallbackToFile(message);
      }
    } else {
      // Fallback para arquivo
      this.fallbackToFile(message);
    }
  }

  /**
   * Fallback: salva mensagem em arquivo para o processo principal ler
   */
  private fallbackToFile(message: WorkerMessage): void {
    try {
      let messages: WorkerMessage[] = [];
      
      // Ler mensagens existentes
      if (fs.existsSync(this.messageFile)) {
        const content = fs.readFileSync(this.messageFile, 'utf8');
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
      fs.writeFileSync(this.messageFile, JSON.stringify(messages, null, 2));
      console.log(`📤 [FILE] Mensagem salva: ${message.payload.action}`);
      
    } catch (error) {
      console.error(`❌ [FILE] Erro ao salvar mensagem:`, error);
    }
  }

  /**
   * Lê mensagens do arquivo (para o processo principal)
   */
  readMessages(): WorkerMessage[] {
    try {
      if (!fs.existsSync(this.messageFile)) {
        return [];
      }
      
      const content = fs.readFileSync(this.messageFile, 'utf8');
      if (!content.trim()) {
        return [];
      }
      
      const messages = JSON.parse(content);
      
      // Limpar arquivo após ler
      fs.writeFileSync(this.messageFile, '[]');
      
      return messages;
      
    } catch (error) {
      console.error(`❌ [FILE] Erro ao ler mensagens:`, error);
      return [];
    }
  }

  /**
   * Verifica se há mensagens pendentes
   */
  hasMessages(): boolean {
    try {
      if (!fs.existsSync(this.messageFile)) {
        return false;
      }
      
      const content = fs.readFileSync(this.messageFile, 'utf8');
      if (!content.trim()) {
        return false;
      }
      
      const messages = JSON.parse(content);
      return Array.isArray(messages) && messages.length > 0;
      
    } catch (error) {
      return false;
    }
  }
}

export default WorkerCommunication;
