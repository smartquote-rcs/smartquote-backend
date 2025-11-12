import type { Request, Response } from 'express';
declare class UserController {
    getByEmail(req: Request, res: Response): Promise<Response>;
    getByAuthId(req: Request, res: Response): Promise<Response>;
    create(req: Request, res: Response): Promise<Response>;
    getAll(req: Request, res: Response): Promise<Response>;
    getById(req: Request, res: Response): Promise<Response>;
    delete(req: Request, res: Response): Promise<Response>;
    patch(req: Request, res: Response): Promise<Response>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=UserController.d.ts.map