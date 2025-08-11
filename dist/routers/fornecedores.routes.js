"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fornecedores_controller_1 = __importDefault(require("../controllers/fornecedores.controller"));
const router = (0, express_1.Router)();
router.post('/', fornecedores_controller_1.default.create);
router.get('/', fornecedores_controller_1.default.getAll);
router.get('/:id', fornecedores_controller_1.default.getById);
router.patch('/:id', fornecedores_controller_1.default.patch);
router.delete('/:id', fornecedores_controller_1.default.delete);
exports.default = router;
//# sourceMappingURL=fornecedores.routes.js.map