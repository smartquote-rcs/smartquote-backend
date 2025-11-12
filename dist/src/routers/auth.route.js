"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = __importDefault(require("../controllers/AuthController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const authRouter = (0, express_1.Router)();
authRouter.post("/signup", AuthController_1.default.signUp);
authRouter.post("/signin", AuthController_1.default.signIn);
authRouter.post("/forget", AuthController_1.default.recoverPassword);
authRouter.post("/reset-password", AuthController_1.default.resetPassword);
authRouter.post("/two-factor/init", AuthController_1.default.initiateTwoFactorAuth);
authRouter.post("/two-factor/verify", AuthController_1.default.twoFactorAuth);
authRouter.post("/two-factor/complete", AuthController_1.default.completeTwoFactorAuth);
authRouter.post("/logout", authMiddleware_1.authMiddleware, AuthController_1.default.logout); // ✨ Logout com audit log
exports.default = authRouter;
//# sourceMappingURL=auth.route.js.map