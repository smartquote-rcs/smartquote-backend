import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  position: z.string().min(1, 'Cargo é obrigatório'),
});
