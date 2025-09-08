"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fornecedorSchema = void 0;
const zod_1 = require("zod");
exports.fornecedorSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1, 'Nome é obrigatório'),
    contato_email: zod_1.z.string().email('E-mail inválido'),
    contato_telefone: zod_1.z.string().optional(),
    site: zod_1.z.string().optional(),
    observacoes: zod_1.z.string().optional(),
    ativo: zod_1.z.boolean(),
    cadastrado_em: zod_1.z.string(),
    cadastrado_por: zod_1.z.number(),
    atualizado_em: zod_1.z.string(),
    atualizado_por: zod_1.z.number(),
});
//# sourceMappingURL=FornecedorSchema.js.map