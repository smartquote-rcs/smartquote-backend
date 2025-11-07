import { Request, Response } from 'express';
export declare class AuditLogController {
    private auditLogService;
    constructor();
    /**
     * POST /audit-logs
     * Cria um novo log de auditoria
     */
    create(req: Request, res: Response): Promise<Response>;
    /**
     * GET /audit-logs
     * Lista logs de auditoria com filtros
     */
    findAll(req: Request, res: Response): Promise<Response>;
    /**
     * GET /audit-logs/:id
     * Busca um log específico por ID
     */
    findById(req: Request, res: Response): Promise<Response>;
    /**
     * GET /audit-logs/user/:userId
     * Busca logs de um usuário específico
     */
    findByUserId(req: Request, res: Response): Promise<Response>;
    /**
     * GET /audit-logs/action/:action
     * Busca logs por ação
     */
    findByAction(req: Request, res: Response): Promise<Response>;
    /**
     * GET /audit-logs/table/:tableName
     * Busca logs por tabela afetada
     */
    findByTable(req: Request, res: Response): Promise<Response>;
    /**
     * GET /audit-logs/record/:tableName/:recordId
     * Busca logs de um registro específico
     */
    findByRecord(req: Request, res: Response): Promise<Response>;
    /**
     * GET /audit-logs/statistics
     * Obtém estatísticas de auditoria
     */
    getStatistics(req: Request, res: Response): Promise<Response>;
    /**
     * DELETE /audit-logs/cleanup/:days
     * Deleta logs mais antigos que X dias (use com cuidado!)
     */
    cleanup(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=AuditLogController.d.ts.map