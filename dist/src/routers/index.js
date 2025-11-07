"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = __importDefault(require("./auth.route"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const produtos_routes_1 = __importDefault(require("./produtos.routes"));
const fornecedores_routes_1 = __importDefault(require("./fornecedores.routes"));
const cotacoes_routes_1 = __importDefault(require("./cotacoes.routes"));
const users_route_1 = __importDefault(require("./users.route"));
const busca_routes_1 = __importDefault(require("./busca.routes"));
const test_routes_1 = __importDefault(require("./test.routes"));
const email_routes_1 = __importDefault(require("./email.routes"));
const gemini_routes_1 = __importDefault(require("./gemini.routes"));
const notifications_routes_1 = __importDefault(require("./notifications.routes"));
const dynamics_routes_1 = __importDefault(require("./dynamics.routes"));
const ProdutoService_1 = require("../services/ProdutoService");
const connect_1 = __importDefault(require("../infra/supabase/connect"));
const buscaLocal_routes_1 = __importDefault(require("./buscaLocal.routes"));
const prompts_routes_1 = __importDefault(require("./prompts.routes"));
const cotacoesItens_routes_1 = __importDefault(require("./cotacoesItens.routes"));
const relatorios_routes_1 = __importDefault(require("./relatorios.routes"));
const usersUpsert_routes_1 = __importDefault(require("./usersUpsert.routes"));
const sistema_routes_1 = __importDefault(require("./sistema.routes"));
const auditLogs_routes_1 = __importDefault(require("./auditLogs.routes"));
const routers = (0, express_1.Router)();
const produtosService = new ProdutoService_1.ProdutosService();
routers.get("/", (req, res) => {
    res.status(200).json("APi SmartQuote ON...");
});
routers.use("/test", test_routes_1.default);
routers.use("/auth", auth_route_1.default);
routers.use("/sistema", sistema_routes_1.default);
routers.use("/users", authMiddleware_1.authMiddleware, users_route_1.default);
routers.use('/produtos', authMiddleware_1.authMiddleware, produtos_routes_1.default);
routers.use('/fornecedores', fornecedores_routes_1.default);
routers.use('/suppliers', fornecedores_routes_1.default);
//routers.use('/cotacoes',authMiddleware, cotacoesRoutes);
routers.use('/cotacoes', cotacoes_routes_1.default);
routers.use('/cotacoes-itens', cotacoesItens_routes_1.default);
//routers.use('/busca-automatica',authMiddleware, buscaRouter);
routers.use('/busca-automatica', busca_routes_1.default);
routers.use('/email', email_routes_1.default);
routers.use('/gemini', gemini_routes_1.default);
routers.use('/busca-local', buscaLocal_routes_1.default);
routers.use('/busca', buscaLocal_routes_1.default); // Mantém ambas as rotas para compatibilidade
routers.use('/notifications', notifications_routes_1.default); // Removido authMiddleware temporariamente para testes
routers.use('/dynamics', dynamics_routes_1.default); // Remove authMiddleware para permitir testes diretos
routers.use('/prompts', prompts_routes_1.default);
routers.use('/relatorios', relatorios_routes_1.default);
routers.use('/users-public', usersUpsert_routes_1.default); // rota pública para upsert mínimo
routers.use('/audit-logs', authMiddleware_1.authMiddleware, auditLogs_routes_1.default); // Sistema de auditoria
// Rotas públicas RESTful para products (compatível com frontend)
// GET /api/products
routers.get('/products', async (req, res) => {
    try {
        const produtos = await produtosService.getAll();
        res.status(200).json({ data: produtos });
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        res.status(500).json({ error: errorMsg });
    }
});
// GET /api/products/:id
routers.get('/products/:id', async (req, res) => {
    try {
        const produto = await produtosService.getById(Number(req.params.id));
        if (!produto)
            return res.status(404).json({ error: 'Produto não encontrado' });
        res.status(200).json({ data: produto });
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        res.status(500).json({ error: errorMsg });
    }
});
// POST /api/products
routers.post('/products', async (req, res) => {
    try {
        const body = { ...req.body };
        // Normaliza campo fornecedorId -> fornecedor_id e remove a chave original
        if (body.fornecedorId && !body.fornecedor_id) {
            body.fornecedor_id = body.fornecedorId;
            delete body.fornecedorId; // evita erro: column "fornecedorId" does not exist
        }
        // Fallback de auditoria: se não veio ou veio inválido, usa 1 (admin padrão)
        if (!body.cadastrado_por || isNaN(Number(body.cadastrado_por)))
            body.cadastrado_por = 1;
        if (!body.atualizado_por || isNaN(Number(body.atualizado_por)))
            body.atualizado_por = body.cadastrado_por;
        console.log('🛠️ [POST /products] Payload normalizado:', body);
        const novo = await produtosService.create(body);
        res.status(201).json({ data: novo });
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        res.status(500).json({ error: errorMsg });
    }
});
// PATCH /api/products/:id
routers.patch('/products/:id', async (req, res) => {
    try {
        const updates = { ...req.body };
        if (updates.fornecedorId && !updates.fornecedor_id) {
            updates.fornecedor_id = updates.fornecedorId;
            delete updates.fornecedorId; // remove chave não existente na tabela
        }
        if (updates.cadastrado_por && isNaN(Number(updates.cadastrado_por)))
            delete updates.cadastrado_por; // não permitir inválido
        if (!updates.atualizado_por || isNaN(Number(updates.atualizado_por)))
            updates.atualizado_por = 1;
        const atualizado = await produtosService.updatePartial(Number(req.params.id), updates);
        res.status(200).json({ data: atualizado });
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        res.status(500).json({ error: errorMsg });
    }
});
// DELETE /api/products/:id
routers.delete('/products/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        console.log(`🗑️  [DELETE /products/${id}] Iniciando exclusão`);
        // Verifica existência para retornar 404 corretamente
        try {
            const existente = await produtosService.getById(id);
            if (!existente) {
                console.log(`⚠️  Produto ${id} não encontrado para exclusão`);
                return res.status(404).json({ error: 'Produto não encontrado' });
            }
        }
        catch (e) {
            // getById já lança se erro supabase real; continuar se simplesmente não encontrou
        }
        await produtosService.delete(id);
        console.log(`✅  Produto ${id} excluído com sucesso`);
        return res.status(200).json({ success: true, id });
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('❌ Erro ao deletar produto:', errorMsg);
        if (errorMsg.toLowerCase().includes('foreign key') || errorMsg.includes('cotacoes_itens_produto_id_fkey')) {
            return res.status(409).json({
                error: 'Produto vinculado a cotações/itens e não pode ser removido. Remova dependências primeiro.',
                code: 'FK_CONSTRAINT'
            });
        }
        res.status(500).json({ error: errorMsg });
    }
});
// DELETE force (remove dependências e depois o produto)
routers.delete('/products/:id/force', async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id))
        return res.status(400).json({ error: 'ID inválido' });
    console.log(`🗑️  [DELETE /products/${id}/force] Iniciando exclusão forçada`);
    try {
        // Remove itens de cotações vinculados
        const { error: itensErr } = await connect_1.default
            .from('cotacoes_itens')
            .delete()
            .eq('produto_id', id);
        if (itensErr)
            throw new Error(`Erro ao remover itens vinculados: ${itensErr.message}`);
        // Desvincula produto de cotacoes (set null)
        const { error: cotErr } = await connect_1.default
            .from('cotacoes')
            .update({ produto_id: null })
            .eq('produto_id', id);
        if (cotErr)
            throw new Error(`Erro ao desvincular cotações: ${cotErr.message}`);
        // Agora exclui produto
        await produtosService.delete(id);
        console.log(`✅  Produto ${id} excluído com sucesso (forçado)`);
        return res.status(200).json({ success: true, id, forced: true });
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('❌ Erro na exclusão forçada:', errorMsg);
        return res.status(500).json({ error: errorMsg });
    }
});
exports.default = routers;
//# sourceMappingURL=index.js.map