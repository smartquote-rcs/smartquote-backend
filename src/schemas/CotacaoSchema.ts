import { z } from 'zod';

export const cotacaoSchema = z.object({
  prompt_id: z.number().int().positive(),
  produto_id: z.number().int().positive(),
  preco: z.number().positive(),
  observacao: z.string().optional(),
});
