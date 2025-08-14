import { z } from 'zod';

export const fornecedorSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  contato_email: z.string().email('E-mail inválido'),
  contato_telefone: z.string().optional(),
  site: z.string().optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean(),
  cadastrado_em: z.string(),
  cadastrado_por: z.number(),
  atualizado_em: z.string(),
  atualizado_por: z.number(),
});
