import { z } from 'zod';
export declare const buscaSchema: z.ZodObject<{
    produto: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    quantidade: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    custo_beneficio: z.ZodOptional<z.ZodAny>;
    rigor: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    refinamento: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    faltante_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type BuscaData = z.infer<typeof buscaSchema>;
//# sourceMappingURL=BuscaSchema.d.ts.map