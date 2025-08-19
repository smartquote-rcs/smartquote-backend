"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cotacaoSchema = void 0;
const zod_1 = require("zod");
exports.cotacaoSchema = zod_1.z.object({
    // relações
    prompt_id: zod_1.z.number().int().positive(),
    produto_id: zod_1.z.number().int().positive(),
    // campos opcionais (após migração)
    aprovacao: zod_1.z.boolean().optional(),
    motivo: zod_1.z.string().optional(),
    aprovado_por: zod_1.z.number().int().optional(),
    // novos campos essenciais
    status: zod_1.z.enum(['completa', 'incompleta']).optional(),
    orcamento_geral: zod_1.z.number().nonnegative().optional(),
    faltantes: zod_1.z.any().optional(), // jsonb
    // observações
    observacao: zod_1.z.string().optional(),
});
//# sourceMappingURL=CotacaoSchema.js.map