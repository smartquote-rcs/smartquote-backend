import { Request, Response } from 'express';
import CotacoesService from '../services/CotacoesService';
import { cotacaoSchema } from '../schemas/CotacaoSchema';
import { Cotacao } from '../models/Cotacao';

class CotacoesController {
  async create(req: Request, res: Response): Promise<Response> {
    const parsed = cotacaoSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({ errors });
    }

    try {
      const cotacao = await CotacoesService.create(parsed.data as unknown as Cotacao);
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
      await CotacoesService.delete(Number(id));
      return res.status(200).json({ message: 'Cotação deletada com sucesso.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async patch(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const cotacaoAtualizada = await CotacoesService.updatePartial(Number(id), updates);

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
