"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BuscaController_1 = __importDefault(require("../controllers/BuscaController"));
const buscaRouter = (0, express_1.Router)();
// POST /busca-automatica - Realiza busca automática de produtos (SÍNCRONA - pode demorar)
buscaRouter.post("/", BuscaController_1.default.buscarProdutos);
// POST /busca-automatica/background - Inicia busca em background e retorna imediatamente
buscaRouter.post("/background", BuscaController_1.default.buscarProdutosBackground);
// GET /busca-automatica/job/:jobId - Retorna status de um job
buscaRouter.get("/job/:jobId", BuscaController_1.default.getJobStatus);
// GET /busca-automatica/jobs - Lista todos os jobs
buscaRouter.get("/jobs", BuscaController_1.default.listarJobs);
// DELETE /busca-automatica/job/:jobId - Cancela um job
buscaRouter.delete("/job/:jobId", BuscaController_1.default.cancelarJob);
// GET /busca-automatica/sites - Retorna lista de sites disponíveis
buscaRouter.get("/sites", BuscaController_1.default.getSites);
// GET /busca-automatica/config - Retorna configurações padrão
buscaRouter.get("/config", BuscaController_1.default.getConfig);
// GET /busca-automatica/produtos/:fornecedorId - Lista produtos salvos de um fornecedor
buscaRouter.get("/produtos/:fornecedorId", BuscaController_1.default.getProdutosPorFornecedor);
// GET /busca-automatica/procurarSites - Lista sites sugeridos
buscaRouter.get("/procurarSites", BuscaController_1.default.getSitesSugeridos);
exports.default = buscaRouter;
//# sourceMappingURL=busca.routes.js.map