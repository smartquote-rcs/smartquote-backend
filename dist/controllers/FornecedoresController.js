"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const FornecedoresService_1 = __importDefault(require("../services/FornecedoresService"));
const FornecedorSchema_1 = require("../schemas/FornecedorSchema");
class FornecedoresController {
    async create(req, res) {
        const parsed = FornecedorSchema_1.fornecedorSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({ errors });
        }
        try {
            const fornecedor = await FornecedoresService_1.default.create(parsed.data);
            return res.status(201).json({
                message: 'Fornecedor cadastrado com sucesso.',
                data: fornecedor,
            });
        }
        catch (err) {
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
            return res.status(500).json({ error: err.message });
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
            await FornecedoresService_1.default.delete(Number(id));
            return res.status(200).json({ message: 'Fornecedor deletado com sucesso.' });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async patch(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const fornecedorAtualizado = await FornecedoresService_1.default.updatePartial(Number(id), updates);
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