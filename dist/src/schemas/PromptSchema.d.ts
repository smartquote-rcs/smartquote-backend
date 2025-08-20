import { z } from 'zod';
export declare const promptSchema: z.ZodObject<{
    texto_original: z.ZodString;
    dados_extraidos: z.ZodOptional<z.ZodAny>;
    origem: z.ZodOptional<z.ZodAny>;
    status: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updatePromptSchema: z.ZodObject<{
    texto_original: z.ZodOptional<z.ZodString>;
    dados_extraidos: z.ZodOptional<z.ZodOptional<z.ZodAny>>;
    origem: z.ZodOptional<z.ZodOptional<z.ZodAny>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
//# sourceMappingURL=PromptSchema.d.ts.map