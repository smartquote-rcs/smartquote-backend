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
export default routers;