import { z } from 'zod';
export declare const buscaSchema: z.ZodObject<{
    produto: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export type BuscaData = z.infer<typeof buscaSchema>;
//# sourceMappingURL=BuscaSchema.d.ts.map