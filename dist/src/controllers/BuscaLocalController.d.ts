import { Request, Response } from 'express';
export declare class BuscaLocalController {
    searchLocal(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    search(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    private recalcularOrcamento;
    /**
     * Verifica o status da API Python
     */
    checkPythonApiHealth(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Sincroniza produtos do Supabase para o Weaviate via API Python
     */
    syncProducts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: BuscaLocalController;
export default _default;
//# sourceMappingURL=BuscaLocalController.d.ts.map