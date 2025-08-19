"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CotacoesService_1 = __importDefault(require("../services/CotacoesService"));
const CotacaoSchema_1 = require("../schemas/CotacaoSchema");
class CotacoesController {
    async create(req, res) {
        // compat: aceitar camelCase e converter
        const body = { ...req.body };
        if (body.promptId && !body.prompt_id)
            body.prompt_id = body.promptId;
        if (body.produtoId && !body.produto_id)
            body.produto_id = body.produtoId;
        if (body.aprovadoPor && !body.aprovado_por)
            body.aprovado_por = body.aprovadoPor;
        if (body.orcamentoGeral && !body.orcamento_geral)
            body.orcamento_geral = body.orcamentoGeral;
        if (body.dataAprovacao && !body.data_aprovacao)
            body.data_aprovacao = body.dataAprovacao;
        if (body.dataSolicitacao && !body.data_solicitacao)
            body.data_solicitacao = body.dataSolicitacao;
        if (body.prazoValidade && !body.prazo_validade)
            body.prazo_validade = body.prazoValidade;
        // mapear status antigo -> novo
        if (body.status && ['pendente', 'aceite', 'recusado'].includes(body.status)) {
            body.status = body.status === 'aceite' ? 'completa' : 'incompleta';
        }
        const parsed = CotacaoSchema_1.cotacaoSchema.safeParse(body);
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
            const updates = { ...req.body };
            if (updates.promptId && !updates.prompt_id)
                updates.prompt_id = updates.promptId;
            if (updates.produtoId && !updates.produto_id)
                updates.produto_id = updates.produtoId;
            if (updates.aprovadoPor && !updates.aprovado_por)
                updates.aprovado_por = updates.aprovadoPor;
            if (updates.orcamentoGeral && !updates.orcamento_geral)
                updates.orcamento_geral = updates.orcamentoGeral;
            if (updates.dataAprovacao && !updates.data_aprovacao)
                updates.data_aprovacao = updates.dataAprovacao;
            if (updates.dataSolicitacao && !updates.data_solicitacao)
                updates.data_solicitacao = updates.dataSolicitacao;
            if (updates.prazoValidade && !updates.prazo_validade)
                updates.prazo_validade = updates.prazoValidade;
            if (updates.status && ['pendente', 'aceite', 'recusado'].includes(updates.status)) {
                updates.status = updates.status === 'aceite' ? 'completa' : 'incompleta';
            }
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
//# sourceMappingURL=CotacoesController.js.map