import {Router} from "express";
import authRouter from "./auth.route";
import { authMiddleware } from "../middleware/authMiddleware";
import produtosRoutes from "./produtos.routes";
import fornecedoresRoutes from "./fornecedores.routes";
import cotacoesRoutes from "./cotacoes.routes";
import userRouter from "./users.route";

const routers = Router();

routers.get("/",(req, res)=>{
    res.status(200).json("APi SmartQuote ON...");
});
routers.use("/auth", authRouter);
routers.use("/users",authMiddleware, userRouter);
routers.use('/produtos',authMiddleware, produtosRoutes);
routers.use('/fornecedores',authMiddleware, fornecedoresRoutes);
routers.use('/cotacoes',authMiddleware, cotacoesRoutes);

// Rotas públicas para compatibilidade com frontend
routers.get('/products', async (req, res) => {
    try {
        const { ProdutosService } = require('../services/ProdutoService');
        const produtosService = new ProdutosService();
        const produtos = await produtosService.getAll();
        res.status(200).json({ data: produtos });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

routers.get('/suppliers', async (req, res) => {
    try {
        const FornecedoresService = require('../services/FornecedoresService').default;
        const fornecedores = await FornecedoresService.getAll();
        res.status(200).json({ data: fornecedores });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
export default routers;