"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fornecedorSchema = void 0;
const zod_1 = require("zod");
exports.fornecedorSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1, 'Nome é obrigatório'),
    email: zod_1.z.string().email('E-mail inválido'),
    telefone: zod_1.z.string().optional(),
    endereco: zod_1.z.string().optional(),
});
//# sourceMappingURL=Fornecedor.schema.js.map