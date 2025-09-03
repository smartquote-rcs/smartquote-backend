import { Request, Response } from 'express';
declare class DynamicsController {
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
     * Atualiza configurações do Dynamics
     */
    atualizarConfiguracoes(req: Request, res: Response): Promise<Response>;
    /**
     * Envia uma cotação específica para Dynamics (teste manual)
     */
    enviarCotacao(req: Request, res: Response): Promise<Response>;
    /**
     * Reenvia todas as cotações aprovadas para Dynamics (sincronização em lote)
     */
    sincronizarCotacoesAprovadas(req: Request, res: Response): Promise<Response>;
}
declare const _default: DynamicsController;
export default _default;
//# sourceMappingURL=DynamicsController.d.ts.map