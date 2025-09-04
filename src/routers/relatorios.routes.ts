import { Router } from 'express';
import RelatorioService from '../services/RelatorioService';
import { authMiddleware } from '../middleware/authMiddleware';
import supabase from '../infra/supabase/connect';
import RelatoriosController from '../controllers/RelatoriosController'
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * @route POST /api/relatorios/gerar/:cotacaoId
 * @desc Gera e faz download direto do relatório em PDF para uma cotação
 * @access Private
 */
//router.post('/gerar/:cotacaoId', authMiddleware, RelatoriosController.gerarRelatorio);
router.post('/gerar/:cotacaoId', RelatoriosController.gerarRelatorio);

/**
 * @route POST /api/relatorios/gerar-csv/:cotacaoId
 * @desc Gera e faz download direto do relatório em CSV para uma cotação
 * @access Private
 */
router.post('/gerar-csv/:cotacaoId', RelatoriosController.gerarRelatorioCSV);

/**
 * @route POST /api/relatorios/gerar-xlsx/:cotacaoId
 * @desc Gera e faz download direto do relatório em XLSX para uma cotação
 * @access Private
 */
router.post('/gerar-xlsx/:cotacaoId', RelatoriosController.gerarRelatorioXLSX);
/**
 * @route GET /api/relatorios/download/:filename
 * @desc Download do arquivo PDF gerado
 * @access Private
 */
router.get('/download/:filename', authMiddleware, RelatoriosController.downloadRelatorio);

/**
 * @route GET /api/relatorios/status/:cotacaoId
 * @desc Verifica se uma cotação está pronta para relatório
 * @access Private
 */
router.get('/status/:cotacaoId', authMiddleware, RelatoriosController.statusRelatorio);

/**
 * @route GET /api/relatorios/listar/:cotacaoId
 * @desc Lista todos os relatórios disponíveis para uma cotação
 * @access Private
 */
router.get('/listar/:cotacaoId', authMiddleware, RelatoriosController.listarRelatorios);

/**
 * @route PUT /api/relatorios/proposta-email/:cotacaoId
 * @desc Atualiza ou cria o conteúdo da proposta de email para uma cotação
 * @access public
 */
router.put('/proposta-email/:cotacaoId', RelatoriosController.atualizarPropostaEmail);

/**
 * @route GET /api/relatorios/proposta-email/:cotacaoId
 * @desc obter proposta de email se já tiver sido gerada
 * @access public
 */
router.get('/proposta-email/:cotacaoId', RelatoriosController.obterPropostaEmail);

export default router;
