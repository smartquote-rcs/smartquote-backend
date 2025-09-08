"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PromptsController_1 = __importDefault(require("../controllers/PromptsController"));
const promptsRouter = (0, express_1.Router)();
promptsRouter.post('/', PromptsController_1.default.create);
promptsRouter.get('/', PromptsController_1.default.getAll);
promptsRouter.get('/with-dados-bruto', PromptsController_1.default.getAllWithDadosBruto);
promptsRouter.get('/:id', PromptsController_1.default.getById);
promptsRouter.patch('/:id', PromptsController_1.default.update);
promptsRouter.delete('/:id', PromptsController_1.default.delete);
exports.default = promptsRouter;
//# sourceMappingURL=prompts.routes.js.map