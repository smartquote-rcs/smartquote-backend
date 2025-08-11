import { z } from 'zod';

export const fornecedorSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
});
