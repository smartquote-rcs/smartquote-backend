import { Request, Response } from 'express';
declare class ProdutosController {
    create(req: Request, res: Response): Promise<Response>;
    getAll(req: Request, res: Response): Promise<Response>;
    getById(req: Request, res: Response): Promise<Response>;
    delete(req: Request, res: Response): Promise<Response>;
    patch(req: Request, res: Response): Promise<Response>;
}
declare const _default: ProdutosController;
export default _default;
//# sourceMappingURL=ProdutosController.d.ts.map