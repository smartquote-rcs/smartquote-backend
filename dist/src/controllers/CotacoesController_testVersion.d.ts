import { Request, Response } from 'express';
declare class CotacoesController {
    create(req: Request, res: Response): Promise<Response>;
    getAll(req: Request, res: Response): Promise<Response>;
    getById(req: Request, res: Response): Promise<Response>;
    delete(req: Request, res: Response): Promise<Response>;
    patch(req: Request, res: Response): Promise<Response>;
    /**
     * Remove um placeholder (faltante) da cotação.
     * Agora os faltantes são representados por registros em cotacoes_itens com status=false e campo pedido.
     */
    removeFaltante(req: Request, res: Response): Promise<Response>;
}
declare const _default: CotacoesController;
export default _default;
//# sourceMappingURL=CotacoesController_testVersion.d.ts.map