import { Request, Response } from 'express';
declare class UserController {
    create(req: Request, res: Response): Promise<Response>;
    getAll(req: Request, res: Response): Promise<Response>;
    getById(req: Request, res: Response): Promise<Response>;
    delete(req: Request, res: Response): Promise<Response>;
    patch(req: Request, res: Response): Promise<Response>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=UserController.d.ts.map