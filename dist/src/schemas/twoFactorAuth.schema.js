"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeTwoFactorSchema = exports.verifyTwoFactorSchema = exports.initiateTwoFactorSchema = void 0;
const zod_1 = require("zod");
exports.initiateTwoFactorSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .min(1, 'E-mail é obrigatório')
        .email('E-mail inválido'),
});
exports.verifyTwoFactorSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .min(1, 'E-mail é obrigatório')
        .email('E-mail inválido'),
    code: zod_1.z
        .string()
        .min(6, 'O código deve ter 6 dígitos')
        .max(6, 'O código deve ter 6 dígitos'),
});
exports.completeTwoFactorSchema = zod_1.z.object({
    temporaryToken: zod_1.z
        .string()
        .min(1, 'Token temporário é obrigatório'),
    password: zod_1.z
        .string()
        .min(6, 'A senha deve ter no mínimo 6 caracteres'),
});
//# sourceMappingURL=twoFactorAuth.schema.js.map