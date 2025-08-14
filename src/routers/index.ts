import {Router} from "express";
import authRouter from "./auth.route";
import { authMiddleware } from "../middleware/authMiddleware";
import produtosRoutes from "./produtos.routes";
import fornecedoresRoutes from "./fornecedores.routes";
import cotacoesRoutes from "./cotacoes.routes";
import userRouter from "./users.route";
import buscaRouter from "./busca.routes";
import testRouter from "./test.routes";
import emailRouter from "./email.routes";

const routers = Router();

routers.get("/",(req, res)=>{
    res.status(200).json("APi SmartQuote ON...");
});
routers.use("/test", testRouter);
routers.use("/auth", authRouter);
routers.use("/users",authMiddleware, userRouter);
routers.use('/produtos',authMiddleware, produtosRoutes);
routers.use('/fornecedores', fornecedoresRoutes);
routers.use('/suppliers', fornecedoresRoutes);
routers.use('/cotacoes',authMiddleware, cotacoesRoutes);
//routers.use('/busca-automatica',authMiddleware, buscaRouter);
routers.use('/busca-automatica', buscaRouter);
routers.use('/email', emailRouter);
// Rotas públicas RESTful para products (compatível com frontend)
import { ProdutosService } from '../services/ProdutoService';
const produtosService = new ProdutosService();
// GET /api/products
routers.get('/products', async (req, res) => {
    try {
        const produtos = await produtosService.getAll();
        res.status(200).json({ data: produtos });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        res.status(500).json({ error: errorMsg });
    }
});
// GET /api/products/:id
routers.get('/products/:id', async (req, res) => {
    try {
        const produto = await produtosService.getById(Number(req.params.id));
        if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
        res.status(200).json({ data: produto });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        res.status(500).json({ error: errorMsg });
    }
});
// POST /api/products
routers.post('/products', async (req, res) => {
    try {
        const novo = await produtosService.create(req.body);
        res.status(201).json({ data: novo });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        res.status(500).json({ error: errorMsg });
    }
});
// PATCH /api/products/:id
routers.patch('/products/:id', async (req, res) => {
    try {
        const atualizado = await produtosService.updatePartial(Number(req.params.id), req.body);
        res.status(200).json({ data: atualizado });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        res.status(500).json({ error: errorMsg });
    }
});
// DELETE /api/products/:id
routers.delete('/products/:id', async (req, res) => {
    try {
        await produtosService.delete(Number(req.params.id));
        res.status(204).send();
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        res.status(500).json({ error: errorMsg });
    }
});
export default routers;