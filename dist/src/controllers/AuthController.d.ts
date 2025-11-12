import { Request, Response } from 'express';
declare class AuthController {
    signUp(req: Request, res: Response): Promise<Response>;
    signIn(req: Request, res: Response): Promise<Response>;
    recoverPassword(req: Request, res: Response): Promise<Response>;
    initiateTwoFactorAuth(req: Request, res: Response): Promise<Response>;
    twoFactorAuth(req: Request, res: Response): Promise<Response>;
    completeTwoFactorAuth(req: Request, res: Response): Promise<Response>;
    resetPassword(req: Request, res: Response): Promise<Response>;
    logout(req: Request, res: Response): Promise<Response>;
}
declare const _default: AuthController;
export default _default;
//# sourceMappingURL=AuthController.d.ts.map