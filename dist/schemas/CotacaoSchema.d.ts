import { z } from 'zod';
export declare const cotacaoSchema: z.ZodObject<{
    prompt_id: z.ZodNumber;
    produto_id: z.ZodNumber;
    preco: z.ZodNumber;
    observacao: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=CotacaoSchema.d.ts.map