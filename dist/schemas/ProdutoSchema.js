"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.produtoSchema = void 0;
const zod_1 = require("zod");
exports.produtoSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1, 'Nome é obrigatório'),
    preco: zod_1.z.number().positive('Preço deve ser positivo'),
    estoque: zod_1.z.number().int().nonnegative('Estoque não pode ser negativo'),
    descricao: zod_1.z.string().optional(),
});
//# sourceMappingURL=ProdutoSchema.js.map