"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SistemaSchema_1 = require("../schemas/SistemaSchema");
const SistemaService_1 = __importDefault(require("../services/SistemaService"));
class SistemaController {
    /**
     * Busca as configurações do sistema
     */
    async getSistema(req, res) {
        try {
            const sistema = await SistemaService_1.default.getSistema();
            if (!sistema) {
                // Se não existir configuração, criar uma padrão
                const configuracaoPadrao = await SistemaService_1.default.criarConfiguracaoPadrao();
                return res.status(200).json({
                    success: true,
                    message: 'Configurações padrão criadas',
                    data: configuracaoPadrao
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Configurações do sistema encontradas',
                data: sistema
            });
        }
        catch (error) {
            console.error('Erro ao buscar configurações do sistema:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    /**
     * Cria ou atualiza as configurações do sistema
     */
    async upsertSistema(req, res) {
        const parsed = SistemaSchema_1.sistemaSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors
            });
        }
        try {
            const sistema = await SistemaService_1.default.upsertSistema(parsed.data);
            return res.status(200).json({
                success: true,
                message: 'Configurações do sistema salvas com sucesso',
                data: sistema
            });
        }
        catch (error) {
            console.error('Erro ao salvar configurações do sistema:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    /**
     * Atualiza parcialmente as configurações do sistema
     */
    async updateSistema(req, res) {
        const parsed = SistemaSchema_1.sistemaUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors
            });
        }
        try {
            const sistema = await SistemaService_1.default.updateSistema(parsed.data);
            return res.status(200).json({
                success: true,
                message: 'Configurações do sistema atualizadas com sucesso',
                data: sistema
            });
        }
        catch (error) {
            console.error('Erro ao atualizar configurações do sistema:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
}
exports.default = new SistemaController();
//# sourceMappingURL=SistemaController.js.map