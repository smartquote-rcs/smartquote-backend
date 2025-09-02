import { z } from 'zod';

export const sistemaSchema = z.object({
  nome_empresa: z.string().min(1, 'Nome da empresa é obrigatório'),
  idioma: z.string().min(1, 'Idioma é obrigatório'),
  fuso_horario: z.string().min(1, 'Fuso horário é obrigatório'),
  moeda: z.string().min(1, 'Moeda é obrigatória'),
  backup: z.string().min(1, 'Configuração de backup é obrigatória'),
  manutencao: z.boolean(),
  tempo_de_sessao: z.number().int().min(1, 'Tempo de sessão deve ser maior que 0'),
  politica_senha: z.enum(['forte', 'medio']),
  log_auditoria: z.boolean(),
  ip_permitidos: z.string().min(1, 'IPs permitidos são obrigatórios')
});

export const sistemaUpdateSchema = z.object({
  nome_empresa: z.string().min(1, 'Nome da empresa é obrigatório').optional(),
  idioma: z.string().min(1, 'Idioma é obrigatório').optional(),
  fuso_horario: z.string().min(1, 'Fuso horário é obrigatório').optional(),
  moeda: z.string().min(1, 'Moeda é obrigatória').optional(),
  backup: z.string().min(1, 'Configuração de backup é obrigatória').optional(),
  manutencao: z.boolean().optional(),
  tempo_de_sessao: z.number().int().min(1, 'Tempo de sessão deve ser maior que 0').optional(),
  politica_senha: z.enum(['forte', 'medio']).optional(),
  log_auditoria: z.boolean().optional(),
  ip_permitidos: z.string().min(1, 'IPs permitidos são obrigatórios').optional()
});

export type SistemaInput = z.infer<typeof sistemaSchema>;
export type SistemaUpdateInput = z.infer<typeof sistemaUpdateSchema>;