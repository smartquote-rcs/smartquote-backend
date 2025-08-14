/**
 * Worker para monitoramento automático de emails em background
 * Executa verificações periódicas sem bloquear o servidor principal
 */

import GmailMonitorService from '../services/GmailMonitorService';
import type { EmailData } from '../services/GmailMonitorService';

interface MonitoringConfig {
  intervalSeconds: number;
  maxEmails: number;
  enabled: boolean;
}

interface ProcessedEmailSummary {
  id: string;
  from: string;
  subject: string;
  date: string;
  timestamp: string;
}

class EmailMonitorWorker {
  private gmailService: GmailMonitorService;
  private config: MonitoringConfig;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private processedEmails: ProcessedEmailSummary[] = [];
  private lastCheck: Date = new Date();
  private errorCount: number = 0;
  private maxErrors: number = 5;

  constructor() {
    this.gmailService = new GmailMonitorService();
    this.config = {
      intervalSeconds: 10, // Verificar a cada 10 segundos
      maxEmails: 4,
      enabled: true
    };
  }

  /**
   * Inicia o monitoramento automático
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Monitoramento já está rodando');
      return;
    }

    console.log('🚀 Iniciando monitoramento automático de emails...');
    console.log(`📅 Intervalo: ${this.config.intervalSeconds} segundos`);
    console.log(`📧 Máximo de emails por verificação: ${this.config.maxEmails}`);

    this.isRunning = true;
    this.errorCount = 0;
    this.lastCheck = new Date();

    // Fazer primeira verificação imediatamente
    await this.checkEmails();

    // Configurar intervalo
    this.intervalId = setInterval(async () => {
      if (this.config.enabled && this.errorCount < this.maxErrors) {
        await this.checkEmails();
      }
    }, this.config.intervalSeconds * 1000);

    console.log('✅ Monitoramento automático iniciado com sucesso');
  }

  /**
   * Para o monitoramento automático
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Monitoramento não está rodando');
      return;
    }

    console.log('🛑 Parando monitoramento automático...');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('✅ Monitoramento automático parado');
  }

  /**
   * Verifica emails novos
   */
  private async checkEmails(): Promise<void> {
    try {
      const startTime = Date.now();
      this.lastCheck = new Date();

      console.log(`📡 [${this.lastCheck.toISOString()}] Verificando emails novos...`);

      const newEmails = await this.gmailService.monitorNewEmails();

      if (newEmails.length > 0) {
        console.log(`📬 [NOVO] ${newEmails.length} emails encontrados!`);
        
        // Processar emails encontrados
        for (const email of newEmails) {
          const processed: ProcessedEmailSummary = {
            id: email.id,
            from: email.from,
            subject: email.subject,
            date: email.date,
            timestamp: new Date().toISOString()
          };

          this.processedEmails.push(processed);

          // Manter apenas últimos 50 emails processados
          if (this.processedEmails.length > 50) {
            this.processedEmails = this.processedEmails.slice(-50);
          }

          console.log(`  ✉️  ${email.subject.substring(0, 40)}... (${email.from})`);
          
          // Enviar mensagem para processo pai (se existir)
          this.sendMessageToParent('EMAIL_DETECTED', {
            emailId: email.id,
            from: email.from,
            subject: email.subject,
            date: email.date,
            content: email.content.substring(0, 200) + '...'
          });
        }

        // Reset contador de erros após sucesso
        this.errorCount = 0;
      } else {
        console.log(`✅ [${this.lastCheck.toLocaleTimeString()}] Nenhum email novo`);
      }

      const duration = Date.now() - startTime;
      console.log(`⏱️  Verificação concluída em ${duration}ms`);

    } catch (error: any) {
      this.errorCount++;
      console.error(`❌ [ERRO ${this.errorCount}/${this.maxErrors}] Falha na verificação:`, error.message);

      if (this.errorCount >= this.maxErrors) {
        console.error('🚨 Muitos erros consecutivos. Parando monitoramento automático.');
        this.stop();
        
        this.sendMessageToParent('MONITORING_ERROR', {
          error: `Monitoramento parado após ${this.maxErrors} erros consecutivos`,
          lastError: error.message
        });
      }
    }
  }

  /**
   * Envia mensagem para o processo pai
   */
  public sendMessageToParent(type: string, data: any): void {
    if (process.send) {
      const message = {
        type: 'WORKER_MSG',
        payload: {
          action: type,
          timestamp: new Date().toISOString(),
          data
        }
      };
      process.send(message);
    }
  }

  /**
   * Retorna status atual do monitoramento
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      lastCheck: this.lastCheck,
      totalProcessed: this.processedEmails.length,
      recentEmails: this.processedEmails.slice(-5),
      errorCount: this.errorCount,
      maxErrors: this.maxErrors,
      uptime: this.isRunning ? Date.now() - this.lastCheck.getTime() : 0
    };
  }

  /**
   * Atualiza configurações
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuração atualizada:', this.config);

    if (!this.config.enabled && this.isRunning) {
      this.stop();
    }
  }

  /**
   * Retorna emails processados recentemente
   */
  getRecentEmails(limit: number = 10): ProcessedEmailSummary[] {
    return this.processedEmails.slice(-limit);
  }
}

// Execução quando chamado como worker
if (require.main === module) {
  const worker = new EmailMonitorWorker();

  // Manipular mensagens do processo pai
  process.on('message', async (message: any) => {
    if (message.type === 'WORKER_CMD') {
      const { action, params } = message.payload;

      switch (action) {
        case 'START':
          await worker.start();
          break;

        case 'STOP':
          worker.stop();
          break;

        case 'STATUS':
          const status = worker.getStatus();
          worker.sendMessageToParent('STATUS_RESPONSE', status);
          break;

        case 'UPDATE_CONFIG':
          worker.updateConfig(params);
          break;

        case 'GET_RECENT_EMAILS':
          const emails = worker.getRecentEmails(params?.limit || 10);
          worker.sendMessageToParent('RECENT_EMAILS_RESPONSE', emails);
          break;

        default:
          console.log('❓ Ação desconhecida:', action);
      }
    }
  });

  // Iniciar automaticamente
  worker.start().catch(console.error);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📤 Recebido SIGTERM, parando worker...');
    worker.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('📤 Recebido SIGINT, parando worker...');
    worker.stop();
    process.exit(0);
  });
}

export default EmailMonitorWorker;
