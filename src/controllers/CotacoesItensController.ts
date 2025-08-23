import { Request, Response } from 'express';
import CotacoesItensService from '../services/CotacoesItensService';

class CotacoesItensController {
  async list(req: Request, res: Response) {
    try {
      const cotacao_id = req.query.cotacao_id ? Number(req.query.cotacao_id) : undefined;
      const itens = await CotacoesItensService.list(cotacao_id);
      res.json(itens);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar itens de cotação', details: error });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const item = await CotacoesItensService.getById(Number(id));
      if (!item) return res.status(404).json({ error: 'Item não encontrado' });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar item', details: error });
    }
  }


  
}

export default new CotacoesItensController();
