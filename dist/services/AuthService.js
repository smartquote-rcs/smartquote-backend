"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = __importDefault(require("../infra/supabase/connect"));
class AuthService {
    async signUp({ username, email, password }) {
        const { data, error } = await connect_1.default.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: username },
            },
        });
        if (error)
            throw new Error(error.message);
        return {
            userId: data.user?.id,
        };
    }
    async signIn({ email, password }) {
        const { data, error } = await connect_1.default.auth.signInWithPassword({
            email,
            password,
        });
        if (error)
            throw new Error(error.message);
        return {
            token: data.session?.access_token,
            user: {
                id: data.user.id,
                email: data.user.email,
            },
        };
    }
}
exports.default = new AuthService();
//# sourceMappingURL=AuthService.js.map