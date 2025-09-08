import { CotacaoDTO } from '../models/Cotacao';
interface DynamicsConfig {
    webApiEndpoint: string;
    azureTenantId: string;
    azureClientId: string;
    azureClientSecret: string;
}
declare class DynamicsIntegrationService {
    private config;
    constructor();
    /**
     * Valida se todas as configurações necessárias estão presentes
     */
    private validateConfig;
    /**
     * Obtém token OAuth do Azure AD para autenticação no Dynamics
     */
    private getOAuthToken;
    /**
     * Testa a conexão com Dynamics 365
     */
    testarConexao(): Promise<boolean>;
    /**
     * Transforma dados da cotação para formato do Dynamics
     */
    private transformCotacaoToDynamicsSimples;
    /**
     * Envia dados para o Dynamics 365
     */
    private enviarParaDynamics;
    /**
     * Processa cotação aprovada e envia para Dynamics
     */
    processarCotacaoAprovada(cotacao: CotacaoDTO): Promise<boolean>;
    /**
     * Busca todas as oportunidades (opportunities) no Dynamics 365
     */
    listarOportunidades(): Promise<any[]>;
    /**
     * Lista todas as entidades disponíveis no Dynamics (método direto)
     */
    listarEntidadesDisponiveis(): Promise<string[]>;
    /**
     * Consulta entidades disponíveis no Dynamics para descobrir nomes corretos
     */
    consultarEntidadesDisponiveis(): Promise<{
        entidades: string[];
        quotesRelated: string[];
        salesRelated: string[];
    }>;
    /**
     * Consulta entidades padrão no Dynamics
     */
    consultarEntidadesPadrao(): Promise<{
        accounts: any[];
        currencies: any[];
        pricelevels: any[];
    }>;
    /**
     * Obtém configurações atuais (sem dados sensíveis)
     */
    obterConfig(): Omit<DynamicsConfig, 'azureClientSecret'>;
    /**
     * Status da integração
     */
    obterStatusIntegracao(): Promise<{
        configurado: boolean;
        conectado: boolean;
        ultimoTeste?: Date;
        config: any;
    }>;
    /**
     * Obtém informações do ambiente Dynamics (método simplificado)
     */
    obterInformacoesAmbiente(): Promise<any>;
}
export default DynamicsIntegrationService;
//# sourceMappingURL=DynamicsIntegrationService_fixed.d.ts.map