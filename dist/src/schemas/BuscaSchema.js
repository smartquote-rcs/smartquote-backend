"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buscaSchema = void 0;
const zod_1 = require("zod");
exports.buscaSchema = zod_1.z.object({
    produto: zod_1.z.string()
        .min(1, "O campo produto é obrigatório")
        .min(2, "O produto deve ter pelo menos 2 caracteres")
        .max(100, "O produto deve ter no máximo 100 caracteres")
        .transform(val => val.trim()),
    quantidade: zod_1.z.number().optional().default(1),
    custo_beneficio: zod_1.z.any().optional(),
    rigor: zod_1.z.number().int().min(0).max(5).optional().default(0),
    refinamento: zod_1.z.boolean().optional().default(false),
    faltante_id: zod_1.z.string().optional() // ID do faltante para rastreamento
});
//# sourceMappingURL=BuscaSchema.js.map