import { Request, Response } from 'express';
declare class NotificationController {
    private notificationService;
    private produtosService;
    private readonly ESTOQUE_MINIMO_PADRAO;
    create(req: Request, res: Response): Promise<Response>;
    getAll(req: Request, res: Response): Promise<Response>;
    getById(req: Request, res: Response): Promise<Response>;
    delete(req: Request, res: Response): Promise<Response>;
    update(req: Request, res: Response): Promise<Response>;
    /**
     * Verifica estoque baixo e cria notificações automaticamente
     */
    verificarEstoqueBaixo(req: Request, res: Response): Promise<Response>;
    /**
     * Endpoint para verificação automática de estoque (para uso em cron jobs)
     */
    verificacaoAutomatica(req: Request, res: Response): Promise<Response>;
    /**
     * Lógica principal para processar produtos com estoque baixo
     */
    private processarEstoqueBaixo;
    /**
     * Limpar notificações antigas de estoque baixo (produtos que já foram reabastecidos)
     */
    limparNotificacoesObsoletas(req: Request, res: Response): Promise<Response>;
}
declare const _default: NotificationController;
export default _default;
//# sourceMappingURL=NotificationController.d.ts.map