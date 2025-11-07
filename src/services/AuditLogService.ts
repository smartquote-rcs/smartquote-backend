import supabase from '../infra/supabase/connect';
import { AuditLog, CreateAuditLogDTO, AuditLogFilter } from '../models/AuditLog';

export class AuditLogService {
    /**
     * Cria um novo registro de auditoria
     */
    async create(data: CreateAuditLogDTO): Promise<AuditLog | null> {
        try {
            const { data: auditLog, error } = await supabase
                .from('audit_logs')
                .insert([{
                    user_id: data.user_id,
                    action: data.action,
                    tabela_afetada: data.tabela_afetada || null,
                    registo_id: data.registo_id || null,
                    detalhes_alteracao: data.detalhes_alteracao || {}
                }])
                .select()
                .single();

            if (error) {
                console.error('Erro ao criar log de auditoria:', error);
                return null;
            }

            return auditLog;
        } catch (error) {
            console.error('Erro ao criar log de auditoria:', error);
            return null;
        }
    }

    /**
     * Busca logs de auditoria com filtros
     */
    async findAll(filters: AuditLogFilter = {}): Promise<{ data: AuditLog[], count: number }> {
        try {
            let query = supabase
                .from('audit_logs')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });

            // Aplicar filtros
            if (filters.user_id) {
                query = query.eq('user_id', filters.user_id);
            }

            if (filters.action) {
                query = query.eq('action', filters.action);
            }

            if (filters.tabela_afetada) {
                query = query.eq('tabela_afetada', filters.tabela_afetada);
            }

            if (filters.registo_id) {
                query = query.eq('registo_id', filters.registo_id);
            }

            if (filters.start_date) {
                query = query.gte('created_at', filters.start_date);
            }

            if (filters.end_date) {
                query = query.lte('created_at', filters.end_date);
            }

            // Paginação
            const limit = filters.limit || 50;
            const offset = filters.offset || 0;
            query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) {
                console.error('Erro ao buscar logs de auditoria:', error);
                return { data: [], count: 0 };
            }

            return { data: data || [], count: count || 0 };
        } catch (error) {
            console.error('Erro ao buscar logs de auditoria:', error);
            return { data: [], count: 0 };
        }
    }

    /**
     * Busca um log de auditoria por ID
     */
    async findById(id: number): Promise<AuditLog | null> {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Erro ao buscar log de auditoria:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Erro ao buscar log de auditoria:', error);
            return null;
        }
    }

    /**
     * Busca logs de auditoria de um usuário específico
     */
    async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<{ data: AuditLog[], count: number }> {
        return this.findAll({ user_id: userId, limit, offset });
    }

    /**
     * Busca logs de auditoria por ação
     */
    async findByAction(action: string, limit: number = 50, offset: number = 0): Promise<{ data: AuditLog[], count: number }> {
        return this.findAll({ action, limit, offset });
    }

    /**
     * Busca logs de auditoria por tabela afetada
     */
    async findByTable(tableName: string, limit: number = 50, offset: number = 0): Promise<{ data: AuditLog[], count: number }> {
        return this.findAll({ tabela_afetada: tableName, limit, offset });
    }

    /**
     * Busca logs de auditoria por registro específico
     */
    async findByRecord(tableName: string, recordId: number, limit: number = 50, offset: number = 0): Promise<{ data: AuditLog[], count: number }> {
        return this.findAll({ tabela_afetada: tableName, registo_id: recordId, limit, offset });
    }

    /**
     * Deleta logs de auditoria antigos (opcional - use com cuidado!)
     */
    async deleteOlderThan(days: number): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const { data, error } = await supabase
                .from('audit_logs')
                .delete()
                .lt('created_at', cutoffDate.toISOString())
                .select();

            if (error) {
                console.error('Erro ao deletar logs antigos:', error);
                return 0;
            }

            return data?.length || 0;
        } catch (error) {
            console.error('Erro ao deletar logs antigos:', error);
            return 0;
        }
    }

    /**
     * Obtém estatísticas de auditoria
     */
    async getStatistics(startDate?: string, endDate?: string): Promise<any> {
        try {
            let query = supabase
                .from('audit_logs')
                .select('action, tabela_afetada, user_id, created_at');

            if (startDate) {
                query = query.gte('created_at', startDate);
            }

            if (endDate) {
                query = query.lte('created_at', endDate);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Erro ao obter estatísticas:', error);
                return null;
            }

            // Processar estatísticas
            const stats = {
                total: data?.length || 0,
                byAction: {} as Record<string, number>,
                byTable: {} as Record<string, number>,
                byUser: {} as Record<string, number>,
                byDate: {} as Record<string, number>
            };

            data?.forEach((log: any) => {
                // Por ação
                stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

                // Por tabela
                if (log.tabela_afetada) {
                    stats.byTable[log.tabela_afetada] = (stats.byTable[log.tabela_afetada] || 0) + 1;
                }

                // Por usuário
                stats.byUser[log.user_id] = (stats.byUser[log.user_id] || 0) + 1;

                // Por data
                if (log.created_at) {
                    const dateStr = new Date(log.created_at).toISOString().split('T')[0];
                    if (dateStr) {
                        stats.byDate[dateStr] = (stats.byDate[dateStr] || 0) + 1;
                    }
                }
            });

            return stats;
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return null;
        }
    }
}
