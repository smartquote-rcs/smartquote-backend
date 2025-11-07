"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailControllerExample = exports.RelatoriosControllerExample = exports.AuthControllerExample = exports.ProdutosControllerExample = exports.CotacoesControllerExample = void 0;
exports.errorMiddleware = errorMiddleware;
exports.accessDeniedMiddleware = accessDeniedMiddleware;
exports.exemploUsoDirecto = exemploUsoDirecto;
const AuditLogHelper_1 = require("../utils/AuditLogHelper");
/**
 * Exemplos práticos de como usar o AuditLogHelper nos seus controllers
 */
// ============================================
// Exemplo 1: Controller de Cotações
// ============================================
class CotacoesControllerExample {
    async create(req, res) {
        const userId = req.user.id; // Do authMiddleware
        const cotacaoData = req.body;
        try {
            // Criar cotação no banco
            const newCotacao = await this.createInDB(cotacaoData);
            // ✅ Registrar no audit log - FORMA SIMPLES
            await AuditLogHelper_1.auditLog.logCreate(userId, 'cotacoes', newCotacao.id, {
                descricao: cotacaoData.descricao,
                valor_total: cotacaoData.valor_total
            });
            return res.status(201).json(newCotacao);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async update(req, res) {
        const userId = req.user.id;
        const cotacaoId = Number(req.params.id);
        const updates = req.body;
        try {
            // Buscar dados antigos
            const oldData = await this.findById(cotacaoId);
            // Atualizar no banco
            const updatedCotacao = await this.updateInDB(cotacaoId, updates);
            // ✅ Registrar no audit log
            await AuditLogHelper_1.auditLog.logUpdate(userId, 'cotacoes', cotacaoId, oldData, updates);
            return res.status(200).json(updatedCotacao);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async delete(req, res) {
        const userId = req.user.id;
        const cotacaoId = Number(req.params.id);
        try {
            // Buscar dados antes de deletar
            const cotacao = await this.findById(cotacaoId);
            // Deletar do banco
            await this.deleteFromDB(cotacaoId);
            // ✅ Registrar no audit log
            await AuditLogHelper_1.auditLog.logDelete(userId, 'cotacoes', cotacaoId, {
                numero_itens: cotacao.itens?.length
            });
            return res.status(204).send();
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async updateStatus(req, res) {
        const userId = req.user.id;
        const cotacaoId = Number(req.params.id);
        const { status, motivo } = req.body;
        try {
            const oldCotacao = await this.findById(cotacaoId);
            await this.updateInDB(cotacaoId, { status });
            // ✅ Registrar mudança de status
            await AuditLogHelper_1.auditLog.logStatusChange(userId, 'cotacoes', cotacaoId, oldCotacao.status, status, motivo);
            return res.status(200).json({ status });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    // Métodos auxiliares (simulados)
    async createInDB(data) { return { id: 1, ...data }; }
    async findById(id) { return { id, status: 'pending', itens: [], descricao: 'Cotação teste' }; }
    async updateInDB(id, data) { return { id, ...data }; }
    async deleteFromDB(id) { return true; }
}
exports.CotacoesControllerExample = CotacoesControllerExample;
// ============================================
// Exemplo 2: Controller de Produtos
// ============================================
class ProdutosControllerExample {
    async bulkUpdatePrices(req, res) {
        const userId = req.user.id;
        const { percentual, produtos_ids } = req.body;
        try {
            // Atualizar preços em lote
            await this.updatePricesInDB(produtos_ids, percentual);
            // ✅ Registrar atualização em lote
            await AuditLogHelper_1.auditLog.logBulkUpdate(userId, 'produtos', produtos_ids.length, 'preco', { percentual_aumento: percentual });
            return res.status(200).json({
                message: `${produtos_ids.length} produtos atualizados`
            });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async import(req, res) {
        const userId = req.user.id;
        const produtos = req.body.produtos;
        try {
            // Importar produtos
            await this.importToDB(produtos);
            // ✅ Registrar importação
            await AuditLogHelper_1.auditLog.logImport(userId, 'produtos', produtos.length, 'CSV');
            return res.status(201).json({
                message: `${produtos.length} produtos importados`
            });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async updatePricesInDB(ids, percentual) { return true; }
    async importToDB(produtos) { return true; }
}
exports.ProdutosControllerExample = ProdutosControllerExample;
// ============================================
// Exemplo 3: Controller de Autenticação
// ============================================
class AuthControllerExample {
    async login(req, res) {
        const { email, password } = req.body;
        const ip = req.ip;
        const userAgent = req.get('user-agent');
        try {
            // Autenticar usuário
            const user = await this.authenticateUser(email, password);
            if (user) {
                // ✅ Registrar login bem-sucedido
                await AuditLogHelper_1.auditLog.logLogin(user.id, ip, userAgent, true);
                return res.status(200).json({ token: 'jwt-token', user });
            }
            else {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async logout(req, res) {
        const userId = req.user.id;
        try {
            // Invalidar token, etc.
            // ✅ Registrar logout
            await AuditLogHelper_1.auditLog.logLogout(userId);
            return res.status(200).json({ message: 'Logout realizado' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async changePassword(req, res) {
        const userId = req.user.id;
        const { old_password, new_password } = req.body;
        try {
            // Validar e alterar senha
            await this.updatePasswordInDB(userId, new_password);
            // ✅ Registrar mudança de senha
            await AuditLogHelper_1.auditLog.logPasswordChange(userId, 'manual');
            return res.status(200).json({ message: 'Senha alterada' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async authenticateUser(email, password) {
        return { id: 'user-uuid', email, nome: 'Usuário Teste' };
    }
    async updatePasswordInDB(userId, password) { return true; }
}
exports.AuthControllerExample = AuthControllerExample;
// ============================================
// Exemplo 4: Controller de Relatórios
// ============================================
class RelatoriosControllerExample {
    async exportToExcel(req, res) {
        const userId = req.user.id;
        const { tipo_relatorio, filtros } = req.body;
        try {
            // Gerar relatório
            const dados = await this.generateReport(tipo_relatorio, filtros);
            const filePath = await this.saveToExcel(dados);
            // ✅ Registrar exportação
            await AuditLogHelper_1.auditLog.logExport(userId, tipo_relatorio, 'XLSX', dados.length);
            return res.download(filePath);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async generateReport(tipo, filtros) { return []; }
    async saveToExcel(dados) { return '/tmp/relatorio.xlsx'; }
}
exports.RelatoriosControllerExample = RelatoriosControllerExample;
// ============================================
// Exemplo 5: Controller de Emails
// ============================================
class EmailControllerExample {
    async sendEmail(req, res) {
        const userId = req.user.id;
        const { to, subject, body } = req.body;
        try {
            // Enviar email
            const success = await this.sendEmailService(to, subject, body);
            // ✅ Registrar envio de email
            await AuditLogHelper_1.auditLog.logEmailSent(userId, to, subject, success);
            if (success) {
                return res.status(200).json({ message: 'Email enviado' });
            }
            else {
                return res.status(500).json({ error: 'Falha ao enviar email' });
            }
        }
        catch (error) {
            // ✅ Registrar erro
            await AuditLogHelper_1.auditLog.logError(userId, 'EMAIL_ERROR', error.message, error.stack);
            return res.status(500).json({ error: error.message });
        }
    }
    async sendEmailService(to, subject, body) {
        return true;
    }
}
exports.EmailControllerExample = EmailControllerExample;
// ============================================
// Exemplo 6: Middleware de Erro Global
// ============================================
function errorMiddleware(err, req, res, next) {
    const userId = req.user?.id || 'system';
    // ✅ Registrar erro no audit log
    AuditLogHelper_1.auditLog.logError(userId, err.name || 'UNHANDLED_ERROR', err.message, err.stack).catch(console.error);
    return res.status(500).json({
        error: 'Erro interno do servidor',
        message: err.message
    });
}
// ============================================
// Exemplo 7: Middleware de Acesso Negado
// ============================================
function accessDeniedMiddleware(resource) {
    return async (req, res, next) => {
        const userId = req.user?.id;
        const hasPermission = await checkPermission(userId, resource);
        if (!hasPermission) {
            // ✅ Registrar acesso negado
            await AuditLogHelper_1.auditLog.logAccessDenied(userId, resource, 'Usuário sem permissão');
            return res.status(403).json({
                error: 'Acesso negado',
                resource
            });
        }
        next();
    };
}
async function checkPermission(userId, resource) {
    // Implementar verificação de permissão
    return true;
}
// ============================================
// Exemplo 8: Uso Direto (Sem Controller)
// ============================================
async function exemploUsoDirecto() {
    const userId = 'user-uuid-123';
    // Criar
    await AuditLogHelper_1.auditLog.logCreate(userId, 'produtos', 456, {
        nome: 'Produto Novo',
        preco: 99.90
    });
    // Atualizar
    await AuditLogHelper_1.auditLog.logUpdate(userId, 'produtos', 456, { preco: 99.90 }, { preco: 89.90 });
    // Deletar
    await AuditLogHelper_1.auditLog.logDelete(userId, 'produtos', 456);
    // Login
    await AuditLogHelper_1.auditLog.logLogin(userId, '192.168.1.1', 'Mozilla/5.0', true);
    // Export
    await AuditLogHelper_1.auditLog.logExport(userId, 'cotacoes_mensais', 'PDF', 100);
    // Status Change
    await AuditLogHelper_1.auditLog.logStatusChange(userId, 'cotacoes', 123, 'pending', 'approved', 'Aprovado após análise');
    // Bulk Update
    await AuditLogHelper_1.auditLog.logBulkUpdate(userId, 'produtos', 50, 'preco', {
        percentual: 10
    });
    // Custom log
    await AuditLogHelper_1.auditLog.log(userId, 'CUSTOM_ACTION', 'tabela_custom', 789, { custom_field: 'custom_value' });
}
//# sourceMappingURL=ExemploAuditLogHelper.js.map