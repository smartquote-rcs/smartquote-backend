/**
 * Helper para facilitar o registro de logs de auditoria
 * Use este helper em seus controllers para registrar ações de forma simples
 */
export declare class AuditLogHelper {
    private static auditLogService;
    /**
     * Registra uma ação de auditoria
     * @param userId - UUID do usuário que executou a ação
     * @param action - Tipo de ação (ex: 'CREATE_QUOTE')
     * @param tableName - Nome da tabela afetada (opcional)
     * @param recordId - ID do registro afetado (opcional)
     * @param details - Detalhes adicionais da ação (opcional)
     */
    static log(userId: string, action: string, tableName?: string, recordId?: number | bigint, details?: Record<string, any>): Promise<void>;
    /**
     * Registra criação de registro
     */
    static logCreate(userId: string, tableName: string, recordId: number | bigint, data?: Record<string, any>): Promise<void>;
    /**
     * Registra atualização de registro
     */
    static logUpdate(userId: string, tableName: string, recordId: number | bigint, oldData?: Record<string, any>, newData?: Record<string, any>): Promise<void>;
    /**
     * Registra exclusão de registro
     */
    static logDelete(userId: string, tableName: string, recordId: number | bigint, data?: Record<string, any>): Promise<void>;
    /**
     * Registra login de usuário
     */
    static logLogin(userId: string, ip?: string, userAgent?: string, success?: boolean): Promise<void>;
    /**
     * Registra logout de usuário
     */
    static logLogout(userId: string, ip?: string, userAgent?: string): Promise<void>;
    /**
     * Registra mudança de senha
     */
    static logPasswordChange(userId: string, method?: 'manual' | 'reset' | 'forced'): Promise<void>;
    /**
     * Registra exportação de relatório
     */
    static logExport(userId: string, reportType: string, format: string, recordCount?: number): Promise<void>;
    /**
     * Registra envio de email
     */
    static logEmailSent(userId: string, to: string, subject: string, success?: boolean): Promise<void>;
    /**
     * Registra atualização em lote
     */
    static logBulkUpdate(userId: string, tableName: string, recordCount: number, field?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Registra exclusão em lote
     */
    static logBulkDelete(userId: string, tableName: string, recordCount: number, reason?: string): Promise<void>;
    /**
     * Registra mudança de status
     */
    static logStatusChange(userId: string, tableName: string, recordId: number | bigint, oldStatus: string, newStatus: string, reason?: string): Promise<void>;
    /**
     * Registra importação de dados
     */
    static logImport(userId: string, tableName: string, recordCount: number, source?: string): Promise<void>;
    /**
     * Registra tentativa de acesso negado
     */
    static logAccessDenied(userId: string, resource: string, reason?: string): Promise<void>;
    /**
     * Registra erro do sistema
     */
    static logError(userId: string, errorType: string, errorMessage: string, stackTrace?: string): Promise<void>;
}
export declare const auditLog: typeof AuditLogHelper;
//# sourceMappingURL=AuditLogHelper.d.ts.map