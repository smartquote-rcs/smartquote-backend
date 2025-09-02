import { Router } from "express";
import BuscaController from "../controllers/BuscaController";

const buscaRouter = Router();

// POST /busca-automatica - Realiza busca automática de produtos (SÍNCRONA - pode demorar)
buscaRouter.post("/", BuscaController.buscarProdutos);

// POST /busca-automatica/background - Inicia busca em background e retorna imediatamente
buscaRouter.post("/background", BuscaController.buscarProdutosBackground);

// GET /busca-automatica/job/:jobId - Retorna status de um job
buscaRouter.get("/job/:jobId", BuscaController.getJobStatus);

// GET /busca-automatica/jobs - Lista todos os jobs
buscaRouter.get("/jobs", BuscaController.listarJobs);

// DELETE /busca-automatica/job/:jobId - Cancela um job
buscaRouter.delete("/job/:jobId", BuscaController.cancelarJob);

// GET /busca-automatica/sites - Retorna lista de sites disponíveis
buscaRouter.get("/sites", BuscaController.getSites);

// GET /busca-automatica/config - Retorna configurações padrão
buscaRouter.get("/config", BuscaController.getConfig);

// GET /busca-automatica/produtos/:fornecedorId - Lista produtos salvos de um fornecedor
buscaRouter.get("/produtos/:fornecedorId", BuscaController.getProdutosPorFornecedor);

// GET /busca-automatica/procurarSites - Lista sites sugeridos
buscaRouter.get("/procurarSites", BuscaController.getSitesSugeridos);


export default buscaRouter;
