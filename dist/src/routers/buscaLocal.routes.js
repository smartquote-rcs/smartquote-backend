"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BuscaLocalController_1 = __importDefault(require("../controllers/BuscaLocalController"));
const router = (0, express_1.Router)();
// POST /api/busca-local
router.post('/', (req, res) => BuscaLocalController_1.default.search(req, res));
exports.default = router;
//# sourceMappingURL=buscaLocal.routes.js.map