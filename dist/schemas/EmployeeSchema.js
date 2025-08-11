"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeSchema = void 0;
const zod_1 = require("zod");
exports.employeeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório'),
    email: zod_1.z.string().email('E-mail inválido'),
    password: zod_1.z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    position: zod_1.z.string().min(1, 'Cargo é obrigatório'),
});
//# sourceMappingURL=EmployeeSchema.js.map