"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CotacoesController_1 = __importDefault(require("../controllers/CotacoesController"));
const router = (0, express_1.Router)();
router.post('/', CotacoesController_1.default.create);
router.get('/', CotacoesController_1.default.getAll);
router.get('/:id', CotacoesController_1.default.getById);
router.patch('/:id', CotacoesController_1.default.patch);
router.delete('/:id', CotacoesController_1.default.delete);
exports.default = router;
//# sourceMappingURL=cotacoes.routes.js.map