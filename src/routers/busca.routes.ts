import { Router } from "express";
import BuscaController from "../controllers/BuscaController";

const buscaRouter = Router();

// POST /busca-automatica - Realiza busca automática de produtos
buscaRouter.post("/", BuscaController.buscarProdutos);

// GET /busca-automatica/sites - Retorna lista de sites disponíveis
buscaRouter.get("/sites", BuscaController.getSites);

// GET /busca-automatica/config - Retorna configurações padrão
buscaRouter.get("/config", BuscaController.getConfig);

// GET /busca-automatica/produtos/:fornecedorId - Lista produtos salvos de um fornecedor
buscaRouter.get("/produtos/:fornecedorId", BuscaController.getProdutosPorFornecedor);

export default buscaRouter;
