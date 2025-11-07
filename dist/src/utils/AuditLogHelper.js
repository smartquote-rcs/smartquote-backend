"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = exports.AuditLogHelper = void 0;
const AuditLogService_1 = require("../services/AuditLogService");
/**
 * Helper para facilitar o registro de logs de auditoria
 * Use este helper em seus controllers para registrar ações de forma simples
 */
class AuditLogHelper {
    static auditLogService = new AuditLogService_1.AuditLogService();
    /**
     * Registra uma ação de auditoria
     * @param userId - UUID do usuário que executou a ação
     * @param action - Tipo de ação (ex: 'CREATE_QUOTE')
     * @param tableName - Nome da tabela afetada (opcional)
     * @param recordId - ID do registro afetado (opcional)
     * @param details - Detalhes adicionais da ação (opcional)
     */
    static async log(userId, action, tableName, recordId, details) {
        try {
            await this.auditLogService.create({
                user_id: userId,
                action,
                tabela_afetada: tableName,
                registo_id: recordId,
                detalhes_alteracao: details || {}
            });
        }
        catch (error) {
            console.error('Erro ao registrar audit log:', error);
            // Não lançar erro para não interromper o fluxo principal
        }
    }
    /**
     * Registra criação de registro
     */
    static async logCreate(userId, tableName, recordId, data) {
        const action = `CREATE_${tableName.toUpperCase().slice(0, -1)}`; // Remove 's' final
        await this.log(userId, action, tableName, recordId, data);
    }
    /**
     * Registra atualização de registro
     */
    static async logUpdate(userId, tableName, recordId, oldData, newData) {
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
    static async logDelete(userId, tableName, recordId, data) {
        const action = `DELETE_${tableName.toUpperCase().slice(0, -1)}`;
        await this.log(userId, action, tableName, recordId, {
            dados_deletados: data
        });
    }
    /**
     * Registra login de usuário
     */
    static async logLogin(userId, ip, userAgent, success = true) {
        await this.log(userId, 'USER_LOGIN', undefined, undefined, {
            ip,
            user_agent: userAgent,
            sucesso: success,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Registra logout de usuário
     */
    static async logLogout(userId) {
        await this.log(userId, 'USER_LOGOUT', undefined, undefined, {
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Registra mudança de senha
     */
    static async logPasswordChange(userId, method = 'manual') {
        await this.log(userId, 'PASSWORD_CHANGE', undefined, undefined, {
            metodo: method,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Registra exportação de relatório
     */
    static async logExport(userId, reportType, format, recordCount) {
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
    static async logEmailSent(userId, to, subject, success = true) {
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
    static async logBulkUpdate(userId, tableName, recordCount, field, details) {
        await this.log(userId, 'BULK_UPDATE', tableName, undefined, {
            quantidade_registros: recordCount,
            campo_atualizado: field,
            ...details
        });
    }
    /**
     * Registra exclusão em lote
     */
    static async logBulkDelete(userId, tableName, recordCount, reason) {
        await this.log(userId, 'BULK_DELETE', tableName, undefined, {
            quantidade_registros: recordCount,
            motivo: reason
        });
    }
    /**
     * Registra mudança de status
     */
    static async logStatusChange(userId, tableName, recordId, oldStatus, newStatus, reason) {
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
    static async logImport(userId, tableName, recordCount, source) {
        await this.log(userId, 'IMPORT_DATA', tableName, undefined, {
            quantidade_registros: recordCount,
            origem: source,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Registra tentativa de acesso negado
     */
    static async logAccessDenied(userId, resource, reason) {
        await this.log(userId, 'ACCESS_DENIED', undefined, undefined, {
            recurso: resource,
            motivo: reason,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Registra erro do sistema
     */
    static async logError(userId, errorType, errorMessage, stackTrace) {
        await this.log(userId, 'SYSTEM_ERROR', undefined, undefined, {
            tipo_erro: errorType,
            mensagem: errorMessage,
            stack_trace: stackTrace?.substring(0, 500), // Limitar tamanho
            timestamp: new Date().toISOString()
        });
    }
}
exports.AuditLogHelper = AuditLogHelper;
// Exportar instância para uso direto
exports.auditLog = AuditLogHelper;
//# sourceMappingURL=AuditLogHelper.js.map