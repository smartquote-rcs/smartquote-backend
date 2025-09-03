"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CotacoesItensController_1 = __importDefault(require("../controllers/CotacoesItensController"));
const router = (0, express_1.Router)();
router.get('/', CotacoesItensController_1.default.list);
router.get('/:id', CotacoesItensController_1.default.get);
router.put('/replace-product', CotacoesItensController_1.default.replaceProduct);
router.post('/add', CotacoesItensController_1.default.add);
router.get('/sugeridos/web/:id', CotacoesItensController_1.default.getSugeridosWeb);
router.get('/sugeridos/local/:id', CotacoesItensController_1.default.getSugeridosLocal);
exports.default = router;
//# sourceMappingURL=cotacoesItens.routes.js.map