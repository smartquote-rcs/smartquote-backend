import { Request, Response } from 'express';
import { AuditLogService } from '../services/AuditLogService';
import { CreateAuditLogDTO, AuditLogFilter } from '../models/AuditLog';

export class AuditLogController {
    private auditLogService: AuditLogService;

    constructor() {
        this.auditLogService = new AuditLogService();
    }

    /**
     * POST /audit-logs
     * Cria um novo log de auditoria
     */
    async create(req: Request, res: Response): Promise<Response> {
        try {
            const data: CreateAuditLogDTO = req.body;

            // Validação básica
            if (!data.user_id || !data.action) {
                return res.status(400).json({
                    error: 'user_id e action são obrigatórios'
                });
            }

            const auditLog = await this.auditLogService.create(data);

            if (!auditLog) {
                return res.status(500).json({
                    error: 'Erro ao criar log de auditoria'
                });
            }

            return res.status(201).json(auditLog);
        } catch (error) {
            console.error('Erro no controller ao criar log:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }

    /**
     * GET /audit-logs
     * Lista logs de auditoria com filtros
     */
    async findAll(req: Request, res: Response): Promise<Response> {
        try {
            const filters: AuditLogFilter = {
                user_id: req.query.user_id as string,
                action: req.query.action as string,
                tabela_afetada: req.query.tabela_afetada as string,
                registo_id: req.query.registo_id ? Number(req.query.registo_id) : undefined,
                start_date: req.query.start_date as string,
                end_date: req.query.end_date as string,
                limit: req.query.limit ? Number(req.query.limit) : 50,
                offset: req.query.offset ? Number(req.query.offset) : 0
            };

            // Remove undefined values
            Object.keys(filters).forEach(key => {
                if (filters[key as keyof AuditLogFilter] === undefined) {
                    delete filters[key as keyof AuditLogFilter];
                }
            });

            const { data, count } = await this.auditLogService.findAll(filters);

            return res.status(200).json({
                data,
                count,
                limit: filters.limit,
                offset: filters.offset
            });
        } catch (error) {
            console.error('Erro no controller ao buscar logs:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }

    /**
     * GET /audit-logs/:id
     * Busca um log específico por ID
     */
    async findById(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                return res.status(400).json({
                    error: 'ID inválido'
                });
            }

            const auditLog = await this.auditLogService.findById(id);

            if (!auditLog) {
                return res.status(404).json({
                    error: 'Log de auditoria não encontrado'
                });
            }

            return res.status(200).json(auditLog);
        } catch (error) {
            console.error('Erro no controller ao buscar log:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }

    /**
     * GET /audit-logs/user/:userId
     * Busca logs de um usuário específico
     */
    async findByUserId(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId;
            const limit = req.query.limit ? Number(req.query.limit) : 50;
            const offset = req.query.offset ? Number(req.query.offset) : 0;

            if (!userId) {
                return res.status(400).json({
                    error: 'userId é obrigatório'
                });
            }

            const { data, count } = await this.auditLogService.findByUserId(userId, limit, offset);

            return res.status(200).json({
                data,
                count,
                limit,
                offset
            });
        } catch (error) {
            console.error('Erro no controller ao buscar logs do usuário:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }

    /**
     * GET /audit-logs/action/:action
     * Busca logs por ação
     */
    async findByAction(req: Request, res: Response): Promise<Response> {
        try {
            const action = req.params.action;
            const limit = req.query.limit ? Number(req.query.limit) : 50;
            const offset = req.query.offset ? Number(req.query.offset) : 0;

            if (!action) {
                return res.status(400).json({
                    error: 'action é obrigatório'
                });
            }

            const { data, count } = await this.auditLogService.findByAction(action, limit, offset);

            return res.status(200).json({
                data,
                count,
                limit,
                offset
            });
        } catch (error) {
            console.error('Erro no controller ao buscar logs por ação:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }

    /**
     * GET /audit-logs/table/:tableName
     * Busca logs por tabela afetada
     */
    async findByTable(req: Request, res: Response): Promise<Response> {
        try {
            const tableName = req.params.tableName;
            const limit = req.query.limit ? Number(req.query.limit) : 50;
            const offset = req.query.offset ? Number(req.query.offset) : 0;

            if (!tableName) {
                return res.status(400).json({
                    error: 'tableName é obrigatório'
                });
            }

            const { data, count } = await this.auditLogService.findByTable(tableName, limit, offset);

            return res.status(200).json({
                data,
                count,
                limit,
                offset
            });
        } catch (error) {
            console.error('Erro no controller ao buscar logs por tabela:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }

    /**
     * GET /audit-logs/record/:tableName/:recordId
     * Busca logs de um registro específico
     */
    async findByRecord(req: Request, res: Response): Promise<Response> {
        try {
            const tableName = req.params.tableName;
            const recordId = Number(req.params.recordId);
            const limit = req.query.limit ? Number(req.query.limit) : 50;
            const offset = req.query.offset ? Number(req.query.offset) : 0;

            if (!tableName) {
                return res.status(400).json({
                    error: 'tableName é obrigatório'
                });
            }

            if (isNaN(recordId)) {
                return res.status(400).json({
                    error: 'ID do registro inválido'
                });
            }

            const { data, count } = await this.auditLogService.findByRecord(tableName, recordId, limit, offset);

            return res.status(200).json({
                data,
                count,
                limit,
                offset
            });
        } catch (error) {
            console.error('Erro no controller ao buscar logs do registro:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }

    /**
     * GET /audit-logs/statistics
     * Obtém estatísticas de auditoria
     */
    async getStatistics(req: Request, res: Response): Promise<Response> {
        try {
            const startDate = req.query.start_date as string;
            const endDate = req.query.end_date as string;

            const stats = await this.auditLogService.getStatistics(startDate, endDate);

            if (!stats) {
                return res.status(500).json({
                    error: 'Erro ao obter estatísticas'
                });
            }

            return res.status(200).json(stats);
        } catch (error) {
            console.error('Erro no controller ao obter estatísticas:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }

    /**
     * DELETE /audit-logs/cleanup/:days
     * Deleta logs mais antigos que X dias (use com cuidado!)
     */
    async cleanup(req: Request, res: Response): Promise<Response> {
        try {
            const days = Number(req.params.days);

            if (isNaN(days) || days < 1) {
                return res.status(400).json({
                    error: 'Número de dias inválido (deve ser >= 1)'
                });
            }

            // Proteção: não permitir deletar logs com menos de 30 dias
            if (days < 30) {
                return res.status(400).json({
                    error: 'Por segurança, só é permitido deletar logs com mais de 30 dias'
                });
            }

            const deletedCount = await this.auditLogService.deleteOlderThan(days);

            return res.status(200).json({
                message: `${deletedCount} logs deletados com sucesso`,
                deletedCount
            });
        } catch (error) {
            console.error('Erro no controller ao fazer cleanup:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
}
