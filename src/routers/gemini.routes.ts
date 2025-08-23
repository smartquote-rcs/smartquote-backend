/**
 * Rotas para interpretação de emails com Gemini AI
 */

import { Router } from 'express';
import GeminiController from '../controllers/GeminiController';

const router = Router();
const geminiController = new GeminiController();

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

export default router;
