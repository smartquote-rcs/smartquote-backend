"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sistemaUpdateSchema = exports.sistemaSchema = void 0;
const zod_1 = require("zod");
exports.sistemaSchema = zod_1.z.object({
    nome_empresa: zod_1.z.string().min(1, 'Nome da empresa é obrigatório'),
    idioma: zod_1.z.string().min(1, 'Idioma é obrigatório'),
    fuso_horario: zod_1.z.string().min(1, 'Fuso horário é obrigatório'),
    moeda: zod_1.z.string().min(1, 'Moeda é obrigatória'),
    backup: zod_1.z.string().min(1, 'Configuração de backup é obrigatória'),
    manutencao: zod_1.z.boolean(),
    tempo_de_sessao: zod_1.z.number().int().min(1, 'Tempo de sessão deve ser maior que 0'),
    politica_senha: zod_1.z.enum(['forte', 'medio']),
    log_auditoria: zod_1.z.boolean(),
    ip_permitidos: zod_1.z.string().min(1, 'IPs permitidos são obrigatórios')
});
exports.sistemaUpdateSchema = zod_1.z.object({
    nome_empresa: zod_1.z.string().min(1, 'Nome da empresa é obrigatório').optional(),
    idioma: zod_1.z.string().min(1, 'Idioma é obrigatório').optional(),
    fuso_horario: zod_1.z.string().min(1, 'Fuso horário é obrigatório').optional(),
    moeda: zod_1.z.string().min(1, 'Moeda é obrigatória').optional(),
    backup: zod_1.z.string().min(1, 'Configuração de backup é obrigatória').optional(),
    manutencao: zod_1.z.boolean().optional(),
    tempo_de_sessao: zod_1.z.number().int().min(1, 'Tempo de sessão deve ser maior que 0').optional(),
    politica_senha: zod_1.z.enum(['forte', 'medio']).optional(),
    log_auditoria: zod_1.z.boolean().optional(),
    ip_permitidos: zod_1.z.string().min(1, 'IPs permitidos são obrigatórios').optional()
});
//# sourceMappingURL=SistemaSchema.js.map