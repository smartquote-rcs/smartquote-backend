import { z } from 'zod';

export const buscaSchema = z.object({
  produto: z.string()
    .min(1, "O campo produto é obrigatório")
    .min(2, "O produto deve ter pelo menos 2 caracteres")
    .max(100, "O produto deve ter no máximo 100 caracteres")
    .transform(val => val.trim())
});

export type BuscaData = z.infer<typeof buscaSchema>;
