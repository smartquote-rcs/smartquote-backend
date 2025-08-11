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
        };
    }>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=AuthService.d.ts.map