"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cotacaoSchema = void 0;
const zod_1 = require("zod");
exports.cotacaoSchema = zod_1.z.object({
    prompt_id: zod_1.z.number().int().positive(),
    produto_id: zod_1.z.number().int().positive(),
    preco: zod_1.z.number().positive(),
    observacao: zod_1.z.string().optional(),
});
//# sourceMappingURL=CotacaoSchema.js.map