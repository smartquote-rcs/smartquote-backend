import { CotacaoDTO } from '../models/Cotacao';
export declare class CotacaoNotificationService {
    private notificationService;
    /**
     * Cria notificação quando uma nova cotação é criada
     */
    notificarCotacaoCriada(cotacao: CotacaoDTO): Promise<void>;
    /**
     * Cria notificação quando uma cotação é aprovada
     */
    notificarCotacaoAprovada(cotacao: CotacaoDTO): Promise<void>;
    /**
     * Cria notificação quando uma cotação é rejeitada
     */
    notificarCotacaoRejeitada(cotacao: CotacaoDTO): Promise<void>;
    /**
     * Cria notificação quando uma cotação é deletada
     */
    notificarCotacaoDeletada(cotacao: CotacaoDTO): Promise<void>;
    /**
     * Processa notificação baseada no status da cotação
     */
    processarNotificacaoCotacao(cotacao: CotacaoDTO, acao: 'criada' | 'aprovada' | 'rejeitada' | 'deletada'): Promise<void>;
    /**
     * Analisa mudanças na cotação e determina que tipo de notificação enviar
     */
    analisarENotificarMudancas(cotacaoAntiga: CotacaoDTO | null, cotacaoNova: CotacaoDTO): Promise<void>;
    /**
     * Remove notificações relacionadas a uma cotação específica
     */
    removerNotificacoesCotacao(cotacaoId: number): Promise<void>;
}
declare const _default: CotacaoNotificationService;
export default _default;
//# sourceMappingURL=CotacaoNotificationService.d.ts.map