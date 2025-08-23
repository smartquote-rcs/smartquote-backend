import { z } from 'zod';

export const promptSchema = z.object({
  texto_original: z.string(),
  dados_extraidos: z.any().optional(),
  dados_bruto: z.any().optional(),
  origem: z.any().optional(),
  status: z.string().optional(),
});

export const updatePromptSchema = promptSchema.partial();
