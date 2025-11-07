import { Request, Response } from 'express';
import { auditLog } from '../utils/AuditLogHelper';

/**
 * Exemplos práticos de como usar o AuditLogHelper nos seus controllers
 */

// ============================================
// Exemplo 1: Controller de Cotações
// ============================================
export class CotacoesControllerExample {
    
    async create(req: Request, res: Response) {
        const userId = (req as any).user.id; // Do authMiddleware
        const cotacaoData = req.body;
        
        try {
            // Criar cotação no banco
            const newCotacao = await this.createInDB(cotacaoData);
            
            // ✅ Registrar no audit log - FORMA SIMPLES
            await auditLog.logCreate(userId, 'cotacoes', newCotacao.id, {
                descricao: cotacaoData.descricao,
                valor_total: cotacaoData.valor_total
            });
            
            return res.status(201).json(newCotacao);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
    
    async update(req: Request, res: Response) {
        const userId = (req as any).user.id;
        const cotacaoId = Number(req.params.id);
        const updates = req.body;
        
        try {
            // Buscar dados antigos
            const oldData = await this.findById(cotacaoId);
            
            // Atualizar no banco
            const updatedCotacao = await this.updateInDB(cotacaoId, updates);
            
            // ✅ Registrar no audit log
            await auditLog.logUpdate(
                userId,
                'cotacoes',
                cotacaoId,
                oldData,
                updates
            );
            
            return res.status(200).json(updatedCotacao);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
    
    async delete(req: Request, res: Response) {
        const userId = (req as any).user.id;
        const cotacaoId = Number(req.params.id);
        
        try {
            // Buscar dados antes de deletar
            const cotacao = await this.findById(cotacaoId);
            
            // Deletar do banco
            await this.deleteFromDB(cotacaoId);
            
            // ✅ Registrar no audit log
            await auditLog.logDelete(userId, 'cotacoes', cotacaoId, {
                numero_itens: cotacao.itens?.length
            });
            
            return res.status(204).send();
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
    
    async updateStatus(req: Request, res: Response) {
        const userId = (req as any).user.id;
        const cotacaoId = Number(req.params.id);
        const { status, motivo } = req.body;
        
        try {
            const oldCotacao = await this.findById(cotacaoId);
            await this.updateInDB(cotacaoId, { status });
            
            // ✅ Registrar mudança de status
            await auditLog.logStatusChange(
                userId,
                'cotacoes',
                cotacaoId,
                oldCotacao.status,
                status,
                motivo
            );
            
            return res.status(200).json({ status });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
    
    // Métodos auxiliares (simulados)
    private async createInDB(data: any) { return { id: 1, ...data }; }
    private async findById(id: number) { return { id, status: 'pending', itens: [], descricao: 'Cotação teste' }; }
    private async updateInDB(id: number, data: any) { return { id, ...data }; }
    private async deleteFromDB(id: number) { return true; }
}

// ============================================
// Exemplo 2: Controller de Produtos
// ============================================
export class ProdutosControllerExample {
    
    async bulkUpdatePrices(req: Request, res: Response) {
        const userId = (req as any).user.id;
        const { percentual, produtos_ids } = req.body;
        
        try {
            // Atualizar preços em lote
            await this.updatePricesInDB(produtos_ids, percentual);
            
            // ✅ Registrar atualização em lote
            await auditLog.logBulkUpdate(
                userId,
                'produtos',
                produtos_ids.length,
                'preco',
                { percentual_aumento: percentual }
            );
            
            return res.status(200).json({ 
                message: `${produtos_ids.length} produtos atualizados` 
            });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
    
    async import(req: Request, res: Response) {
        const userId = (req as any).user.id;
        const produtos = req.body.produtos;
        
        try {
            // Importar produtos
            await this.importToDB(produtos);
            
            // ✅ Registrar importação
            await auditLog.logImport(
                userId,
                'produtos',
                produtos.length,
                'CSV'
            );
            
            return res.status(201).json({ 
                message: `${produtos.length} produtos importados` 
            });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
    
    private async updatePricesInDB(ids: number[], percentual: number) { return true; }
    private async importToDB(produtos: any[]) { return true; }
}

// ============================================
// Exemplo 3: Controller de Autenticação
// ============================================
export class AuthControllerExample {
    
    async login(req: Request, res: Response) {
        const { email, password } = req.body;
        const ip = req.ip;
        const userAgent = req.get('user-agent');
        
        try {
            // Autenticar usuário
            const user = await this.authenticateUser(email, password);
            
            if (user) {
                // ✅ Registrar login bem-sucedido
                await auditLog.logLogin(user.id, ip, userAgent, true);
                
                return res.status(200).json({ token: 'jwt-token', user });
            } else {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
    
    async logout(req: Request, res: Response) {
        const userId = (req as any).user.id;
        
        try {
            // Invalidar token, etc.
            
            // ✅ Registrar logout
            await auditLog.logLogout(userId);
            
            return res.status(200).json({ message: 'Logout realizado' });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
    
    async changePassword(req: Request, res: Response) {
        const userId = (req as any).user.id;
        const { old_password, new_password } = req.body;
        
        try {
            // Validar e alterar senha
            await this.updatePasswordInDB(userId, new_password);
            
            // ✅ Registrar mudança de senha
            await auditLog.logPasswordChange(userId, 'manual');
            
            return res.status(200).json({ message: 'Senha alterada' });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
    
    private async authenticateUser(email: string, password: string) {
        return { id: 'user-uuid', email, nome: 'Usuário Teste' };
    }
    private async updatePasswordInDB(userId: string, password: string) { return true; }
}

// ============================================
// Exemplo 4: Controller de Relatórios
// ============================================
export class RelatoriosControllerExample {
    
    async exportToExcel(req: Request, res: Response) {
        const userId = (req as any).user.id;
        const { tipo_relatorio, filtros } = req.body;
        
        try {
            // Gerar relatório
            const dados = await this.generateReport(tipo_relatorio, filtros);
            const filePath = await this.saveToExcel(dados);
            
            // ✅ Registrar exportação
            await auditLog.logExport(
                userId,
                tipo_relatorio,
                'XLSX',
                dados.length
            );
            
            return res.download(filePath);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
    
    private async generateReport(tipo: string, filtros: any) { return []; }
    private async saveToExcel(dados: any[]) { return '/tmp/relatorio.xlsx'; }
}

// ============================================
// Exemplo 5: Controller de Emails
// ============================================
export class EmailControllerExample {
    
    async sendEmail(req: Request, res: Response) {
        const userId = (req as any).user.id;
        const { to, subject, body } = req.body;
        
        try {
            // Enviar email
            const success = await this.sendEmailService(to, subject, body);
            
            // ✅ Registrar envio de email
            await auditLog.logEmailSent(userId, to, subject, success);
            
            if (success) {
                return res.status(200).json({ message: 'Email enviado' });
            } else {
                return res.status(500).json({ error: 'Falha ao enviar email' });
            }
        } catch (error: any) {
            // ✅ Registrar erro
            await auditLog.logError(
                userId,
                'EMAIL_ERROR',
                error.message,
                error.stack
            );
            
            return res.status(500).json({ error: error.message });
        }
    }
    
    private async sendEmailService(to: string, subject: string, body: string) {
        return true;
    }
}

// ============================================
// Exemplo 6: Middleware de Erro Global
// ============================================
export function errorMiddleware(err: any, req: Request, res: Response, next: any) {
    const userId = (req as any).user?.id || 'system';
    
    // ✅ Registrar erro no audit log
    auditLog.logError(
        userId,
        err.name || 'UNHANDLED_ERROR',
        err.message,
        err.stack
    ).catch(console.error);
    
    return res.status(500).json({
        error: 'Erro interno do servidor',
        message: err.message
    });
}

// ============================================
// Exemplo 7: Middleware de Acesso Negado
// ============================================
export function accessDeniedMiddleware(resource: string) {
    return async (req: Request, res: Response, next: any) => {
        const userId = (req as any).user?.id;
        const hasPermission = await checkPermission(userId, resource);
        
        if (!hasPermission) {
            // ✅ Registrar acesso negado
            await auditLog.logAccessDenied(
                userId,
                resource,
                'Usuário sem permissão'
            );
            
            return res.status(403).json({ 
                error: 'Acesso negado',
                resource 
            });
        }
        
        next();
    };
}

async function checkPermission(userId: string, resource: string): Promise<boolean> {
    // Implementar verificação de permissão
    return true;
}

// ============================================
// Exemplo 8: Uso Direto (Sem Controller)
// ============================================
export async function exemploUsoDirecto() {
    const userId = 'user-uuid-123';
    
    // Criar
    await auditLog.logCreate(userId, 'produtos', 456, {
        nome: 'Produto Novo',
        preco: 99.90
    });
    
    // Atualizar
    await auditLog.logUpdate(
        userId,
        'produtos',
        456,
        { preco: 99.90 },
        { preco: 89.90 }
    );
    
    // Deletar
    await auditLog.logDelete(userId, 'produtos', 456);
    
    // Login
    await auditLog.logLogin(userId, '192.168.1.1', 'Mozilla/5.0', true);
    
    // Export
    await auditLog.logExport(userId, 'cotacoes_mensais', 'PDF', 100);
    
    // Status Change
    await auditLog.logStatusChange(
        userId,
        'cotacoes',
        123,
        'pending',
        'approved',
        'Aprovado após análise'
    );
    
    // Bulk Update
    await auditLog.logBulkUpdate(userId, 'produtos', 50, 'preco', {
        percentual: 10
    });
    
    // Custom log
    await auditLog.log(
        userId,
        'CUSTOM_ACTION',
        'tabela_custom',
        789,
        { custom_field: 'custom_value' }
    );
}
