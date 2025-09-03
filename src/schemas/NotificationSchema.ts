import { z } from 'zod';

export const notificationSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título deve ter no máximo 100 caracteres'),
  subject: z.string().min(1, 'Assunto é obrigatório').max(255, 'Assunto deve ter no máximo 255 caracteres'),
  type: z.string().min(1, 'Tipo é obrigatório').max(50, 'Tipo deve ter no máximo 50 caracteres'),
  url_redir: z.string().url('URL deve ser válida').optional().or(z.literal('')),
  is_read: z.boolean().optional(),
  user_id: z.string().optional()
});

export const notificationUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  subject: z.string().min(1).max(255).optional(),
  type: z.string().min(1).max(50).optional(),
  url_redir: z.string().url().optional().or(z.literal('')),
  is_read: z.boolean().optional(),
  user_id: z.string().optional()
});

// Schema para marcar múltiplas notificações como lidas
export const markMultipleAsReadSchema = z.object({
  ids: z.array(z.number().int().positive('ID deve ser um número positivo'))
    .min(1, 'Deve haver pelo menos um ID')
    .max(100, 'Máximo de 100 IDs por vez')
});

// Schema para verificação de estoque
export const estoqueVerificationSchema = z.object({
  estoqueMinimo: z.string().transform(Number).pipe(z.number().min(0, 'Estoque mínimo deve ser maior ou igual a 0')).optional()
});
