"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = __importDefault(require("./auth.route"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const produtos_routes_1 = __importDefault(require("./produtos.routes"));
const fornecedores_routes_1 = __importDefault(require("./fornecedores.routes"));
const cotacoes_routes_1 = __importDefault(require("./cotacoes.routes"));
const users_route_1 = __importDefault(require("./users.route"));
const routers = (0, express_1.Router)();
routers.get("/", (req, res) => {
    res.status(200).json("APi SmartQuote ON...");
});
routers.use("/auth", auth_route_1.default);
routers.use("/users", authMiddleware_1.authMiddleware, users_route_1.default);
routers.use('/produtos', authMiddleware_1.authMiddleware, produtos_routes_1.default);
routers.use('/fornecedores', authMiddleware_1.authMiddleware, fornecedores_routes_1.default);
routers.use('/cotacoes', authMiddleware_1.authMiddleware, cotacoes_routes_1.default);
exports.default = routers;
//# sourceMappingURL=index.js.map