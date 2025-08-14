/**
 * Rotas para monitoramento de emails
 */

import { Router } from 'express';
import EmailMonitorController from '../controllers/EmailMonitorController';

const router = Router();
const emailController = new EmailMonitorController();

/**
 * @swagger
 * /email/monitorar:
 *   get:
 *     summary: Monitora emails novos na caixa de entrada
 *     description: Verifica os últimos emails não processados e retorna até 4 emails novos
 *     tags: [Email Monitor]
 *     responses:
 *       200:
 *         description: Emails monitorados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     emailsEncontrados:
 *                       type: number
 *                     emails:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           de:
 *                             type: string
 *                           assunto:
 *                             type: string
 *                           data:
 *                             type: string
 *                           resumo:
 *                             type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/monitorar', emailController.monitorarEmails.bind(emailController));

/**
 * @swagger
 * /email/status:
 *   get:
 *     summary: Verifica o status do serviço de monitoramento
 *     description: Testa a conexão e autorização com o Gmail
 *     tags: [Email Monitor]
 *     responses:
 *       200:
 *         description: Serviço funcionando
 *       500:
 *         description: Serviço com problemas
 */
router.get('/status', emailController.statusServico.bind(emailController));

/**
 * @swagger
 * /email/testar:
 *   get:
 *     summary: Testa a conexão com o Gmail
 *     description: Verifica se a autenticação e permissões estão funcionando
 *     tags: [Email Monitor]
 *     responses:
 *       200:
 *         description: Conexão funcionando
 *       500:
 *         description: Erro na conexão
 */
router.get('/testar', emailController.testarConexao.bind(emailController));

/**
 * @swagger
 * /email/limpar-status:
 *   post:
 *     summary: Limpa status de emails antigos
 *     description: Remove registros antigos do cache de emails processados
 *     tags: [Email Monitor]
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Número de dias para manter no histórico
 *     responses:
 *       200:
 *         description: Limpeza realizada com sucesso
 *       500:
 *         description: Erro na limpeza
 */
router.post('/limpar-status', emailController.limparStatusAntigos.bind(emailController));

/**
 * @swagger
 * /email/auto-monitor/start:
 *   post:
 *     summary: Inicia o monitoramento automático de emails
 *     description: Inicia um processo em background que verifica emails novos a cada 10 segundos
 *     tags: [Auto Monitor]
 *     responses:
 *       200:
 *         description: Monitoramento automático iniciado
 *       400:
 *         description: Monitoramento já está rodando
 *       500:
 *         description: Erro interno
 */
router.post('/auto-monitor/start', emailController.iniciarAutoMonitoramento.bind(emailController));

/**
 * @swagger
 * /email/auto-monitor/stop:
 *   post:
 *     summary: Para o monitoramento automático de emails
 *     description: Para o processo em background de monitoramento
 *     tags: [Auto Monitor]
 *     responses:
 *       200:
 *         description: Monitoramento automático parado
 *       400:
 *         description: Monitoramento não está rodando
 *       500:
 *         description: Erro interno
 */
router.post('/auto-monitor/stop', emailController.pararAutoMonitoramento.bind(emailController));

/**
 * @swagger
 * /email/auto-monitor/restart:
 *   post:
 *     summary: Reinicia o monitoramento automático de emails
 *     description: Para e reinicia o processo em background de monitoramento
 *     tags: [Auto Monitor]
 *     responses:
 *       200:
 *         description: Monitoramento automático reiniciado
 *       500:
 *         description: Erro interno
 */
router.post('/auto-monitor/restart', emailController.reiniciarAutoMonitoramento.bind(emailController));

/**
 * @swagger
 * /email/auto-monitor/status:
 *   get:
 *     summary: Verifica o status do monitoramento automático
 *     description: Retorna informações sobre o estado atual do auto-monitoramento
 *     tags: [Auto Monitor]
 *     responses:
 *       200:
 *         description: Status obtido com sucesso
 */
router.get('/auto-monitor/status', emailController.statusAutoMonitoramento.bind(emailController));

/**
 * @swagger
 * /email/auto-monitor/config:
 *   put:
 *     summary: Atualiza configurações do auto-monitoramento
 *     description: Permite alterar intervalo, número máximo de emails, etc.
 *     tags: [Auto Monitor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               intervalSeconds:
 *                 type: integer
 *                 description: Intervalo em segundos entre verificações
 *               maxEmails:
 *                 type: integer
 *                 description: Número máximo de emails por verificação
 *               enabled:
 *                 type: boolean
 *                 description: Se o monitoramento está habilitado
 *     responses:
 *       200:
 *         description: Configurações atualizadas
 */
router.put('/auto-monitor/config', emailController.atualizarConfigAutoMonitoramento.bind(emailController));

/**
 * @swagger
 * /email/auto-monitor/logs:
 *   get:
 *     summary: Obtém logs do auto-monitoramento
 *     description: Retorna mensagens de log do processo de monitoramento
 *     tags: [Auto Monitor]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de mensagens de log
 *     responses:
 *       200:
 *         description: Logs obtidos com sucesso
 */
router.get('/auto-monitor/logs', emailController.logsAutoMonitoramento.bind(emailController));

/**
 * @swagger
 * /email/saved:
 *   get:
 *     summary: Lista emails salvos
 *     description: Retorna lista de emails que foram automaticamente salvos em PDF/JSON
 *     tags: [Emails Salvos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número de itens por página
 *     responses:
 *       200:
 *         description: Lista de emails salvos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     emails:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           savedAt:
 *                             type: string
 *                           formats:
 *                             type: array
 *                             items:
 *                               type: string
 *                           filePaths:
 *                             type: array
 *                             items:
 *                               type: string
 *                     pagination:
 *                       type: object
 *       500:
 *         description: Erro interno
 */
router.get('/saved', emailController.listarEmailsSalvos.bind(emailController));

/**
 * @swagger
 * /email/saved/{emailId}:
 *   get:
 *     summary: Verifica se um email foi salvo
 *     description: Verifica se um email específico foi salvo no sistema
 *     tags: [Emails Salvos]
 *     parameters:
 *       - in: path
 *         name: emailId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do email
 *     responses:
 *       200:
 *         description: Status do email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     emailId:
 *                       type: string
 *                     isSaved:
 *                       type: boolean
 *                     savedAt:
 *                       type: string
 *       400:
 *         description: ID do email é obrigatório
 *       500:
 *         description: Erro interno
 */
router.get('/saved/:emailId', emailController.verificarEmailSalvo.bind(emailController));

/**
 * @swagger
 * /email/saved/cleanup:
 *   delete:
 *     summary: Remove emails salvos antigos
 *     description: Remove emails salvos há mais de X dias do sistema
 *     tags: [Emails Salvos]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Número de dias para manter emails salvos
 *     responses:
 *       200:
 *         description: Limpeza realizada com sucesso
 *       500:
 *         description: Erro interno
 */
router.delete('/saved/cleanup', emailController.limparEmailsSalvosAntigos.bind(emailController));

/**
 * @swagger
 * /email/test/save:
 *   post:
 *     summary: Testa o salvamento de email
 *     description: Endpoint de teste para verificar se o sistema de salvamento está funcionando
 *     tags: [Teste]
 *     responses:
 *       200:
 *         description: Email de teste salvo com sucesso
 *       500:
 *         description: Erro no teste
 */
router.post('/test/save', emailController.testarSalvamentoEmail.bind(emailController));

export default router;
