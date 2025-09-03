"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = __importDefault(require("../controllers/AuthController"));
const authRouter = (0, express_1.Router)();
authRouter.post("/signup", AuthController_1.default.signUp);
authRouter.post("/signin", AuthController_1.default.signIn);
authRouter.post("/forget", AuthController_1.default.recoverPassword);
exports.default = authRouter;
//# sourceMappingURL=auth.route.js.map