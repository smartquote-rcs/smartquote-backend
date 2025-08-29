"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePromptSchema = exports.promptSchema = void 0;
const zod_1 = require("zod");
exports.promptSchema = zod_1.z.object({
    texto_original: zod_1.z.string(),
    dados_extraidos: zod_1.z.any().optional(),
    cliente: zod_1.z.any().optional(),
    dados_bruto: zod_1.z.any().optional(),
    origem: zod_1.z.any().optional(),
    status: zod_1.z.string().optional(),
});
exports.updatePromptSchema = exports.promptSchema.partial();
//# sourceMappingURL=PromptSchema.js.map