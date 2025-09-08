"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.produtoSchema = void 0;
const zod_1 = require("zod");
exports.produtoSchema = zod_1.z.object({
    fornecedor_id: zod_1.z.number(),
    nome: zod_1.z.string().min(1, 'Nome é obrigatório'),
    preco: zod_1.z.number().nonnegative('Preço deve ser >= 0'),
    estoque: zod_1.z.number().int().nonnegative('Estoque não pode ser negativo'),
    descricao: zod_1.z.string().optional(),
    codigo: zod_1.z.string().optional(),
    modelo: zod_1.z.string().optional(),
    origem: zod_1.z.enum(['local', 'externo']).optional(),
    image_url: zod_1.z.string().url().optional(),
    produto_url: zod_1.z.string().url().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    categoria: zod_1.z.string().nullable().optional(),
    disponibilidade: zod_1.z.enum(['imediata', 'por encomenda', 'limitada']).optional(),
    especificacoes_tecnicas: zod_1.z.any().optional(),
    cadastrado_por: zod_1.z.number().int().optional(),
    cadastrado_em: zod_1.z.string().optional(),
    atualizado_por: zod_1.z.number().int().optional(),
    atualizado_em: zod_1.z.string().optional(),
});
//# sourceMappingURL=ProdutoSchema.js.map