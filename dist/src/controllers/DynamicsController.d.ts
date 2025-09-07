import { Request, Response } from 'express';
declare class DynamicsController {
    private dynamicsService;
    constructor();
    /**
     * Testa a conexão com Dynamics 365
     */
    testarConexao(req: Request, res: Response): Promise<Response>;
    /**
     * Obtém informações do ambiente Dynamics
     */
    obterInformacoesAmbiente(req: Request, res: Response): Promise<Response>;
    /**
     * Obtém configurações atuais do Dynamics (sem dados sensíveis)
     */
    obterConfiguracoes(req: Request, res: Response): Promise<Response>;
    /**
     * Atualiza configurações do Dynamics (método desabilitado temporariamente)
     */
    atualizarConfiguracoes(req: Request, res: Response): Promise<Response>;
    /**
     * Consulta entidades disponíveis no Dynamics para descobrir nomes corretos
     */
    consultarEntidadesDisponiveis(req: Request, res: Response): Promise<Response>;
    consultarEntidadesPadrao(req: Request, res: Response): Promise<Response>;
    /**
     * Envia uma cotação específica para Dynamics (teste manual)
     */
    enviarCotacao(req: Request, res: Response): Promise<Response>;
    /**
     * Reenvia todas as cotações aprovadas para Dynamics (sincronização em lote)
     */
    sincronizarCotacoesAprovadas(req: Request, res: Response): Promise<Response>;
    /**
     * Lista todas as entidades disponíveis no Dynamics
     */
    listarTodasEntidades(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Lista todas as oportunidades (opportunities) do Dynamics 365
     */
    listarOportunidades(req: Request, res: Response): Promise<Response>;
}
declare const _default: DynamicsController;
export default _default;
//# sourceMappingURL=DynamicsController.d.ts.map