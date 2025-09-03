import { Request, Response } from 'express';
declare class AuthController {
    signUp(req: Request, res: Response): Promise<Response>;
    signIn(req: Request, res: Response): Promise<Response>;
    recoverPassword(req: Request, res: Response): Promise<Response>;
}
declare const _default: AuthController;
export default _default;
//# sourceMappingURL=AuthController.d.ts.map