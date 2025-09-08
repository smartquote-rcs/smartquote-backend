"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const RelatoriosController_1 = __importDefault(require("../controllers/RelatoriosController"));
const router = (0, express_1.Router)();
/**
 * @route POST /api/relatorios/gerar/:cotacaoId
 * @desc Gera e faz download direto do relatório em PDF para uma cotação
 * @access Private
 */
//router.post('/gerar/:cotacaoId', authMiddleware, RelatoriosController.gerarRelatorio);
router.post('/gerar/:cotacaoId', RelatoriosController_1.default.gerarRelatorio);
/**
 * @route POST /api/relatorios/gerar-csv/:cotacaoId
 * @desc Gera e faz download direto do relatório em CSV para uma cotação
 * @access Private
 */
router.post('/gerar-csv/:cotacaoId', RelatoriosController_1.default.gerarRelatorioCSV);
/**
 * @route POST /api/relatorios/gerar-xlsx/:cotacaoId
 * @desc Gera e faz download direto do relatório em XLSX para uma cotação
 * @access Private
 */
router.post('/gerar-xlsx/:cotacaoId', RelatoriosController_1.default.gerarRelatorioXLSX);
/**
 * @route GET /api/relatorios/download/:filename
 * @desc Download do arquivo PDF gerado
 * @access Private
 */
router.get('/download/:filename', authMiddleware_1.authMiddleware, RelatoriosController_1.default.downloadRelatorio);
/**
 * @route GET /api/relatorios/status/:cotacaoId
 * @desc Verifica se uma cotação está pronta para relatório
 * @access Private
 */
router.get('/status/:cotacaoId', authMiddleware_1.authMiddleware, RelatoriosController_1.default.statusRelatorio);
/**
 * @route GET /api/relatorios/listar/:cotacaoId
 * @desc Lista todos os relatórios disponíveis para uma cotação
 * @access Private
 */
router.get('/listar/:cotacaoId', authMiddleware_1.authMiddleware, RelatoriosController_1.default.listarRelatorios);
/**
 * @route PUT /api/relatorios/proposta-email/:cotacaoId
 * @desc Atualiza ou cria o conteúdo da proposta de email para uma cotação
 * @access public
 */
router.put('/proposta-email/:cotacaoId', RelatoriosController_1.default.atualizarPropostaEmail);
/**
 * @route GET /api/relatorios/proposta-email/:cotacaoId
 * @desc obter proposta de email se já tiver sido gerada
 * @access public
 */
router.get('/proposta-email/:cotacaoId', RelatoriosController_1.default.obterPropostaEmail);
/**
 * @route POST /api/relatorios/proposta-email-ia/:cotacaoId
 * @desc Gera um email editado por IA (Gemini) a partir de um emailOriginal e um prompt de modificação
 * @access public
 * body: { emailOriginal: string, promptModificacao: string }
 */
router.post('/proposta-email-ia/:cotacaoId', RelatoriosController_1.default.gerarPropostaEmailIA);
exports.default = router;
//# sourceMappingURL=relatorios.routes.js.map