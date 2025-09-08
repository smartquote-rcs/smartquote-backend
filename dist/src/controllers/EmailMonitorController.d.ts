/**
 * Controller para gerenciar o monitoramento de emails
 */
import { Request, Response } from 'express';
declare class EmailMonitorController {
    private gmailService;
    private globalMonitor;
    constructor();
    /**
     * Endpoint para monitorar emails novos
     */
    monitorarEmails(req: Request, res: Response): Promise<void>;
    /**
     * Endpoint para verificar status do serviço
     */
    statusServico(req: Request, res: Response): Promise<void>;
    /**
     * Endpoint para limpeza de status antigos
     */
    limparStatusAntigos(req: Request, res: Response): Promise<void>;
    /**
     * Endpoint para testar a conexão com Gmail
     */
    testarConexao(req: Request, res: Response): Promise<void>;
    /**
     * Endpoint para iniciar monitoramento automático
     */
    iniciarAutoMonitoramento(req: Request, res: Response): Promise<void>;
    /**
     * Endpoint para parar monitoramento automático
     */
    pararAutoMonitoramento(req: Request, res: Response): Promise<void>;
    /**
     * Endpoint para verificar status do auto-monitoramento
     */
    statusAutoMonitoramento(req: Request, res: Response): Promise<void>;
    /**
     * Endpoint para atualizar configurações do auto-monitoramento
     */
    atualizarConfigAutoMonitoramento(req: Request, res: Response): Promise<void>;
    /**
     * Endpoint para obter logs do auto-monitoramento
     */
    logsAutoMonitoramento(req: Request, res: Response): Promise<void>;
    /**
     * Endpoint para reiniciar monitoramento automático
     */
    reiniciarAutoMonitoramento(req: Request, res: Response): Promise<void>;
    /**
     * Endpoint para listar emails salvos
     */
    listarEmailsSalvos(req: Request, res: Response): Promise<void>;
    /**
     * Endpoint para verificar se um email foi salvo
     */
    verificarEmailSalvo(req: Request, res: Response): Promise<void>;
    /**
     * Endpoint para limpar emails salvos antigos
     */
    limparEmailsSalvosAntigos(req: Request, res: Response): Promise<void>;
    /**
     * Endpoint de teste para simular salvamento de email
     */
    testarSalvamentoEmail(req: Request, res: Response): Promise<void>;
}
export default EmailMonitorController;
//# sourceMappingURL=EmailMonitorController.d.ts.map