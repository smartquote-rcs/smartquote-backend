import { CotacaoDTO } from '../models/Cotacao';
interface DynamicsConfig {
    organizationId: string;
    environmentId: string;
    webApiEndpoint: string;
    discoveryEndpoint: string;
    accessToken?: string;
}
declare class DynamicsIntegrationService {
    private config;
    constructor();
    /**
     * Valida se todas as configurações necessárias estão presentes
     */
    private validateConfig;
    /**
     * Transforma dados da cotação para formato do Dynamics
     */
    private transformCotacaoToDynamics;
    /**
     * Envia dados para o Dynamics 365
     */
    private sendToDynamics;
    /**
     * Processa cotação aprovada e envia para Dynamics
     */
    processarCotacaoAprovada(cotacao: CotacaoDTO): Promise<boolean>;
    /**
     * Testa a conexão com Dynamics
     */
    testarConexao(): Promise<boolean>;
    /**
     * Obtém informações de descoberta do ambiente
     */
    obterInformacoesAmbiente(): Promise<any>;
    /**
     * Atualiza configurações do Dynamics
     */
    atualizarConfig(novaConfig: Partial<DynamicsConfig>): void;
    /**
     * Obtém configurações atuais (sem token por segurança)
     */
    obterConfig(): Omit<DynamicsConfig, 'accessToken'>;
}
declare const _default: DynamicsIntegrationService;
export default _default;
//# sourceMappingURL=DynamicsIntegrationService.d.ts.map