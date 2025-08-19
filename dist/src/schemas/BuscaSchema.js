"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buscaSchema = void 0;
const zod_1 = require("zod");
exports.buscaSchema = zod_1.z.object({
    produto: zod_1.z.string()
        .min(1, "O campo produto é obrigatório")
        .min(2, "O produto deve ter pelo menos 2 caracteres")
        .max(100, "O produto deve ter no máximo 100 caracteres")
        .transform(val => val.trim())
});
//# sourceMappingURL=BuscaSchema.js.map