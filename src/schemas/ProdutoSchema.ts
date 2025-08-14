import { z } from 'zod';

export const produtoSchema = z.object({
  fornecedorId: z.number(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  preco: z.number().positive('Preço deve ser positivo'),
  estoque: z.number().int().nonnegative('Estoque não pode ser negativo'),
  descricao: z.string().optional(),
});
