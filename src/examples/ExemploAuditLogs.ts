import { AuditLogService } from '../services/AuditLogService';

/**
 * Exemplos de uso do sistema de Audit Logs
 */

const auditLogService = new AuditLogService();

// ============================================
// Exemplo 1: Registrar criação de cotação
// ============================================
export async function exemploCreateQuote() {
    const userId = 'user-uuid-here';
    const quoteId = 123;
    
    await auditLogService.create({
        user_id: userId,
        action: 'CREATE_QUOTE',
        tabela_afetada: 'cotacoes',
        registo_id: quoteId,
        detalhes_alteracao: {
            descricao: 'Nova cotação criada',
            numero_itens: 5,
            valor_total: 15000.00,
            fornecedor_id: 10
        }
    });
    
    console.log('✅ Log de criação de cotação registrado');
}

// ============================================
// Exemplo 2: Registrar atualização de produto
// ============================================
export async function exemploUpdateProduct() {
    const userId = 'user-uuid-here';
    const productId = 456;
    
    await auditLogService.create({
        user_id: userId,
        action: 'UPDATE_PRODUCT',
        tabela_afetada: 'produtos',
        registo_id: productId,
        detalhes_alteracao: {
            campos_alterados: ['preco', 'estoque'],
            valores_anteriores: {
                preco: 100.00,
                estoque: 50
            },
            valores_novos: {
                preco: 120.00,
                estoque: 45
            }
        }
    });
    
    console.log('✅ Log de atualização de produto registrado');
}

// ============================================
// Exemplo 3: Registrar exclusão de fornecedor
// ============================================
export async function exemploDeleteSupplier() {
    const userId = 'user-uuid-here';
    const supplierId = 789;
    
    await auditLogService.create({
        user_id: userId,
        action: 'DELETE_SUPPLIER',
        tabela_afetada: 'fornecedores',
        registo_id: supplierId,
        detalhes_alteracao: {
            motivo: 'Fornecedor inativo há mais de 12 meses',
            nome_fornecedor: 'Fornecedor XYZ Ltda',
            cnpj: '12.345.678/0001-90'
        }
    });
    
    console.log('✅ Log de exclusão de fornecedor registrado');
}

// ============================================
// Exemplo 4: Registrar login de usuário
// ============================================
export async function exemploUserLogin() {
    const userId = 'user-uuid-here';
    
    await auditLogService.create({
        user_id: userId,
        action: 'USER_LOGIN',
        detalhes_alteracao: {
            ip: '192.168.1.100',
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
            sucesso: true,
            metodo: 'email_password'
        }
    });
    
    console.log('✅ Log de login registrado');
}

// ============================================
// Exemplo 5: Registrar mudança de status
// ============================================
export async function exemploStatusChange() {
    const userId = 'user-uuid-here';
    const quoteId = 123;
    
    await auditLogService.create({
        user_id: userId,
        action: 'STATUS_CHANGE',
        tabela_afetada: 'cotacoes',
        registo_id: quoteId,
        detalhes_alteracao: {
            campo: 'status',
            de: 'pending',
            para: 'approved',
            motivo: 'Aprovado após análise financeira',
            aprovador_nome: 'João Silva'
        }
    });
    
    console.log('✅ Log de mudança de status registrado');
}

// ============================================
// Exemplo 6: Consultar logs de um usuário
// ============================================
export async function exemploConsultarLogsPorUsuario() {
    const userId = 'user-uuid-here';
    
    const { data, count } = await auditLogService.findByUserId(userId, 20, 0);
    
    console.log(`📊 Encontrados ${count} logs do usuário`);
    console.log('Últimos 20 logs:', data);
}

// ============================================
// Exemplo 7: Consultar logs por ação
// ============================================
export async function exemploConsultarLogsPorAcao() {
    const { data, count } = await auditLogService.findByAction('CREATE_QUOTE', 50, 0);
    
    console.log(`📊 Encontrados ${count} logs de criação de cotação`);
    console.log('Logs:', data);
}

// ============================================
// Exemplo 8: Consultar histórico de um registro
// ============================================
export async function exemploHistoricoRegistro() {
    const { data, count } = await auditLogService.findByRecord('cotacoes', 123, 100, 0);
    
    console.log(`📊 Encontrados ${count} logs para a cotação #123`);
    console.log('Histórico completo:', data);
}

// ============================================
// Exemplo 9: Consultar logs com filtros avançados
// ============================================
export async function exemploFiltrosAvancados() {
    const { data, count } = await auditLogService.findAll({
        user_id: 'user-uuid-here',
        action: 'UPDATE_PRODUCT',
        tabela_afetada: 'produtos',
        start_date: '2025-01-01T00:00:00Z',
        end_date: '2025-12-31T23:59:59Z',
        limit: 100,
        offset: 0
    });
    
    console.log(`📊 Encontrados ${count} logs com os filtros aplicados`);
    console.log('Logs:', data);
}

// ============================================
// Exemplo 10: Obter estatísticas
// ============================================
export async function exemploEstatisticas() {
    const stats = await auditLogService.getStatistics(
        '2025-01-01T00:00:00Z',
        '2025-12-31T23:59:59Z'
    );
    
    console.log('📈 Estatísticas de auditoria:');
    console.log('Total de ações:', stats.total);
    console.log('Por ação:', stats.byAction);
    console.log('Por tabela:', stats.byTable);
    console.log('Por usuário:', stats.byUser);
    console.log('Por data:', stats.byDate);
}

// ============================================
// Exemplo 11: Função helper para uso em controllers
// ============================================
export async function logAction(
    userId: string,
    action: string,
    tableName?: string,
    recordId?: number,
    details?: Record<string, any>
) {
    try {
        await auditLogService.create({
            user_id: userId,
            action,
            tabela_afetada: tableName,
            registo_id: recordId,
            detalhes_alteracao: details || {}
        });
    } catch (error) {
        console.error('Erro ao registrar log de auditoria:', error);
        // Não lançar erro para não interromper o fluxo principal
    }
}

// ============================================
// Exemplo de integração em um controller
// ============================================
export class ExemploIntegracaoController {
    async createQuote(req: any, res: any) {
        const userId = req.user.id; // Do authMiddleware
        const quoteData = req.body;
        
        try {
            // 1. Criar a cotação
            const newQuote = await this.createQuoteInDB(quoteData);
            
            // 2. Registrar no audit log
            await logAction(
                userId,
                'CREATE_QUOTE',
                'cotacoes',
                newQuote.id,
                {
                    descricao: quoteData.descricao,
                    numero_itens: quoteData.itens?.length || 0,
                    valor_estimado: quoteData.valor_estimado
                }
            );
            
            // 3. Retornar resposta
            return res.status(201).json(newQuote);
        } catch (error) {
            console.error('Erro ao criar cotação:', error);
            return res.status(500).json({ error: 'Erro ao criar cotação' });
        }
    }
    
    async updateQuote(req: any, res: any) {
        const userId = req.user.id;
        const quoteId = req.params.id;
        const updates = req.body;
        
        try {
            // 1. Buscar dados antigos
            const oldQuote = await this.getQuoteById(quoteId);
            
            // 2. Atualizar a cotação
            const updatedQuote = await this.updateQuoteInDB(quoteId, updates);
            
            // 3. Registrar no audit log
            await logAction(
                userId,
                'UPDATE_QUOTE',
                'cotacoes',
                quoteId,
                {
                    campos_alterados: Object.keys(updates),
                    valores_anteriores: oldQuote,
                    valores_novos: updatedQuote
                }
            );
            
            // 4. Retornar resposta
            return res.status(200).json(updatedQuote);
        } catch (error) {
            console.error('Erro ao atualizar cotação:', error);
            return res.status(500).json({ error: 'Erro ao atualizar cotação' });
        }
    }
    
    // Métodos auxiliares (simulados)
    private async createQuoteInDB(data: any): Promise<any> {
        return { id: 123, ...data };
    }
    
    private async getQuoteById(id: number): Promise<any> {
        return { id, status: 'pending' };
    }
    
    private async updateQuoteInDB(id: number, data: any): Promise<any> {
        return { id, ...data };
    }
}

// ============================================
// Executar exemplos (descomentar para testar)
// ============================================
/*
async function runExamples() {
    console.log('🚀 Executando exemplos de Audit Logs...\n');
    
    await exemploCreateQuote();
    await exemploUpdateProduct();
    await exemploDeleteSupplier();
    await exemploUserLogin();
    await exemploStatusChange();
    await exemploConsultarLogsPorUsuario();
    await exemploConsultarLogsPorAcao();
    await exemploHistoricoRegistro();
    await exemploFiltrosAvancados();
    await exemploEstatisticas();
    
    console.log('\n✅ Todos os exemplos executados com sucesso!');
}

runExamples();
*/
