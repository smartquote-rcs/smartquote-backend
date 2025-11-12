interface SignUpInput {
    username: string;
    email: string;
    password: string;
}
interface SignInInput {
    email: string;
    password: string;
}
declare class AuthService {
    signUp({ username, email, password }: SignUpInput): Promise<{
        userId: string | undefined;
    }>;
    signIn({ email, password }: SignInInput): Promise<{
        token: string;
        user: {
            id: string;
            email: string | undefined;
            name: any;
            position: any;
        };
    }>;
    recoverPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
        user: import("@supabase/auth-js").User;
    }>;
    /**
     * Inicia o processo de autenticação de dois fatores
     * 1. Verifica se o e-mail existe
     * 2. Gera um código de verificação
     * 3. Envia o código para o e-mail do usuário
     * 4. Retorna uma mensagem de sucesso
     */
    initiateTwoFactorAuth(email: string): Promise<{
        message: string;
        expiresAt: Date;
    }>;
    /**
     * Verifica o código de autenticação de dois fatores
     * 1. Verifica se o código é válido e não expirou
     * 2. Se válido, autentica o usuário
     * 3. Retorna o token de acesso
     */
    /**
     * Primeira etapa da autenticação de dois fatores: verificar o código
     */
    twoFactorAuth(email: string, code: string): Promise<{
        temporaryToken: string;
        user: {
            id: any;
            email: any;
        };
        message: string;
    }>;
    /**
     * Segunda etapa da autenticação de dois fatores: completar o login com a senha
     */
    completeTwoFactorAuth(temporaryToken: string, password: string): Promise<{
        token: string;
        user: {
            id: string;
            email: string | undefined;
        };
        message: string;
    }>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=AuthService.d.ts.map