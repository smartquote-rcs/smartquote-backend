"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const NotificationController_1 = __importDefault(require("../controllers/NotificationController"));
const router = (0, express_1.Router)();
// CRUD básico de notificações
router.post('/', NotificationController_1.default.create);
router.get('/', NotificationController_1.default.getAll);
router.get('/:id', NotificationController_1.default.getById);
router.patch('/:id', NotificationController_1.default.update);
router.delete('/:id', NotificationController_1.default.delete);
// Rotas específicas para monitoramento de estoque
router.post('/verificar-estoque', NotificationController_1.default.verificarEstoqueBaixo);
router.post('/verificacao-automatica', NotificationController_1.default.verificacaoAutomatica);
router.delete('/limpar-obsoletas', NotificationController_1.default.limparNotificacoesObsoletas);
exports.default = router;
//# sourceMappingURL=notifications.routes.js.map