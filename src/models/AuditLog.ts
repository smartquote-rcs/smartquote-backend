export interface AuditLog {
    id?: bigint | number;
    user_id: string; // UUID do usuário
    action: string; // Ex: 'CREATE_QUOTE', 'UPDATE_PRODUCT', 'DELETE_SUPPLIER'
    tabela_afetada?: string; // Nome da tabela afetada
    registo_id?: bigint | number; // ID do registro afetado
    detalhes_alteracao?: Record<string, any>; // Detalhes em JSON
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
