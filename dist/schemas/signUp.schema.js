"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUpSchema = void 0;
const zod_1 = require("zod");
exports.signUpSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'Username é obrigatório'),
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});
//# sourceMappingURL=signUp.schema.js.map