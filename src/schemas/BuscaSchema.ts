import { z } from 'zod';

export const buscaSchema = z.object({
  produto: z.string()
    .min(1, "O campo produto é obrigatório")
    .min(2, "O produto deve ter pelo menos 2 caracteres")
    .max(100, "O produto deve ter no máximo 100 caracteres")
    .transform(val => val.trim()),
  quantidade: z.number().optional().default(1),
  custo_beneficio: z.any().optional(),
  rigor: z.number().int().min(0).max(5).optional().default(0),
  refinamento: z.boolean().optional().default(false),
  salvamento: z.boolean().optional().default(false),
  urls_add: z.array(z.object({url: z.string(), escala_mercado: z.string()})).optional().default([]),
  faltante_id: z.string().optional(), // ID do faltante para rastreamento
  ponderacao_web_llm: z.number().min(0).max(1).optional().default(0),
});

export type BuscaData = z.infer<typeof buscaSchema>;
