"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserSchema_1 = require("../schemas/UserSchema");
const UserService_1 = __importDefault(require("../services/UserService"));
const AuditLogHelper_1 = require("../utils/AuditLogHelper");
class UserController {
    async getByEmail(req, res) {
        try {
            const email = req.params.email;
            const user = await UserService_1.default.getByEmail(email);
            // Log para depuração
            console.log('DEBUG USER:', user);
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            // Retorna exatamente o que está no banco, inclusive position
            return res.status(200).json(user);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async getByAuthId(req, res) {
        try {
            const authId = req.params.authId;
            const user = await UserService_1.default.getByAuthId(authId);
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            return res.status(200).json(user);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async create(req, res) {
        const parsed = UserSchema_1.userSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({ errors });
        }
        try {
            const user = await UserService_1.default.create(parsed.data);
            return res.status(201).json({
                message: 'Funcionário cadastrado com sucesso.',
                user: user,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async getAll(req, res) {
        try {
            const users = await UserService_1.default.getAll();
            return res.status(200).json({
                message: 'Lista de users.',
                data: users,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const user = await UserService_1.default.getById(String(id));
            return res.status(200).json({
                message: 'User.',
                data: user,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            const currentUserId = req.user?.id || 'system';
            // Buscar usuário antes de deletar
            let userParaDeletar;
            try {
                userParaDeletar = await UserService_1.default.getById(String(id));
            }
            catch (error) {
                console.warn('Usuário não encontrado para log:', id);
            }
            await UserService_1.default.delete(String(id));
            // Log de auditoria: Deleção de usuário
            AuditLogHelper_1.auditLog.log(currentUserId, 'DELETE_USER', 'users', undefined, {
                usuario_deletado_id: id,
                nome: userParaDeletar?.name
            }).catch(console.error);
            return res.status(200).json({ message: 'User deletado com sucesso.' });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async patch(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const updatedUser = await UserService_1.default.updatePartial(String(id), updates);
            return res.status(200).json({
                message: 'User atualizado com sucesso.',
                data: updatedUser,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}
exports.default = new UserController();
//# sourceMappingURL=UserController.js.map