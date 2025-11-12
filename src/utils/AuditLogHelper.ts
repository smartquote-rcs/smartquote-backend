import { AuditLogService } from '../services/AuditLogService';
import { CreateAuditLogDTO } from '../models/AuditLog';

/**
 * Helper para facilitar o registro de logs de auditoria
 * Use este helper em seus controllers para registrar ações de forma simples
 */
export class AuditLogHelper {
    private static auditLogService = new AuditLogService();

    /**
     * Registra uma ação de auditoria
     * @param userId - UUID do usuário que executou a ação
     * @param action - Tipo de ação (ex: 'CREATE_QUOTE')
     * @param tableName - Nome da tabela afetada (opcional)
     * @param recordId - ID do registro afetado (opcional)
     * @param details - Detalhes adicionais da ação (opcional)
     */
    static async log(
        userId: string,
        action: string,
        tableName?: string,
        recordId?: number | bigint,
        details?: Record<string, any>
    ): Promise<void> {
        try {
            await this.auditLogService.create({
                user_id: userId,
                action,
                tabela_afetada: tableName,
                registo_id: recordId,
                detalhes_alteracao: details || {}
            });
        } catch (error) {
            console.error('Erro ao registrar audit log:', error);
            // Não lançar erro para não interromper o fluxo principal
        }
    }

    /**
     * Registra criação de registro
     */
    static async logCreate(
        userId: string,
        tableName: string,
        recordId: number | bigint,
        data?: Record<string, any>
    ): Promise<void> {
        const action = `CREATE_${tableName.toUpperCase().slice(0, -1)}`; // Remove 's' final
        await this.log(userId, action, tableName, recordId, data);
    }

    /**
     * Registra atualização de registro
     */
    static async logUpdate(
        userId: string,
        tableName: string,
        recordId: number | bigint,
        oldData?: Record<string, any>,
        newData?: Record<string, any>
    ): Promise<void> {
        const action = `UPDATE_${tableName.toUpperCase().slice(0, -1)}`;
        await this.log(userId, action, tableName, recordId, {
            valores_anteriores: oldData,
            valores_novos: newData,
            campos_alterados: newData ? Object.keys(newData) : []
        });
    }

    /**
     * Registra exclusão de registro
     */
    static async logDelete(
        userId: string,
        tableName: string,
        recordId: number | bigint,
        data?: Record<string, any>
    ): Promise<void> {
        const action = `DELETE_${tableName.toUpperCase().slice(0, -1)}`;
        await this.log(userId, action, tableName, recordId, {
            dados_deletados: data
        });
    }

    /**
     * Registra login de usuário
     */
    static async logLogin(
        userId: string,
        ip?: string,
        userAgent?: string,
        success: boolean = true,
        userName?: string,
        userEmail?: string,
        userRole?: string
    ): Promise<void> {
        await this.log(userId, 'USER_LOGIN', undefined, undefined, {
            ip,
            user_agent: userAgent,
            sucesso: success,
            timestamp: new Date().toISOString(),
            userName,
            userEmail,
            role: userRole
        });
    }

    /**
     * Registra logout de usuário
     */
    static async logLogout(
        userId: string,
        userName?: string,
        userEmail?: string,
        userRole?: string,
        ip?: string,
        userAgent?: string
    ): Promise<void> {
        await this.log(userId, 'USER_LOGOUT', undefined, undefined, {
            timestamp: new Date().toISOString(),
            userName,
            userEmail,
            role: userRole,
            ip,
            user_agent: userAgent
        });
    }

    /**
     * Registra mudança de senha
     */
    static async logPasswordChange(
        userId: string,
        method: 'manual' | 'reset' | 'forced' = 'manual'
    ): Promise<void> {
        await this.log(userId, 'PASSWORD_CHANGE', undefined, undefined, {
            metodo: method,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Registra exportação de relatório
     */
    static async logExport(
        userId: string,
        reportType: string,
        format: string,
        recordCount?: number
    ): Promise<void> {
        await this.log(userId, 'EXPORT_REPORT', 'relatorios', undefined, {
            tipo_relatorio: reportType,
            formato: format,
            quantidade_registros: recordCount,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Registra envio de email
     */
    static async logEmailSent(
        userId: string,
        to: string,
        subject: string,
        success: boolean = true
    ): Promise<void> {
        await this.log(userId, 'SEND_EMAIL', undefined, undefined, {
            destinatario: to,
            assunto: subject,
            sucesso: success,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Registra atualização em lote
     */
    static async logBulkUpdate(
        userId: string,
        tableName: string,
        recordCount: number,
        field?: string,
        details?: Record<string, any>
    ): Promise<void> {
        await this.log(userId, 'BULK_UPDATE', tableName, undefined, {
            quantidade_registros: recordCount,
            campo_atualizado: field,
            ...details
        });
    }

    /**
     * Registra exclusão em lote
     */
    static async logBulkDelete(
        userId: string,
        tableName: string,
        recordCount: number,
        reason?: string
    ): Promise<void> {
        await this.log(userId, 'BULK_DELETE', tableName, undefined, {
            quantidade_registros: recordCount,
            motivo: reason
        });
    }

    /**
     * Registra mudança de status
     */
    static async logStatusChange(
        userId: string,
        tableName: string,
        recordId: number | bigint,
        oldStatus: string,
        newStatus: string,
        reason?: string
    ): Promise<void> {
        await this.log(userId, 'STATUS_CHANGE', tableName, recordId, {
            campo: 'status',
            de: oldStatus,
            para: newStatus,
            motivo: reason
        });
    }

    /**
     * Registra importação de dados
     */
    static async logImport(
        userId: string,
        tableName: string,
        recordCount: number,
        source?: string
    ): Promise<void> {
        await this.log(userId, 'IMPORT_DATA', tableName, undefined, {
            quantidade_registros: recordCount,
            origem: source,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Registra tentativa de acesso negado
     */
    static async logAccessDenied(
        userId: string,
        resource: string,
        reason?: string
    ): Promise<void> {
        await this.log(userId, 'ACCESS_DENIED', undefined, undefined, {
            recurso: resource,
            motivo: reason,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Registra erro do sistema
     */
    static async logError(
        userId: string,
        errorType: string,
        errorMessage: string,
        stackTrace?: string
    ): Promise<void> {
        await this.log(userId, 'SYSTEM_ERROR', undefined, undefined, {
            tipo_erro: errorType,
            mensagem: errorMessage,
            stack_trace: stackTrace?.substring(0, 500), // Limitar tamanho
            timestamp: new Date().toISOString()
        });
    }
}

// Exportar instância para uso direto
export const auditLog = AuditLogHelper;
