"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const FornecedoresController_1 = __importDefault(require("../controllers/FornecedoresController"));
const router = (0, express_1.Router)();
router.post('/', FornecedoresController_1.default.create);
router.get('/', FornecedoresController_1.default.getAll);
router.get('/:id', FornecedoresController_1.default.getById);
router.patch('/:id', FornecedoresController_1.default.patch);
router.delete('/:id', FornecedoresController_1.default.delete);
exports.default = router;
//# sourceMappingURL=fornecedores.routes.js.map