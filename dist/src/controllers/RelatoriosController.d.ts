import { Request, Response } from 'express';
export default class RelatoriosController {
    static gerarRelatorio(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static downloadRelatorio(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static statusRelatorio(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static listarRelatorios(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static atualizarPropostaEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static obterPropostaEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=RelatoriosController.d.ts.map