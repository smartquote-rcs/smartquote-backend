import { z } from 'zod';

export const initiateTwoFactorSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
});

export const verifyTwoFactorSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
  code: z
    .string()
    .min(6, 'O código deve ter 6 dígitos')
    .max(6, 'O código deve ter 6 dígitos'),
});

export const completeTwoFactorSchema = z.object({
  temporaryToken: z
    .string()
    .min(1, 'Token temporário é obrigatório'),
  password: z
    .string()
    .min(6, 'A senha deve ter no mínimo 6 caracteres'),
});
