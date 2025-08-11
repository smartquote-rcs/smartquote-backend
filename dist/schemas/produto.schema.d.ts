import { z } from 'zod';
export declare const produtoSchema: z.ZodObject<{
    nome: z.ZodString;
    preco: z.ZodNumber;
    estoque: z.ZodNumber;
    descricao: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=produto.schema.d.ts.map