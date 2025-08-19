"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = void 0;
const zod_1 = require("zod");
exports.userSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, 'O nome é obrigatório.')
        .max(100, 'O nome não pode ter mais de 100 caracteres.'),
    email: zod_1.z.string().email('E-mail inválido.'),
    contact: zod_1.z
        .string()
        .min(1, 'O contato é obrigatório.')
        .regex(/^\d{9}$/, 'O contato deve ser um número de telefone válido com 9 dígitos.'),
    password: zod_1.z
        .string()
        .min(6, 'A senha deve ter pelo menos 6 caracteres.')
        .max(100, 'A senha não pode ter mais de 100 caracteres.'),
    department: zod_1.z
        .string()
        .min(1, 'O departamento é obrigatório.')
        .max(100, 'O departamento não pode ter mais de 100 caracteres.'),
    position: zod_1.z
        .string()
        .min(1, 'O cargo é obrigatório.')
        .max(100, 'O cargo não pode ter mais de 100 caracteres.'),
});
//# sourceMappingURL=UserSchema.js.map