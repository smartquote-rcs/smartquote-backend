/**
 * Serviço para consumir a API Python de busca local
 */
import type { EmailInterpretation, BuscaLocal } from './GeminiInterpretationService';
interface PythonApiResult {
    success: boolean;
    result?: any;
    error?: string;
    executionTime: number;
}
interface HealthStatus {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    services?: {
        weaviate: boolean;
        supabase: boolean;
        decomposer: boolean;
    };
    error?: string;
}
interface HybridSearchPayload {
    pesquisa: string;
    filtros?: any;
    limite?: number;
    usar_multilingue?: boolean;
}
interface HybridSearchResult {
    status: string;
    resultados: any[];
    total_encontrados: number;
    espacos_pesquisados: string[];
    query: string;
    filtros?: any;
    timestamp: string;
    error?: string;
}
declare module 'axios' {
    interface InternalAxiosRequestConfig {
        metadata?: {
            startTime: number;
            endTime?: number;
        };
    }
}
interface ProcessInterpretationPayload {
    interpretation: EmailInterpretation | BuscaLocal;
    limite?: number;
    usar_multilingue?: boolean;
    criar_cotacao?: boolean;
}
declare class PythonApiClient {
    private readonly client;
    private readonly baseUrl;
    private readonly timeout;
    private isHealthy;
    private lastHealthCheck;
    private readonly healthCheckInterval;
    constructor(options?: {
        baseUrl?: string;
        timeout?: number;
        retries?: number;
    });
    /**
     * Verifica se a API Python está saudável
     */
    checkHealth(): Promise<HealthStatus>;
    /**
     * Verifica se deve fazer health check (baseado no intervalo)
     */
    private shouldHealthCheck;
    /**
     * Garante que a API está saudável antes de fazer requisições
     */
    private ensureHealthy;
    /**
     * Processa uma interpretação de email
     */
    processInterpretation(payload: ProcessInterpretationPayload): Promise<PythonApiResult>;
    /**
     * Executa busca híbrida ponderada
     */
    hybridSearch(payload: HybridSearchPayload): Promise<PythonApiResult>;
    /**
     * Sincroniza produtos do Supabase para o Weaviate
     */
    syncProducts(): Promise<PythonApiResult>;
    /**
     * Verifica se a API está disponível
     */
    isAvailable(): Promise<boolean>;
    /**
     * Obtém estatísticas da API
     */
    getStats(): {
        baseUrl: string;
        timeout: number;
        isHealthy: boolean;
        lastHealthCheck: string;
    };
}
export declare const pythonApiClient: PythonApiClient;
export default PythonApiClient;
export type { PythonApiResult, HealthStatus, HybridSearchPayload, HybridSearchResult, ProcessInterpretationPayload };
//# sourceMappingURL=PythonApiClient.d.ts.map