import { Request, Response } from 'express';
declare class CotacoesItensController {
    list(req: Request, res: Response): Promise<void>;
    get(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getSugeridosWeb(req: Request, res: Response): Promise<void>;
    getSugeridosLocal(req: Request, res: Response): Promise<void>;
    replaceProduct(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    add(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    private parsePrice;
    private extractProviderFromUrl;
}
declare const _default: CotacoesItensController;
export default _default;
//# sourceMappingURL=CotacoesItensController.d.ts.map