import { Router } from 'express';
import SistemaController from '../controllers/SistemaController';
import { authMiddleware } from '../middleware/authMiddleware';

const sistemaRouter = Router();

/**
 * @swagger
 * /sistema:
 *   get:
 *     summary: Busca as configurações do sistema
 *     description: Retorna as configurações atuais do sistema (empresa, idioma, fuso horário, moeda, backup, manutenção, etc.)
 *     tags: [Sistema]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configurações encontradas
 *       500:
 *         description: Erro interno do servidor
 */
sistemaRouter.get('/', authMiddleware, SistemaController.getSistema);

/**
 * @swagger
 * /sistema:
 *   post:
 *     summary: Cria ou atualiza as configurações do sistema
 *     description: Salva as configurações do sistema (empresa, idioma, fuso horário, moeda, backup, manutenção, etc.)
 *     tags: [Sistema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: body
 *         name: sistema
 *         description: Dados das configurações do sistema
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             nome_empresa:
 *               type: string
 *               example: "SmartQuote Ltda"
 *             idioma:
 *               type: string
 *               example: "pt-BR"
 *             fuso_horario:
 *               type: string
 *               example: "America/Sao_Paulo"
 *             moeda:
 *               type: string
 *               example: "BRL"
 *             backup:
 *               type: string
 *               example: "diario"
 *             manutencao:
 *               type: boolean
 *               example: false
 *             tempo_de_sessao:
 *               type: integer
 *               example: 480
 *             politica_senha:
 *               type: string
 *               enum: ["forte", "medio"]
 *               example: "forte"
 *             log_auditoria:
 *               type: boolean
 *               example: true
 *             ip_permitidos:
 *               type: string
 *               example: "192.168.1.0/24,10.0.0.0/8"
 *           required:
 *             - nome_empresa
 *             - idioma
 *             - fuso_horario
 *             - moeda
 *             - backup
 *             - manutencao
 *             - tempo_de_sessao
 *             - politica_senha
 *             - log_auditoria
 *             - ip_permitidos
 *     responses:
 *       200:
 *         description: Configurações salvas com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
sistemaRouter.post('/', authMiddleware, SistemaController.upsertSistema);

/**
 * @swagger
 * /sistema:
 *   patch:
 *     summary: Atualiza parcialmente as configurações do sistema
 *     description: Atualiza apenas os campos especificados das configurações do sistema
 *     tags: [Sistema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: body
 *         name: sistema
 *         description: Campos a serem atualizados
 *         schema:
 *           type: object
 *           properties:
 *             nome_empresa:
 *               type: string
 *               example: "SmartQuote Pro Ltda"
 *             idioma:
 *               type: string
 *               example: "en-US"
 *             fuso_horario:
 *               type: string
 *               example: "America/New_York"
 *             moeda:
 *               type: string
 *               example: "USD"
 *             backup:
 *               type: string
 *               example: "semanal"
 *             manutencao:
 *               type: boolean
 *               example: true
 *             tempo_de_sessao:
 *               type: integer
 *               example: 360
 *             politica_senha:
 *               type: string
 *               enum: ["forte", "medio"]
 *               example: "medio"
 *             log_auditoria:
 *               type: boolean
 *               example: false
 *             ip_permitidos:
 *               type: string
 *               example: "10.0.0.0/8"
 *     responses:
 *       200:
 *         description: Configurações atualizadas com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Configurações não encontradas
 *       500:
 *         description: Erro interno do servidor
 */
sistemaRouter.patch('/', authMiddleware, SistemaController.updateSistema);

export default sistemaRouter;