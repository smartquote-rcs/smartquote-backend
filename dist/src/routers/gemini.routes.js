"use strict";
/**
 * Rotas para interpretação de emails com Gemini AI
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const GeminiController_1 = __importDefault(require("../controllers/GeminiController"));
const router = (0, express_1.Router)();
const geminiController = new GeminiController_1.default();
/**
 * @route GET /api/gemini/interpretations
 * @desc Lista todas as interpretações de emails
 */
router.get('/interpretations', async (req, res) => {
    await geminiController.listarInterpretacoes(req, res);
});
/**
 * @route GET /api/gemini/interpretation/:emailId
 * @desc Busca interpretação de um email específico
 */
router.get('/interpretation/:emailId', async (req, res) => {
    await geminiController.buscarInterpretacaoPorEmail(req, res);
});
/**
 * @route POST /api/gemini/interpret/:emailId
 * @desc Força a interpretação de um email específico
 */
router.post('/interpret/:emailId', async (req, res) => {
    await geminiController.interpretarEmail(req, res);
});
/**
 * @route GET /api/gemini/test
 * @desc Testa a conexão com Gemini AI
 */
router.get('/test', async (req, res) => {
    await geminiController.testarGemini(req, res);
});
/**
 * @route GET /api/gemini/stats
 * @desc Obtém estatísticas das interpretações
 */
router.get('/stats', async (req, res) => {
    await geminiController.obterEstatisticas(req, res);
});
exports.default = router;
//# sourceMappingURL=gemini.routes.js.map