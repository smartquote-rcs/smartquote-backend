"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const connect_1 = __importDefault(require("../infra/supabase/connect"));
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await connect_1.default.auth.getUser(token);
    if (error || !user) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
    req.user = user;
    next();
}
//# sourceMappingURL=authMiddleware.js.map