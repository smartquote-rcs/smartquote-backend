/**
 * Controller para gerenciar interpretações de emails via Gemini AI
 */

import { Request, Response } from 'express';
import GeminiInterpretationService from '../services/GeminiInterpretationService';
import GlobalEmailMonitorManager from '../services/GlobalEmailMonitorManager';

export class GeminiController {
  private geminiService: GeminiInterpretationService;

  constructor() {
    this.geminiService = new GeminiInterpretationService();
  }

  /**
   * Lista todas as interpretações de emails
   */
  async listarInterpretacoes(req: Request, res: Response) {
    try {
      console.log('📋 [API] Listando interpretações de emails...');
      
      const interpretations = await this.geminiService.listInterpretations();
      
      return res.status(200).json({
        success: true,
        message: `${interpretations.length} interpretação(ões) encontrada(s)`,
        data: interpretations,
        count: interpretations.length
      });

    } catch (error: any) {
      console.error('❌ [API] Erro ao listar interpretações:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Busca interpretação de um email específico
   */
  async buscarInterpretacaoPorEmail(req: Request, res: Response) {
    try {
      const { emailId } = req.params;
      
      if (!emailId) {
        return res.status(400).json({
          success: false,
          message: 'Email ID é obrigatório'
        });
      }

      console.log(`🔍 [API] Buscando interpretação para email: ${emailId}`);
      
      const interpretation = await this.geminiService.getInterpretationByEmailId(emailId);
      
      if (!interpretation) {
        return res.status(404).json({
          success: false,
          message: `Interpretação não encontrada para email: ${emailId}`
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Interpretação encontrada',
        data: interpretation
      });

    } catch (error: any) {
      console.error('❌ [API] Erro ao buscar interpretação:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Força a interpretação de um email específico
   */
  async interpretarEmail(req: Request, res: Response) {
    try {
      const { emailId } = req.params;
      
      if (!emailId) {
        return res.status(400).json({
          success: false,
          message: 'Email ID é obrigatório'
        });
      }

      console.log(`🧠 [API] Forçando interpretação do email: ${emailId}`);
      
      // Buscar dados do email salvo
      const emailSaver = GlobalEmailMonitorManager.getInstance().getEmailSaverService();
      const savedEmails = emailSaver.getSavedEmailsMetadata();
      
      const emailMetadata = savedEmails.find((email: any) => email.id === emailId);
      if (!emailMetadata) {
        return res.status(404).json({
          success: false,
          message: `Email ${emailId} não encontrado nos arquivos salvos`
        });
      }

      // Carregar dados completos do email
      const emailData = emailSaver.loadEmailFromFile(emailId);
      if (!emailData) {
        return res.status(404).json({
          success: false,
          message: `Dados do email ${emailId} não puderam ser carregados`
        });
      }

      // Interpretar com Gemini
      const interpretation = await this.geminiService.interpretEmail(emailData);
      
      return res.status(200).json({
        success: true,
        message: 'Email interpretado com sucesso',
        data: interpretation
      });

    } catch (error: any) {
      console.error('❌ [API] Erro ao interpretar email:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Endpoint de teste para verificar conexão com Gemini
   */
  async testarGemini(req: Request, res: Response) {
    try {
      console.log('🧪 [API] Testando conexão com Gemini AI...');
      
      const testEmailData = {
        id: 'test_gemini_connection',
        from: 'teste@exemplo.com',
        subject: 'Teste de Conexão Gemini',
        content: 'Este é um email de teste para verificar a conexão com o Gemini AI.',
        date: new Date().toISOString()
      };

      const interpretation = await this.geminiService.interpretEmail(testEmailData);
      
      return res.status(200).json({
        success: true,
        message: 'Conexão com Gemini AI funcionando',
        data: {
          gemini_connected: true,
          test_interpretation: interpretation,
          confidence: interpretation.confianca
        }
      });

    } catch (error: any) {
      console.error('❌ [API] Erro no teste do Gemini:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro na conexão com Gemini AI',
        error: error.message,
        gemini_connected: false
      });
    }
  }

  /**
   * Obtém estatísticas das interpretações
   */
  async obterEstatisticas(req: Request, res: Response) {
    try {
      console.log('📊 [API] Calculando estatísticas das interpretações...');
      
      const interpretations = await this.geminiService.listInterpretations();
      
      if (interpretations.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Nenhuma interpretação encontrada',
          data: {
            total: 0,
            tipos: {},
            prioridades: {},
            confianca_media: 0,
            produtos_total: 0
          }
        });
      }

      // Calcular estatísticas
      const stats = {
        total: interpretations.length,
        tipos: {} as Record<string, number>,
        prioridades: {} as Record<string, number>,
        confianca_media: 0,
        produtos_total: 0,
        emails_com_produtos: 0,
        acoes_sugeridas: {} as Record<string, number>
      };

      let confiancaTotal = 0;

      interpretations.forEach(interp => {
        // Contar tipos
        stats.tipos[interp.tipo] = (stats.tipos[interp.tipo] || 0) + 1;
        
        // Contar prioridades
        stats.prioridades[interp.prioridade] = (stats.prioridades[interp.prioridade] || 0) + 1;
        
        // Somar confiança
        confiancaTotal += interp.confianca;
        
        // Contar produtos
        stats.produtos_total += interp.produtos.length;
        if (interp.produtos.length > 0) {
          stats.emails_com_produtos++;
        }
        
        // Contar ações sugeridas
        interp.acoes_sugeridas.forEach(acao => {
          stats.acoes_sugeridas[acao] = (stats.acoes_sugeridas[acao] || 0) + 1;
        });
      });

      stats.confianca_media = Math.round(confiancaTotal / interpretations.length);

      return res.status(200).json({
        success: true,
        message: 'Estatísticas calculadas com sucesso',
        data: stats
      });

    } catch (error: any) {
      console.error('❌ [API] Erro ao calcular estatísticas:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

export default GeminiController;
