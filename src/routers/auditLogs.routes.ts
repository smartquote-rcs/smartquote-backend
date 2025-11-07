import { Router } from 'express';
import { AuditLogController } from '../controllers/AuditLogController';

const auditLogsRouter = Router();
const auditLogController = new AuditLogController();

/**
 * @swagger
 * tags:
 *   name: AuditLogs
 *   description: Gerenciamento de logs de auditoria
 */

/**
 * @swagger
 * /audit-logs:
 *   post:
 *     summary: Cria um novo log de auditoria
 *     tags: [AuditLogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - action
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               action:
 *                 type: string
 *               tabela_afetada:
 *                 type: string
 *               registo_id:
 *                 type: integer
 *               detalhes_alteracao:
 *                 type: object
 *     responses:
 *       201:
 *         description: Log de auditoria criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
auditLogsRouter.post('/', (req, res) => auditLogController.create(req, res));

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Lista logs de auditoria com filtros
 *     tags: [AuditLogs]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: tabela_afetada
 *         schema:
 *           type: string
 *       - in: query
 *         name: registo_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Lista de logs de auditoria
 *       500:
 *         description: Erro interno do servidor
 */
auditLogsRouter.get('/', (req, res) => auditLogController.findAll(req, res));

/**
 * @swagger
 * /audit-logs/statistics:
 *   get:
 *     summary: Obtém estatísticas de auditoria
 *     tags: [AuditLogs]
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Estatísticas de auditoria
 *       500:
 *         description: Erro interno do servidor
 */
auditLogsRouter.get('/statistics', (req, res) => auditLogController.getStatistics(req, res));

/**
 * @swagger
 * /audit-logs/user/{userId}:
 *   get:
 *     summary: Busca logs de um usuário específico
 *     tags: [AuditLogs]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Logs do usuário
 *       500:
 *         description: Erro interno do servidor
 */
auditLogsRouter.get('/user/:userId', (req, res) => auditLogController.findByUserId(req, res));

/**
 * @swagger
 * /audit-logs/action/{action}:
 *   get:
 *     summary: Busca logs por ação
 *     tags: [AuditLogs]
 *     parameters:
 *       - in: path
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Logs da ação
 *       500:
 *         description: Erro interno do servidor
 */
auditLogsRouter.get('/action/:action', (req, res) => auditLogController.findByAction(req, res));

/**
 * @swagger
 * /audit-logs/table/{tableName}:
 *   get:
 *     summary: Busca logs por tabela afetada
 *     tags: [AuditLogs]
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Logs da tabela
 *       500:
 *         description: Erro interno do servidor
 */
auditLogsRouter.get('/table/:tableName', (req, res) => auditLogController.findByTable(req, res));

/**
 * @swagger
 * /audit-logs/record/{tableName}/{recordId}:
 *   get:
 *     summary: Busca logs de um registro específico
 *     tags: [AuditLogs]
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Logs do registro
 *       404:
 *         description: Registro não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
auditLogsRouter.get('/record/:tableName/:recordId', (req, res) => auditLogController.findByRecord(req, res));

/**
 * @swagger
 * /audit-logs/{id}:
 *   get:
 *     summary: Busca um log específico por ID
 *     tags: [AuditLogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Log de auditoria encontrado
 *       404:
 *         description: Log não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
auditLogsRouter.get('/:id', (req, res) => auditLogController.findById(req, res));

/**
 * @swagger
 * /audit-logs/cleanup/{days}:
 *   delete:
 *     summary: Deleta logs mais antigos que X dias (mínimo 30 dias)
 *     tags: [AuditLogs]
 *     parameters:
 *       - in: path
 *         name: days
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 30
 *     responses:
 *       200:
 *         description: Logs deletados com sucesso
 *       400:
 *         description: Parâmetro inválido
 *       500:
 *         description: Erro interno do servidor
 */
auditLogsRouter.delete('/cleanup/:days', (req, res) => auditLogController.cleanup(req, res));

export default auditLogsRouter;
