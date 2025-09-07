import { Request, Response } from 'express';
declare class SistemaController {
    /**
     * Busca as configurações do sistema
     */
    getSistema(req: Request, res: Response): Promise<Response>;
    /**
     * Cria ou atualiza as configurações do sistema
     */
    upsertSistema(req: Request, res: Response): Promise<Response>;
    /**
     * Atualiza parcialmente as configurações do sistema
     */
    updateSistema(req: Request, res: Response): Promise<Response>;
}
declare const _default: SistemaController;
export default _default;
//# sourceMappingURL=SistemaController.d.ts.map