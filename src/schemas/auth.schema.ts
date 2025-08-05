import { z } from 'zod';

export const signUpSchema = z.object({
  username: z.string().min(1, 'Username é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export type SignUpDTO = z.infer<typeof signUpSchema>;