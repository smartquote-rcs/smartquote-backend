import { Request, Response } from 'express';
import PromptsService from '../services/PromptsService';
import { promptSchema, updatePromptSchema } from '../schemas/PromptSchema';

class PromptsController {
  async create(req: Request, res: Response): Promise<Response> {
    const parsed = promptSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    try {
      const prompt = await PromptsService.create(parsed.data);
      return res.status(201).json(prompt);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const prompts = await PromptsService.getAll();
      return res.status(200).json(prompts);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const prompt = await PromptsService.getById(Number(id));
      if (!prompt) {
        return res.status(404).json({ message: 'Prompt not found' });
      }
      return res.status(200).json(prompt);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const parsed = updatePromptSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    try {
      const prompt = await PromptsService.update(Number(id), parsed.data);
      return res.status(200).json(prompt);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await PromptsService.delete(Number(id));
      return res.status(204).send();
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default new PromptsController();
