import { z } from 'zod';

export const cotacaoSchema = z.object({
  // relações
  prompt_id: z.number().int().positive(),
  produto_id: z.number().int().positive(),

  // campos opcionais (após migração)
  aprovacao: z.boolean().optional(),
  motivo: z.string().optional(),
  aprovado_por: z.number().int().optional(),

  // novos campos essenciais
  status: z.enum(['completa', 'incompleta']).optional(),
  orcamento_geral: z.number().nonnegative().optional(),
  faltantes: z.any().optional(), // jsonb

  // observações
  observacao: z.string().optional(),
});
