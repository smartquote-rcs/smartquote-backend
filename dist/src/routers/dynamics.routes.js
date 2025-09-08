"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DynamicsController_1 = __importDefault(require("../controllers/DynamicsController"));
const dynamicsRouter = (0, express_1.Router)();
// Oportunidades
dynamicsRouter.get('/oportunidades', DynamicsController_1.default.listarOportunidades.bind(DynamicsController_1.default));
// Rotas para gerenciar integração com Dynamics 365
// Testes de conectividade
dynamicsRouter.get('/test-connection', DynamicsController_1.default.testarConexao.bind(DynamicsController_1.default));
dynamicsRouter.get('/environment-info', DynamicsController_1.default.obterInformacoesAmbiente.bind(DynamicsController_1.default));
dynamicsRouter.get('/entities', DynamicsController_1.default.consultarEntidadesPadrao.bind(DynamicsController_1.default));
dynamicsRouter.get('/available-entities', DynamicsController_1.default.consultarEntidadesDisponiveis.bind(DynamicsController_1.default));
dynamicsRouter.get('/all-entities', DynamicsController_1.default.listarTodasEntidades.bind(DynamicsController_1.default));
// Configurações
dynamicsRouter.get('/config', DynamicsController_1.default.obterConfiguracoes.bind(DynamicsController_1.default));
dynamicsRouter.patch('/config', DynamicsController_1.default.atualizarConfiguracoes.bind(DynamicsController_1.default));
// Operações com cotações
dynamicsRouter.post('/send-cotacao/:id', DynamicsController_1.default.enviarCotacao.bind(DynamicsController_1.default));
dynamicsRouter.post('/sync-approved', DynamicsController_1.default.sincronizarCotacoesAprovadas.bind(DynamicsController_1.default));
exports.default = dynamicsRouter;
//# sourceMappingURL=dynamics.routes.js.map