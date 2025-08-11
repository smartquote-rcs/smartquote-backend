"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const signUp_schema_1 = require("../schemas/signUp.schema");
const signIn_schema_1 = require("../schemas/signIn.schema");
const AuthService_1 = __importDefault(require("../services/AuthService"));
class AuthController {
    async signUp(req, res) {
        const parsed = signUp_schema_1.signUpSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({ errors });
        }
        try {
            const result = await AuthService_1.default.signUp(parsed.data);
            return res.status(201).json({
                message: 'Usuário cadastrado com sucesso.',
                userId: result.userId,
            });
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    async signIn(req, res) {
        const parsed = signIn_schema_1.signInSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({ errors });
        }
        try {
            const result = await AuthService_1.default.signIn(parsed.data);
            return res.status(200).json(result);
        }
        catch (err) {
            return res.status(401).json({ error: err.message });
        }
    }
}
exports.default = new AuthController();
//# sourceMappingURL=AuthController.js.map