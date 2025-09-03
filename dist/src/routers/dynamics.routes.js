"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DynamicsController_1 = __importDefault(require("../controllers/DynamicsController"));
const dynamicsRouter = (0, express_1.Router)();
// Rotas para gerenciar integração com Dynamics 365
// Testes de conectividade
dynamicsRouter.get('/test-connection', DynamicsController_1.default.testarConexao);
dynamicsRouter.get('/environment-info', DynamicsController_1.default.obterInformacoesAmbiente);
// Configurações
dynamicsRouter.get('/config', DynamicsController_1.default.obterConfiguracoes);
dynamicsRouter.patch('/config', DynamicsController_1.default.atualizarConfiguracoes);
// Operações com cotações
dynamicsRouter.post('/send-cotacao/:id', DynamicsController_1.default.enviarCotacao);
dynamicsRouter.post('/sync-approved', DynamicsController_1.default.sincronizarCotacoesAprovadas);
exports.default = dynamicsRouter;
//# sourceMappingURL=dynamics.routes.js.map