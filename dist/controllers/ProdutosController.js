"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ProdutoService_1 = require("../services/ProdutoService");
const ProdutoSchema_1 = require("../schemas/ProdutoSchema");
const produtosService = new ProdutoService_1.ProdutosService();
class ProdutosController {
    async create(req, res) {
        const parsed = ProdutoSchema_1.produtoSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({ errors });
        }
        try {
            const produto = await produtosService.create(parsed.data);
            return res.status(201).json({
                message: 'Produto cadastrado com sucesso.',
                data: produto,
            });
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    async getAll(req, res) {
        try {
            const produtos = await produtosService.getAll();
            return res.status(200).json({
                message: 'Lista de produtos.',
                data: produtos,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const produto = await produtosService.getById(Number(id));
            return res.status(200).json({
                message: 'Produto encontrado.',
                data: produto,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await produtosService.delete(Number(id));
            return res.status(200).json({ message: 'Produto deletado com sucesso.' });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async patch(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const produtoAtualizado = await produtosService.updatePartial(Number(id), updates);
            return res.status(200).json({
                message: 'Produto atualizado com sucesso.',
                data: produtoAtualizado,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}
exports.default = new ProdutosController();
//# sourceMappingURL=ProdutosController.js.map