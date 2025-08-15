/**
 * Serviço para gerenciar o monitoramento automático de emails
 * Usa o padrão de workers em background similar ao JobManager
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import EmailSaverService from './EmailSaverService';
import GeminiInterpretationService from './GeminiInterpretationService';
import WorkerCommunication from './WorkerCommunication';
import type { EmailData } from './GmailMonitorService';

interface AutoMonitorStatus {
  isRunning: boolean;
  startTime: Date | null;
  lastCheck: Date | null;
  totalEmailsProcessed: number;
  errorCount: number;
  config: {
    intervalSeconds: number;
    maxEmails: number;
    enabled: boolean;
  };
  recentEmails: any[];
  messages: string[];
}

interface EmailDetectedEvent {
  emailId: string;
  from: string;
  subject: string;
  date: string;
  content: string;
}

class AutoEmailMonitorService {
  private worker: ChildProcess | null = null;
  private status: AutoMonitorStatus;
  private messages: string[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  private emailSaver: EmailSaverService;
  private geminiService: GeminiInterpretationService;
  private workerComm: WorkerCommunication;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.emailSaver = new EmailSaverService();
    this.geminiService = new GeminiInterpretationService();
    this.workerComm = new WorkerCommunication();
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
  }

  /**
   * Inicia o monitoramento automático
   */
  async startAutoMonitoring(): Promise<{ success: boolean; message: string; error?: string }> {
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
      const workerPath = path.join(__dirname, '../workers/emailMonitorWorker.ts');
      
      console.log(`📁 Worker path: ${workerPath}`);
      
      if (isDevelopment) {
        // Desenvolvimento: usar ts-node/register
        console.log('🔧 Usando ts-node/register para desenvolvimento');
        this.worker = spawn('node', ['-r', 'ts-node/register', workerPath], {
          stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
          cwd: path.join(__dirname, '../..'),
          env: { ...process.env }
        });
      } else {
        // Produção: compilar TypeScript ou usar JavaScript
        const jsWorkerPath = path.join(__dirname, '../workers/emailMonitorWorker.js');
        
        // Verificar se arquivo JS existe
        const fs = require('fs');
        if (fs.existsSync(jsWorkerPath)) {
          console.log('🔧 Usando arquivo JavaScript compilado para produção');
          this.worker = spawn('node', [jsWorkerPath], {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
            cwd: path.join(__dirname, '../..'),
            env: { ...process.env }
          });
        } else {
          console.log('🔧 Fallback: usando ts-node em produção');
          this.worker = spawn('node', ['-r', 'ts-node/register', workerPath], {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
            cwd: path.join(__dirname, '../..'),
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

    } catch (error: any) {
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
  async stopAutoMonitoring(): Promise<{ success: boolean; message: string }> {
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

    } catch (error: any) {
      console.error('❌ Erro ao parar monitoramento automático:', error);
      return {
        success: false,
        message: 'Erro ao parar monitoramento automático'
      };
    }
  }

  /**
   * Configura os handlers do worker
   */
  private setupWorkerHandlers(): void {
    if (!this.worker) return;

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

    this.worker.on('message', (message: any) => {
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
  private processWorkerMessage(message: any): void {
    console.log(`📨 [DEBUG] Mensagem recebida do worker:`, message);
    
    if (message.type === 'WORKER_MSG') {
      const { action, data, timestamp } = message.payload;

      console.log(`📨 [DEBUG] Action: ${action}, Data:`, data);

      switch (action) {
        case 'EMAIL_DETECTED':
          console.log(`📧 [DEBUG] Chamando handleEmailDetected...`);
          this.handleEmailDetected(data as EmailDetectedEvent);
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
  private async handleEmailDetected(emailData: EmailDetectedEvent): Promise<void> {
    console.log(`📧 [AUTO-DETECTED] Novo email: ${emailData.subject}`);
    console.log(`📧 [DEBUG] Email data:`, {
      id: emailData.emailId,
      from: emailData.from,
      subject: emailData.subject,
      date: emailData.date,
      contentLength: emailData.content?.length || 0
    });
    
    // ✅ VERIFICAÇÃO DE DUPLICADOS
    const isAlreadySaved = this.emailSaver.isEmailSaved(emailData.emailId);
    if (isAlreadySaved) {
      console.log(`🔄 [DUPLICADO] Email ${emailData.emailId} já foi salvo anteriormente - ignorando`);
      this.addMessage(`🔄 Email duplicado ignorado: ${emailData.subject.substring(0, 50)}...`);
      return;
    }
    
    this.status.totalEmailsProcessed++;
    this.status.lastCheck = new Date();

    // Converter EmailDetectedEvent para EmailData para salvamento
    const emailToSave: EmailData = {
      id: emailData.emailId,
      threadId: '', // Será preenchido pelo worker se necessário
      snippet: emailData.subject, // Usar assunto como snippet temporário
      from: emailData.from,
      subject: emailData.subject,
      date: emailData.date,
      content: emailData.content
    };

    // Salvar email automaticamente
    try {
      console.log(`💾 [DEBUG] Iniciando salvamento do email ${emailData.emailId}...`);
      
      await this.emailSaver.saveEmail(emailToSave, {
        saveAsJSON: true,
        includeRawData: false
      });
      
      console.log(`💾 [AUTO-SAVED] Email ${emailData.emailId} salvo automaticamente`);
      this.addMessage(`💾 Email salvo: ${emailData.subject.substring(0, 50)}...`);
      
      // Interpretar email com Gemini AI automaticamente
      await this.interpretEmailWithGemini(emailToSave);
      
    } catch (error) {
      console.error(`❌ [SAVE-ERROR] Falha ao salvar email ${emailData.emailId}:`, error);
      this.addMessage(`❌ Erro ao salvar email: ${error}`);
    }

    // Executar callbacks registrados
    this.callbacks.forEach((callback, key) => {
      try {
        callback(emailData);
      } catch (error) {
        console.error(`❌ Erro no callback ${key}:`, error);
      }
    });
  }

  /**
   * Manipula erros de monitoramento
   */
  private handleMonitoringError(errorData: any): void {
    console.error('🚨 Erro no monitoramento automático:', errorData);
    this.status.errorCount++;
    this.addMessage(`ERRO: ${errorData.error}`);
  }

  /**
   * Atualiza status com dados do worker
   */
  private updateStatusFromWorker(workerStatus: any): void {
    this.status.config = workerStatus.config;
    this.status.lastCheck = new Date(workerStatus.lastCheck);
    this.status.recentEmails = workerStatus.recentEmails;
    this.status.errorCount = workerStatus.errorCount;
  }

  /**
   * Envia comando para o worker
   */
  private sendCommandToWorker(action: string, params: any): void {
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
  private addMessage(message: string): void {
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
  getStatus(): AutoMonitorStatus {
    return {
      ...this.status,
      messages: [...this.messages]
    };
  }

  /**
   * Registra callback para quando emails são detectados
   */
  onEmailDetected(key: string, callback: (emailData: EmailDetectedEvent) => void): void {
    this.callbacks.set(key, callback);
  }

  /**
   * Remove callback
   */
  removeEmailCallback(key: string): void {
    this.callbacks.delete(key);
  }

  /**
   * Atualiza configurações do worker
   */
  updateConfig(newConfig: Partial<AutoMonitorStatus['config']>): Promise<void> {
    return new Promise((resolve) => {
      this.sendCommandToWorker('UPDATE_CONFIG', newConfig);
      this.status.config = { ...this.status.config, ...newConfig };
      resolve();
    });
  }

  /**
   * Solicita emails recentes do worker
   */
  async getRecentEmails(limit: number = 10): Promise<any[]> {
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
        } else {
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
  isEmailSaved(emailId: string): boolean {
    return this.emailSaver.isEmailSaved(emailId);
  }

  /**
   * Limpa emails antigos salvos
   */
  cleanOldSavedEmails(daysToKeep: number = 30): void {
    this.emailSaver.cleanOldFiles(daysToKeep);
  }

  /**
   * Obtém o serviço de salvamento de emails
   */
  getEmailSaverService(): EmailSaverService {
    return this.emailSaver;
  }

  /**
   * Interpreta email usando Gemini AI
   */
  private async interpretEmailWithGemini(emailData: EmailData): Promise<void> {
    try {
      console.log(`🧠 [GEMINI] Iniciando interpretação do email ${emailData.id}...`);
      
      const interpretation = await this.geminiService.interpretEmail(emailData);
      
      console.log(`🧠 [GEMINI-SUCCESS] Email ${emailData.id} interpretado: ${interpretation.tipo} (${interpretation.confianca}% confiança)`);
      this.addMessage(`🧠 Interpretado: ${interpretation.tipo} - ${interpretation.resumo.substring(0, 50)}...`);
      
      // Log das informações extraídas
      if (interpretation.produtos.length > 0) {
        console.log(`📦 [GEMINI] ${interpretation.produtos.length} produto(s) identificado(s)`);
      }
      
      if (interpretation.acoes_sugeridas.length > 0) {
        console.log(`💡 [GEMINI] Ações sugeridas: ${interpretation.acoes_sugeridas.join(', ')}`);
      }
      
    } catch (error: any) {
      console.error(`❌ [GEMINI-ERROR] Falha ao interpretar email ${emailData.id}:`, error.message);
      this.addMessage(`❌ Erro na interpretação: ${error.message}`);
    }
  }

  /**
   * Obtém interpretação de um email específico
   */
  async getEmailInterpretation(emailId: string) {
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
  private startMessagePolling(): void {
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
      } catch (error) {
        console.error('❌ Erro no polling de mensagens:', error);
      }
    }, 2000); // Polling a cada 2 segundos
  }

  /**
   * Para polling de mensagens
   */
  private stopMessagePolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('⏹️ Polling de mensagens parado');
    }
  }
}

export default AutoEmailMonitorService;
export type { EmailDetectedEvent, AutoMonitorStatus };
