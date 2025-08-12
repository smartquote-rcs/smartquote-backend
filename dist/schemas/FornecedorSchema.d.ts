import { z } from 'zod';
export declare const fornecedorSchema: z.ZodObject<{
    nome: z.ZodString;
    email: z.ZodString;
    telefone: z.ZodOptional<z.ZodString>;
    endereco: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=FornecedorSchema.d.ts.map