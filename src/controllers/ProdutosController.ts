import { Request, Response } from 'express';
import { ProdutosService } from '../services/ProdutoService';
import { produtoSchema } from '../schemas/ProdutoSchema';
import { Produto } from '../models/Produto';

const produtosService = new ProdutosService();

class ProdutosController {
  async create(req: Request, res: Response): Promise<Response> {
    const parsed = produtoSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({ errors });
    }

    try {
      const produto = await produtosService.create(parsed.data as unknown as Produto);
      return res.status(201).json({
        message: 'Produto cadastrado com sucesso.',
        data: produto,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const produtos = await produtosService.getAll();
      return res.status(200).json({
        message: 'Lista de produtos.',
        data: produtos,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const produto = await produtosService.getById(Number(id));
      return res.status(200).json({
        message: 'Produto encontrado.',
        data: produto,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await produtosService.delete(Number(id));
      return res.status(200).json({ message: 'Produto deletado com sucesso.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async patch(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const produtoAtualizado = await produtosService.updatePartial(Number(id), updates);

      return res.status(200).json({
        message: 'Produto atualizado com sucesso.',
        data: produtoAtualizado,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default new ProdutosController();
