import { z } from 'zod';
export declare const fornecedorSchema: z.ZodObject<{
    nome: z.ZodString;
    contato_email: z.ZodString;
    contato_telefone: z.ZodOptional<z.ZodString>;
    site: z.ZodOptional<z.ZodString>;
    observacoes: z.ZodOptional<z.ZodString>;
    ativo: z.ZodBoolean;
    cadastrado_em: z.ZodString;
    cadastrado_por: z.ZodNumber;
    atualizado_em: z.ZodString;
    atualizado_por: z.ZodNumber;
}, z.core.$strip>;
//# sourceMappingURL=FornecedorSchema.d.ts.map