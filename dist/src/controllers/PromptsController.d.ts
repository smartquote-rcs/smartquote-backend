import { Request, Response } from 'express';
declare class PromptsController {
    create(req: Request, res: Response): Promise<Response>;
    getAll(req: Request, res: Response): Promise<Response>;
    getById(req: Request, res: Response): Promise<Response>;
    update(req: Request, res: Response): Promise<Response>;
    delete(req: Request, res: Response): Promise<Response>;
    getAllWithDadosBruto(req: Request, res: Response): Promise<Response>;
}
declare const _default: PromptsController;
export default _default;
//# sourceMappingURL=PromptsController.d.ts.map