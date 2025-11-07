export interface AuditLog {
    id?: bigint | number;
    user_id: string;
    action: string;
    tabela_afetada?: string;
    registo_id?: bigint | number;
    detalhes_alteracao?: Record<string, any>;
    created_at?: string | Date;
}
export interface CreateAuditLogDTO {
    user_id: string;
    action: string;
    tabela_afetada?: string;
    registo_id?: bigint | number;
    detalhes_alteracao?: Record<string, any>;
}
export interface AuditLogFilter {
    user_id?: string;
    action?: string;
    tabela_afetada?: string;
    registo_id?: bigint | number;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
}
//# sourceMappingURL=AuditLog.d.ts.map