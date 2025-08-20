"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estoqueVerificationSchema = exports.notificationUpdateSchema = exports.notificationSchema = void 0;
const zod_1 = require("zod");
exports.notificationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Título é obrigatório').max(100, 'Título deve ter no máximo 100 caracteres'),
    subject: zod_1.z.string().min(1, 'Assunto é obrigatório').max(255, 'Assunto deve ter no máximo 255 caracteres'),
    type: zod_1.z.string().min(1, 'Tipo é obrigatório').max(50, 'Tipo deve ter no máximo 50 caracteres'),
    url_redir: zod_1.z.string().url('URL deve ser válida').optional().or(zod_1.z.literal(''))
});
exports.notificationUpdateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100).optional(),
    subject: zod_1.z.string().min(1).max(255).optional(),
    type: zod_1.z.string().min(1).max(50).optional(),
    url_redir: zod_1.z.string().url().optional().or(zod_1.z.literal(''))
});
// Schema para verificação de estoque
exports.estoqueVerificationSchema = zod_1.z.object({
    estoqueMinimo: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0, 'Estoque mínimo deve ser maior ou igual a 0')).optional()
});
//# sourceMappingURL=NotificationSchema.js.map