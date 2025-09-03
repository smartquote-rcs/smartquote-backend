import { z } from 'zod';
export declare const produtoSchema: z.ZodObject<{
    fornecedor_id: z.ZodNumber;
    nome: z.ZodString;
    preco: z.ZodNumber;
    estoque: z.ZodNumber;
    descricao: z.ZodOptional<z.ZodString>;
    codigo: z.ZodOptional<z.ZodString>;
    modelo: z.ZodOptional<z.ZodString>;
    origem: z.ZodOptional<z.ZodEnum<{
        local: "local";
        externo: "externo";
    }>>;
    image_url: z.ZodOptional<z.ZodString>;
    produto_url: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    categoria: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    disponibilidade: z.ZodOptional<z.ZodEnum<{
        imediata: "imediata";
        "por encomenda": "por encomenda";
        limitada: "limitada";
    }>>;
    especificacoes_tecnicas: z.ZodOptional<z.ZodAny>;
    cadastrado_por: z.ZodOptional<z.ZodNumber>;
    cadastrado_em: z.ZodOptional<z.ZodString>;
    atualizado_por: z.ZodOptional<z.ZodNumber>;
    atualizado_em: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=ProdutoSchema.d.ts.map