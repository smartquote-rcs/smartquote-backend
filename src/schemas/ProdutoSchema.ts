import { z } from 'zod';

export const produtoSchema = z.object({
  fornecedor_id: z.number(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  preco: z.number().nonnegative('Preço deve ser >= 0'),
  estoque: z.number().int().nonnegative('Estoque não pode ser negativo'),
  descricao: z.string().optional(),
  codigo: z.string().optional(),
  modelo: z.string().optional(),
  unidade: z.string().optional(),
  origem: z.enum(['local', 'externo']).optional(),
  image_url: z.string().url().optional(),
  produto_url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  categoria: z.string().nullable().optional(),
  disponibilidade: z.enum(['imediata', 'por encomenda', 'limitada']).optional(),
  especificacoes_tecnicas: z.any().optional(),
  cadastrado_por: z.number().int().optional(),
  cadastrado_em: z.string().optional(),
  atualizado_por: z.number().int().optional(),
  atualizado_em: z.string().optional(),
});
