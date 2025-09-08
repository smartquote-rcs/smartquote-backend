import { z } from 'zod';
export declare const buscaSchema: z.ZodObject<{
    produto: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    quantidade: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    custo_beneficio: z.ZodOptional<z.ZodAny>;
    rigor: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    refinamento: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    salvamento: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    urls_add: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        escala_mercado: z.ZodString;
    }, z.core.$strip>>>>;
    faltante_id: z.ZodOptional<z.ZodString>;
    ponderacao_web_llm: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    quantidade_resultados: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type BuscaData = z.infer<typeof buscaSchema>;
//# sourceMappingURL=BuscaSchema.d.ts.map