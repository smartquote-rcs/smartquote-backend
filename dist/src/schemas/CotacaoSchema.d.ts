import { z } from 'zod';
export declare const cotacaoSchema: z.ZodObject<{
    prompt_id: z.ZodNumber;
    aprovacao: z.ZodOptional<z.ZodBoolean>;
    motivo: z.ZodOptional<z.ZodString>;
    aprovado_por: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<{
        completa: "completa";
        incompleta: "incompleta";
    }>>;
    orcamento_geral: z.ZodOptional<z.ZodNumber>;
    faltantes: z.ZodOptional<z.ZodAny>;
    observacao: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=CotacaoSchema.d.ts.map