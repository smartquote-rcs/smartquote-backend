import { Request, Response } from 'express';
declare class FornecedoresController {
    create(req: Request, res: Response): Promise<Response>;
    getAll(req: Request, res: Response): Promise<Response>;
    getById(req: Request, res: Response): Promise<Response>;
    delete(req: Request, res: Response): Promise<Response>;
    patch(req: Request, res: Response): Promise<Response>;
}
declare const _default: FornecedoresController;
export default _default;
//# sourceMappingURL=fornecedores.controller.d.ts.map