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
const ProdutoService_1 = require("../services/ProdutoService");
const buscaLocal_routes_1 = __importDefault(require("./buscaLocal.routes"));
const prompts_routes_1 = __importDefault(require("./prompts.routes"));
const routers = (0, express_1.Router)();
const produtosService = new ProdutoService_1.ProdutosService();
routers.get("/", (req, res) => {
    res.status(200).json("APi SmartQuote ON...");
});
routers.use("/test", test_routes_1.default);
routers.use("/auth", auth_route_1.default);
routers.use("/users", authMiddleware_1.authMiddleware, users_route_1.default);
routers.use('/produtos', authMiddleware_1.authMiddleware, produtos_routes_1.default);
routers.use('/fornecedores', fornecedores_routes_1.default);
routers.use('/suppliers', fornecedores_routes_1.default);
//routers.use('/cotacoes',authMiddleware, cotacoesRoutes);
routers.use('/cotacoes', cotacoes_routes_1.default);
//routers.use('/busca-automatica',authMiddleware, buscaRouter);
routers.use('/busca-automatica', busca_routes_1.default);
routers.use('/email', email_routes_1.default);
routers.use('/gemini', gemini_routes_1.default);
routers.use('/busca-local', buscaLocal_routes_1.default);
routers.use('/notifications', authMiddleware_1.authMiddleware, notifications_routes_1.default);
routers.use('/prompts', prompts_routes_1.default);
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
        if (body.fornecedorId && !body.fornecedor_id)
            body.fornecedor_id = body.fornecedorId;
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
        if (updates.fornecedorId && !updates.fornecedor_id)
            updates.fornecedor_id = updates.fornecedorId;
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
        await produtosService.delete(Number(req.params.id));
        res.status(204).send();
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        res.status(500).json({ error: errorMsg });
    }
});
exports.default = routers;
//# sourceMappingURL=index.js.map