import { Request, Response } from 'express';
declare class EmployeeController {
    create(req: Request, res: Response): Promise<Response>;
    getAll(req: Request, res: Response): Promise<Response>;
    getById(req: Request, res: Response): Promise<Response>;
    delete(req: Request, res: Response): Promise<Response>;
    patch(req: Request, res: Response): Promise<Response>;
}
declare const _default: EmployeeController;
export default _default;
//# sourceMappingURL=EmployeeController.d.ts.map