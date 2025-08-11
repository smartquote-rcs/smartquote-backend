"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CotacoesService_1 = __importDefault(require("../services/CotacoesService"));
const cotacao_schema_1 = require("../schemas/cotacao.schema");
class CotacoesController {
    async create(req, res) {
        const parsed = cotacao_schema_1.cotacaoSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({ errors });
        }
        try {
            const cotacao = await CotacoesService_1.default.create(parsed.data);
            return res.status(201).json({
                message: 'Cotação cadastrada com sucesso.',
                data: cotacao,
            });
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    async getAll(req, res) {
        try {
            const cotacoes = await CotacoesService_1.default.getAll();
            return res.status(200).json({
                message: 'Lista de cotações.',
                data: cotacoes,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const cotacao = await CotacoesService_1.default.getById(Number(id));
            return res.status(200).json({
                message: 'Cotação encontrada.',
                data: cotacao,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await CotacoesService_1.default.delete(Number(id));
            return res.status(200).json({ message: 'Cotação deletada com sucesso.' });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async patch(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const cotacaoAtualizada = await CotacoesService_1.default.updatePartial(Number(id), updates);
            return res.status(200).json({
                message: 'Cotação atualizada com sucesso.',
                data: cotacaoAtualizada,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}
exports.default = new CotacoesController();
//# sourceMappingURL=cotacoes.controller.js.map