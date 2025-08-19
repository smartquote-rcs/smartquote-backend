export declare class EstoqueMonitorService {
    private notificationService;
    private produtosService;
    private readonly ESTOQUE_MINIMO_PADRAO;
    private readonly INTERVALO_VERIFICACAO;
    private intervalId;
    private isRunning;
    /**
     * Inicia o monitoramento automático de estoque
     */
    iniciarMonitoramento(estoqueMinimo?: number, intervaloMs?: number): void;
    /**
     * Para o monitoramento automático
     */
    pararMonitoramento(): void;
    /**
     * Verifica se o monitoramento está ativo
     */
    isMonitorandoAtivo(): boolean;
    /**
     * Executa uma única verificação de estoque
     */
    verificarEstoqueManual(estoqueMinimo?: number): Promise<{
        produtosComEstoqueBaixo: number;
        notificacoesCriadas: number;
        notificacoesJaExistentes: number;
        produtos: Array<{
            id?: number;
            nome: string;
            estoque: number;
            codigo?: string;
        }>;
    }>;
    /**
     * Verificação automática (sem logs detalhados)
     */
    private verificarEstoqueAutomatico;
    /**
     * Lógica principal para processar produtos com estoque baixo
     */
    private processarEstoqueBaixo;
    /**
     * Limpar notificações obsoletas (produtos reabastecidos)
     */
    limparNotificacoesObsoletas(estoqueMinimo?: number): Promise<{
        notificacoesRemovidas: number;
        limiteUtilizado: number;
    }>;
}
declare const _default: EstoqueMonitorService;
export default _default;
//# sourceMappingURL=EstoqueMonitorService.d.ts.map