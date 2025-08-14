"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserSchema_1 = require("../schemas/UserSchema");
const UserService_1 = __importDefault(require("../services/UserService"));
class UserController {
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
            return res.status(400).json({ error: err.message });
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
            await UserService_1.default.delete(String(id));
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