import { AuditLog, CreateAuditLogDTO, AuditLogFilter } from '../models/AuditLog';
export declare class AuditLogService {
    /**
     * Cria um novo registro de auditoria
     */
    create(data: CreateAuditLogDTO): Promise<AuditLog | null>;
    /**
     * Busca logs de auditoria com filtros
     */
    findAll(filters?: AuditLogFilter): Promise<{
        data: AuditLog[];
        count: number;
    }>;
    /**
     * Busca um log de auditoria por ID
     */
    findById(id: number): Promise<AuditLog | null>;
    /**
     * Busca logs de auditoria de um usuário específico
     */
    findByUserId(userId: string, limit?: number, offset?: number): Promise<{
        data: AuditLog[];
        count: number;
    }>;
    /**
     * Busca logs de auditoria por ação
     */
    findByAction(action: string, limit?: number, offset?: number): Promise<{
        data: AuditLog[];
        count: number;
    }>;
    /**
     * Busca logs de auditoria por tabela afetada
     */
    findByTable(tableName: string, limit?: number, offset?: number): Promise<{
        data: AuditLog[];
        count: number;
    }>;
    /**
     * Busca logs de auditoria por registro específico
     */
    findByRecord(tableName: string, recordId: number, limit?: number, offset?: number): Promise<{
        data: AuditLog[];
        count: number;
    }>;
    /**
     * Deleta logs de auditoria antigos (opcional - use com cuidado!)
     */
    deleteOlderThan(days: number): Promise<number>;
    /**
     * Obtém estatísticas de auditoria
     */
    getStatistics(startDate?: string, endDate?: string): Promise<any>;
}
//# sourceMappingURL=AuditLogService.d.ts.map