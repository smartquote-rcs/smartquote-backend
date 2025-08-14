import { z } from 'zod';

export const userSchema = z.object({
  name: z
    .string()
    .min(1, 'O nome é obrigatório.')
    .max(100, 'O nome não pode ter mais de 100 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  contact: z
    .string()
    .min(1, 'O contato é obrigatório.')
    .regex(/^\d{9}$/, 'O contato deve ser um número de telefone válido com 9 dígitos.'),
  password: z
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres.')
    .max(100, 'A senha não pode ter mais de 100 caracteres.'),
  department: z
    .string()
    .min(1, 'O departamento é obrigatório.')
    .max(100, 'O departamento não pode ter mais de 100 caracteres.'),
  position: z
    .string()
    .min(1, 'O cargo é obrigatório.')
    .max(100, 'O cargo não pode ter mais de 100 caracteres.'),
});