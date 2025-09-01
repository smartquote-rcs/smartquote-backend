import { Request, Response } from 'express';
import { sistemaSchema, sistemaUpdateSchema } from '../schemas/SistemaSchema';
import SistemaService from '../services/SistemaService';
import { LogService } from '../services/LogService';

class SistemaController {

  /**
   * Busca as configurações do sistema
   */
  async getSistema(req: Request, res: Response): Promise<Response> {
    try {
      const sistema = await SistemaService.getSistema();

      if (!sistema) {
        // Se não existir configuração, criar uma padrão
        const configuracaoPadrao = await SistemaService.criarConfiguracaoPadrao();
        return res.status(200).json({
          success: true,
          message: 'Configurações padrão criadas',
          data: configuracaoPadrao
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Configurações do sistema encontradas',
        data: sistema
      });

    } catch (error) {
      console.error('Erro ao buscar configurações do sistema:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Cria ou atualiza as configurações do sistema
   */
  async upsertSistema(req: Request, res: Response): Promise<Response> {
    const parsed = sistemaSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors
      });
    }

    try {
      const sistema = await SistemaService.upsertSistema(parsed.data);
       (new LogService()).create({
            type: "update",  
            titulo: "atualização de Sistema",
            assunto: `Atualização da Contação: ${sistema}`,
            path_file: "null"
      });
      return res.status(200).json({
        success: true,
        message: 'Configurações do sistema salvas com sucesso',
        data: sistema
      });

    } catch (error) {
      console.error('Erro ao salvar configurações do sistema:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Atualiza parcialmente as configurações do sistema
   */
  async updateSistema(req: Request, res: Response): Promise<Response> {
    const parsed = sistemaUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors
      });
    }

    try {
      const sistema = await SistemaService.updateSistema(parsed.data);
       (new LogService()).create({
            type: "update",  
            titulo: "atualização de Sistema",
            assunto: `Atualização da Contação: ${sistema}`,
            path_file: "null"
      });
      return res.status(200).json({
        success: true,
        message: 'Configurações do sistema atualizadas com sucesso',
        data: sistema
      });

    } catch (error) {
      console.error('Erro ao atualizar configurações do sistema:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}

export default new SistemaController();