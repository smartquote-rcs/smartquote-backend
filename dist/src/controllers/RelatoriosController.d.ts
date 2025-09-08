import { Request, Response } from 'express';
export default class RelatoriosController {
    private static exportService;
    static gerarRelatorio(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static downloadRelatorio(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static statusRelatorio(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static listarRelatorios(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static atualizarPropostaEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static obterPropostaEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Gera e faz download direto do relatório em formato CSV
     */
    static gerarRelatorioCSV(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Gera e faz download direto do relatório em formato XLSX
     */
    static gerarRelatorioXLSX(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=RelatoriosController.d.ts.map