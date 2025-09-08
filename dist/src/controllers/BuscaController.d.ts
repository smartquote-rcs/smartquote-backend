import { Request, Response } from 'express';
interface BuscaRequest {
    produto: string;
    quantidade?: number;
    custo_beneficio?: any;
    refinamento?: boolean;
}
declare class BuscaController {
    /**
     * Realiza busca automática de produtos
     */
    buscarProdutos(req: Request<{}, {}, BuscaRequest>, res: Response): Promise<Response>;
    /**
     * Inicia busca automática em background e retorna job ID imediatamente
     */
    buscarProdutosBackground(req: Request<{}, {}, BuscaRequest>, res: Response): Promise<Response>;
    getSitesSugeridos(req: Request, res: Response): Promise<Response>;
    /**
     * Retorna o status de um job
     */
    getJobStatus(req: Request, res: Response): Promise<Response>;
    /**
     * Lista todos os jobs
     */
    listarJobs(req: Request, res: Response): Promise<Response>;
    /**
     * Cancela um job
     */
    cancelarJob(req: Request, res: Response): Promise<Response>;
    /**
     * Retorna lista de sites disponíveis
     */
    getSites(req: Request, res: Response): Promise<Response>;
    /**
     * Retorna configurações padrão
     */
    getConfig(req: Request, res: Response): Promise<Response>;
    /**
     * Lista produtos salvos de um fornecedor
     */
    getProdutosPorFornecedor(req: Request, res: Response): Promise<Response>;
}
declare const _default: BuscaController;
export default _default;
//# sourceMappingURL=BuscaController.d.ts.map