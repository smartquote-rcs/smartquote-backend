import { Request, Response } from 'express';
import FornecedoresService from '../services/FornecedoresService';
import { fornecedorSchema } from '../schemas/FornecedorSchema';
import { Fornecedor } from '../models/Fornecedor';

class FornecedoresController {
  async create(req: Request, res: Response): Promise<Response> {
    const parsed = fornecedorSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.format();
  console.error('❌ Validação fornecedor falhou:', errors, 'Payload recebido:', req.body);
      return res.status(400).json({ errors });
    }
    try {
  console.log('✅ Validação fornecedor ok. Dados normalizados:', parsed.data);
  const fornecedor = await FornecedoresService.create(parsed.data as Fornecedor);
      return res.status(201).json({
        message: 'Fornecedor cadastrado com sucesso.',
        data: fornecedor,
      });
    } catch (err: any) {
  console.error('💥 Erro ao criar fornecedor:', err);
      return res.status(400).json({ error: err.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const fornecedores = await FornecedoresService.getAll();
      return res.status(200).json({
        message: 'Lista de fornecedores.',
        data: fornecedores,
      });
    } catch (err: any) {
      console.error('Erro ao buscar fornecedores:', err);
      return res.status(500).json({ error: err.message, stack: err.stack });
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const fornecedor = await FornecedoresService.getById(Number(id));
      return res.status(200).json({
        message: 'Fornecedor encontrado.',
        data: fornecedor,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await FornecedoresService.delete(Number(id));
      return res.status(200).json({ message: 'Fornecedor deletado com sucesso.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async patch(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const fornecedorAtualizado = await FornecedoresService.updatePartial(Number(id), updates);
      return res.status(200).json({
        message: 'Fornecedor atualizado com sucesso.',
        data: fornecedorAtualizado,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default new FornecedoresController();
