"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const FornecedoresService_1 = __importDefault(require("../services/FornecedoresService"));
const FornecedorSchema_1 = require("../schemas/FornecedorSchema");
const AuditLogHelper_1 = require("../utils/AuditLogHelper");
class FornecedoresController {
    async create(req, res) {
        const parsed = FornecedorSchema_1.fornecedorSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            console.error('❌ Validação fornecedor falhou:', errors, 'Payload recebido:', req.body);
            return res.status(400).json({ errors });
        }
        try {
            console.log('✅ Validação fornecedor ok. Dados normalizados:', parsed.data);
            const fornecedor = await FornecedoresService_1.default.create(parsed.data);
            // Log de auditoria: Criação de fornecedor
            const userId = req.user?.id || 'system';
            AuditLogHelper_1.auditLog.logCreate(userId, 'fornecedores', fornecedor.id, {
                nome: fornecedor.nome,
                contato: fornecedor.contato,
                email: fornecedor.email
            }).catch(console.error);
            return res.status(201).json({
                message: 'Fornecedor cadastrado com sucesso.',
                data: fornecedor,
            });
        }
        catch (err) {
            console.error('💥 Erro ao criar fornecedor:', err);
            return res.status(400).json({ error: err.message });
        }
    }
    async getAll(req, res) {
        try {
            const fornecedores = await FornecedoresService_1.default.getAll();
            return res.status(200).json({
                message: 'Lista de fornecedores.',
                data: fornecedores,
            });
        }
        catch (err) {
            console.error('Erro ao buscar fornecedores:', err);
            return res.status(500).json({ error: err.message, stack: err.stack });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const fornecedor = await FornecedoresService_1.default.getById(Number(id));
            return res.status(200).json({
                message: 'Fornecedor encontrado.',
                data: fornecedor,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || 'system';
            // Buscar fornecedor antes de deletar
            let fornecedorParaDeletar;
            try {
                fornecedorParaDeletar = await FornecedoresService_1.default.getById(Number(id));
            }
            catch (error) {
                console.warn('Fornecedor não encontrado para log:', id);
            }
            await FornecedoresService_1.default.delete(Number(id));
            // Log de auditoria: Deleção de fornecedor
            AuditLogHelper_1.auditLog.logDelete(userId, 'fornecedores', Number(id), fornecedorParaDeletar ? {
                nome: fornecedorParaDeletar.nome,
                email: fornecedorParaDeletar.email
            } : undefined).catch(console.error);
            return res.status(200).json({ message: 'Fornecedor deletado com sucesso.' });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async patch(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || 'system';
            const updates = req.body;
            // Buscar dados antigos
            let oldData;
            try {
                oldData = await FornecedoresService_1.default.getById(Number(id));
            }
            catch (error) {
                console.warn('Fornecedor não encontrado para log de update:', id);
            }
            const fornecedorAtualizado = await FornecedoresService_1.default.updatePartial(Number(id), updates);
            // Log de auditoria: Atualização de fornecedor
            AuditLogHelper_1.auditLog.logUpdate(userId, 'fornecedores', Number(id), oldData, updates).catch(console.error);
            return res.status(200).json({
                message: 'Fornecedor atualizado com sucesso.',
                data: fornecedorAtualizado,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}
exports.default = new FornecedoresController();
//# sourceMappingURL=FornecedoresController.js.map