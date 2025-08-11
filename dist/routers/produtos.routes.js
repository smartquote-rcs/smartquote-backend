"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const produto_controller_1 = __importDefault(require("../controllers/produto.controller"));
const router = (0, express_1.Router)();
router.post('/', produto_controller_1.default.create);
router.get('/', produto_controller_1.default.getAll);
router.get('/:id', produto_controller_1.default.getById);
router.patch('/:id', produto_controller_1.default.patch);
router.delete('/:id', produto_controller_1.default.delete);
exports.default = router;
//# sourceMappingURL=produtos.routes.js.map