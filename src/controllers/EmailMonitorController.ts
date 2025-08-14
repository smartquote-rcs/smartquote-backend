/**
 * Controller para gerenciar o monitoramento de emails
 */

import { Request, Response } from 'express';
import GmailMonitorService from '../services/GmailMonitorService';
import type { EmailData } from '../services/GmailMonitorService';
import GlobalEmailMonitorManager from '../services/GlobalEmailMonitorManager';
import type { EmailDetectedEvent, AutoMonitorStatus } from '../services/AutoEmailMonitorService';

interface MonitorEmailsResponse {
  success: boolean;
  data?: {
    emailsEncontrados: number;
    emails: {
      id: string;
      de: string;
      assunto: string;
      data: string;
      resumo: string;
    }[];
  };
  message?: string;
  error?: string;
}

class EmailMonitorController {
  private gmailService: GmailMonitorService;
  private globalMonitor: GlobalEmailMonitorManager;

  constructor() {
    this.gmailService = new GmailMonitorService();
    this.globalMonitor = GlobalEmailMonitorManager.getInstance();
  }

  /**
   * Endpoint para monitorar emails novos
   */
  async monitorarEmails(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 Iniciando monitoramento de emails via API...');
      
      const emails = await this.gmailService.monitorNewEmails();
      
      const response: MonitorEmailsResponse = {
        success: true,
        data: {
          emailsEncontrados: emails.length,
          emails: emails.map(email => ({
            id: email.id,
            de: email.from,
            assunto: email.subject,
            data: email.date,
            resumo: email.snippet.substring(0, 100) + (email.snippet.length > 100 ? '...' : '')
          }))
        },
        message: `${emails.length} emails novos encontrados e processados`
      };

      res.status(200).json(response);
      
    } catch (error: any) {
      console.error('❌ Erro no monitoramento de emails:', error);
      
      const response: MonitorEmailsResponse = {
        success: false,
        error: error.message || 'Erro interno do servidor',
        message: 'Falha ao monitorar emails'
      };

      res.status(500).json(response);
    }
  }

  /**
   * Endpoint para verificar status do serviço
   */
  async statusServico(req: Request, res: Response): Promise<void> {
    try {
      // Tentar autorizar para verificar se está funcionando
      await this.gmailService.authorize();
      
      res.status(200).json({
        success: true,
        status: 'ativo',
        message: 'Serviço de monitoramento Gmail funcionando',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      res.status(500).json({
        success: false,
        status: 'erro',
        error: error.message,
        message: 'Serviço de monitoramento com problemas'
      });
    }
  }

  /**
   * Endpoint para limpeza de status antigos
   */
  async limparStatusAntigos(req: Request, res: Response): Promise<void> {
    try {
      const dias = parseInt(req.query.dias as string) || 30;
      
      this.gmailService.cleanOldEmailStatus(dias);
      
      res.status(200).json({
        success: true,
        message: `Status de emails antigos limpos (${dias} dias)`
      });
      
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Erro ao limpar status antigos'
      });
    }
  }

  /**
   * Endpoint para testar a conexão com Gmail
   */
  async testarConexao(req: Request, res: Response): Promise<void> {
    try {
      console.log('🧪 Testando conexão com Gmail...');
      
      const auth = await this.gmailService.authorize();
      
      // Fazer uma chamada simples para testar
      const { google } = require('googleapis');
      const gmail = google.gmail({ version: 'v1', auth });
      
      const response = await gmail.users.getProfile({
        userId: 'me'
      });

      res.status(200).json({
        success: true,
        message: 'Conexão com Gmail funcionando',
        dados: {
          email: response.data.emailAddress,
          totalMensagens: response.data.messagesTotal,
          totalThreads: response.data.threadsTotal
        }
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao testar conexão:', error);
      
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Falha na conexão com Gmail'
      });
    }
  }

  /**
   * Endpoint para iniciar monitoramento automático
   */
  async iniciarAutoMonitoramento(req: Request, res: Response): Promise<void> {
    try {
      console.log('🚀 Iniciando auto-monitoramento via API...');
      
      // Usar o singleton global (que já pode estar rodando)
      if (this.globalMonitor.isMonitoringActive()) {
        res.status(200).json({
          success: true,
          message: 'Monitoramento automático já está ativo',
          status: 'já_rodando',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      await this.globalMonitor.initializeAutoMonitoring();
      
      res.status(200).json({
        success: true,
        message: 'Monitoramento automático iniciado com sucesso',
        status: 'iniciado',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao iniciar auto-monitoramento:', error);
      
      res.status(500).json({
        success: false,
        error: error.message || 'Erro interno do servidor',
        message: 'Falha ao iniciar auto-monitoramento'
      });
    }
  }

  /**
   * Endpoint para parar monitoramento automático
   */
  async pararAutoMonitoramento(req: Request, res: Response): Promise<void> {
    try {
      console.log('🛑 Parando auto-monitoramento via API...');
      
      const result = await this.globalMonitor.stopAutoMonitoring();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          status: 'parado',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao parar auto-monitoramento:', error);
      
      res.status(500).json({
        success: false,
        error: error.message || 'Erro interno do servidor',
        message: 'Falha ao parar auto-monitoramento'
      });
    }
  }

  /**
   * Endpoint para verificar status do auto-monitoramento
   */
  async statusAutoMonitoramento(req: Request, res: Response): Promise<void> {
    try {
      const autoService = this.globalMonitor.getAutoMonitorService();
      const status = autoService.getStatus();
      
      res.status(200).json({
        success: true,
        data: {
          isRunning: status.isRunning,
          startTime: status.startTime,
          lastCheck: status.lastCheck,
          totalEmailsProcessed: status.totalEmailsProcessed,
          errorCount: status.errorCount,
          config: status.config,
          recentEmails: status.recentEmails.slice(-5), // Últimos 5
          recentMessages: status.messages.slice(-10), // Últimas 10 mensagens
          globalStatus: this.globalMonitor.isMonitoringActive() ? 'ativo' : 'inativo'
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao obter status:', error);
      
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Erro ao obter status do auto-monitoramento'
      });
    }
  }

  /**
   * Endpoint para atualizar configurações do auto-monitoramento
   */
  async atualizarConfigAutoMonitoramento(req: Request, res: Response): Promise<void> {
    try {
      const { intervalSeconds, maxEmails, enabled } = req.body;
      
      const config: any = {};
      if (intervalSeconds !== undefined) config.intervalSeconds = parseInt(intervalSeconds);
      if (maxEmails !== undefined) config.maxEmails = parseInt(maxEmails);
      if (enabled !== undefined) config.enabled = Boolean(enabled);
      
      const autoService = this.globalMonitor.getAutoMonitorService();
      await autoService.updateConfig(config);
      
      res.status(200).json({
        success: true,
        message: 'Configurações atualizadas',
        config: config,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar configuração:', error);
      
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Erro ao atualizar configurações'
      });
    }
  }

  /**
   * Endpoint para obter logs do auto-monitoramento
   */
  async logsAutoMonitoramento(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const autoService = this.globalMonitor.getAutoMonitorService();
      const status = autoService.getStatus();
      
      res.status(200).json({
        success: true,
        data: {
          totalMessages: status.messages.length,
          messages: status.messages.slice(-limit),
          isRunning: status.isRunning,
          lastCheck: status.lastCheck,
          globalStatus: this.globalMonitor.isMonitoringActive() ? 'ativo' : 'inativo'
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Erro ao obter logs'
      });
    }
  }

  /**
   * Endpoint para reiniciar monitoramento automático
   */
  async reiniciarAutoMonitoramento(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔄 Reiniciando auto-monitoramento via API...');
      
      const result = await this.globalMonitor.restartAutoMonitoring();
      
      res.status(200).json({
        success: result.success,
        message: result.message,
        status: 'reiniciado',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao reiniciar auto-monitoramento:', error);
      
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Falha ao reiniciar auto-monitoramento'
      });
    }
  }

  /**
   * Endpoint para listar emails salvos
   */
  async listarEmailsSalvos(req: Request, res: Response): Promise<void> {
    try {
      const autoService = this.globalMonitor.getAutoMonitorService();
      const emailsMetadata = autoService.getSavedEmailsMetadata();
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      
      const paginatedEmails = emailsMetadata
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
        .slice(skip, skip + limit);
      
      res.status(200).json({
        success: true,
        data: {
          emails: paginatedEmails,
          pagination: {
            page,
            limit,
            total: emailsMetadata.length,
            totalPages: Math.ceil(emailsMetadata.length / limit)
          }
        },
        message: `${paginatedEmails.length} emails salvos encontrados`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao listar emails salvos:', error);
      
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Erro ao listar emails salvos'
      });
    }
  }

  /**
   * Endpoint para verificar se um email foi salvo
   */
  async verificarEmailSalvo(req: Request, res: Response): Promise<void> {
    try {
      const { emailId } = req.params;
      
      if (!emailId) {
        res.status(400).json({
          success: false,
          message: 'ID do email é obrigatório'
        });
        return;
      }
      
      const autoService = this.globalMonitor.getAutoMonitorService();
      const isSaved = autoService.isEmailSaved(emailId);
      
      res.status(200).json({
        success: true,
        data: {
          emailId,
          isSaved,
          savedAt: isSaved ? autoService.getSavedEmailsMetadata().find(m => m.id === emailId)?.savedAt : null
        },
        message: isSaved ? 'Email foi salvo' : 'Email não foi salvo'
      });
      
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Erro ao verificar email salvo'
      });
    }
  }

  /**
   * Endpoint para limpar emails salvos antigos
   */
  async limparEmailsSalvosAntigos(req: Request, res: Response): Promise<void> {
    try {
      const daysToKeep = parseInt(req.query.days as string) || 30;
      
      const autoService = this.globalMonitor.getAutoMonitorService();
      autoService.cleanOldSavedEmails(daysToKeep);
      
      res.status(200).json({
        success: true,
        message: `Emails salvos com mais de ${daysToKeep} dias foram removidos`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao limpar emails salvos:', error);
      
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Erro ao limpar emails salvos antigos'
      });
    }
  }
}

export default EmailMonitorController;
