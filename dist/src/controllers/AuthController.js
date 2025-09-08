"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const signUp_schema_1 = require("../schemas/signUp.schema");
const signIn_schema_1 = require("../schemas/signIn.schema");
const twoFactorAuth_schema_1 = require("../schemas/twoFactorAuth.schema");
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
    async recoverPassword(req, res) {
        const { email } = req.body;
        try {
            const result = await AuthService_1.default.recoverPassword(email);
            return res.status(200).json({
                message: "E-mail de recuperação enviado",
                result,
            });
        }
        catch (err) {
            return res.status(400).json({ error: "Email Invalido!" });
        }
    }
    // Initiate two-factor authentication
    async initiateTwoFactorAuth(req, res) {
        const parsed = twoFactorAuth_schema_1.initiateTwoFactorSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({ errors });
        }
        try {
            const result = await AuthService_1.default.initiateTwoFactorAuth(parsed.data.email);
            return res.status(200).json({
                message: "Código de verificação enviado para o e-mail",
                expiresAt: result.expiresAt,
            });
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    // Verify two-factor authentication code (primeira etapa)
    async twoFactorAuth(req, res) {
        const parsed = twoFactorAuth_schema_1.verifyTwoFactorSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({ errors });
        }
        try {
            const result = await AuthService_1.default.twoFactorAuth(parsed.data.email, parsed.data.code);
            return res.status(200).json({
                message: result.message,
                temporaryToken: result.temporaryToken,
                user: result.user
            });
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    // Complete two-factor authentication with password (segunda etapa)
    async completeTwoFactorAuth(req, res) {
        const parsed = twoFactorAuth_schema_1.completeTwoFactorSchema.safeParse(req.body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({ errors });
        }
        try {
            const result = await AuthService_1.default.completeTwoFactorAuth(parsed.data.temporaryToken, parsed.data.password);
            return res.status(200).json({
                message: result.message,
                token: result.token,
                user: result.user
            });
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    async resetPassword(req, res) {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: "Token e nova senha são obrigatórios" });
        }
        try {
            const result = await AuthService_1.default.resetPassword(token, newPassword);
            return res.status(200).json(result);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}
exports.default = new AuthController();
//# sourceMappingURL=AuthController.js.map