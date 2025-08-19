import { Request, Response } from 'express';
import CotacoesService from '../services/CotacoesService';
import { cotacaoSchema } from '../schemas/CotacaoSchema';
import { Cotacao } from '../models/Cotacao';
import CotacaoNotificationService from '../services/CotacaoNotificationService';

class CotacoesController {
  async create(req: Request, res: Response): Promise<Response> {
    const parsed = cotacaoSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({ errors });
    }

    try {
      const cotacao = await CotacoesService.create(parsed.data as unknown as Cotacao);
      
      // Criar notificação para nova cotação
      try {
        await CotacaoNotificationService.processarNotificacaoCotacao(cotacao, 'criada');
      } catch (notifError) {
        console.error('Erro ao criar notificação de cotação criada:', notifError);
        // Não quebra o fluxo principal, apenas loga o erro
      }

      return res.status(201).json({
        message: 'Cotação cadastrada com sucesso.',
        data: cotacao,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const cotacoes = await CotacoesService.getAll();
      return res.status(200).json({
        message: 'Lista de cotações.',
        data: cotacoes,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const cotacao = await CotacoesService.getById(Number(id));
      return res.status(200).json({
        message: 'Cotação encontrada.',
        data: cotacao,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      // Buscar cotação antes de deletar para notificações
      let cotacaoParaDeletar;
      try {
        cotacaoParaDeletar = await CotacoesService.getById(Number(id));
      } catch (error) {
        // Se não encontrou a cotação, continua com a deleção
        console.warn('Cotação não encontrada para notificação de deleção:', id);
      }
      
      await CotacoesService.delete(Number(id));
      
      // Criar notificação de deleção se conseguiu buscar a cotação
      if (cotacaoParaDeletar) {
        try {
          await CotacaoNotificationService.processarNotificacaoCotacao(cotacaoParaDeletar, 'deletada');
        } catch (notifError) {
          console.error('Erro ao criar notificação de cotação deletada:', notifError);
          // Não quebra o fluxo principal, apenas loga o erro
        }
      }
      
      return res.status(200).json({ message: 'Cotação deletada com sucesso.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async patch(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Buscar cotação antes de atualizar para comparação
      let cotacaoAnterior;
      try {
        cotacaoAnterior = await CotacoesService.getById(Number(id));
      } catch (error) {
        console.warn('Cotação não encontrada para comparação de mudanças:', id);
      }

      const cotacaoAtualizada = await CotacoesService.updatePartial(Number(id), updates);

      // Processar notificações baseadas em mudanças
      if (cotacaoAnterior && cotacaoAtualizada) {
        try {
          await CotacaoNotificationService.analisarENotificarMudancas(cotacaoAnterior, cotacaoAtualizada);
        } catch (notifError) {
          console.error('Erro ao processar notificações de mudanças na cotação:', notifError);
          // Não quebra o fluxo principal, apenas loga o erro
        }
      }

      return res.status(200).json({
        message: 'Cotação atualizada com sucesso.',
        data: cotacaoAtualizada,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default new CotacoesController();
