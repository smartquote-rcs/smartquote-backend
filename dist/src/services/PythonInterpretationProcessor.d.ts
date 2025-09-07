/**
 * Serviço para processar interpretações usando API Python
 * Migrado de processo filho para cliente HTTP
 */
import type { EmailInterpretation, BuscaLocal } from './GeminiInterpretationService';
interface PythonProcessResult {
    success: boolean;
    result?: any;
    error?: string;
    executionTime: number;
}
declare class PythonInterpretationProcessor {
    private readonly enableFallback;
    constructor(options?: {
        enableFallback?: boolean;
    });
    /**
     * Processa uma interpretação usando a API Python
     */
    processInterpretation(interpretation: EmailInterpretation | BuscaLocal): Promise<PythonProcessResult>;
    /**
     * Executa busca híbrida ponderada usando a API Python
     */
    processHybridSearch(searchPayload: {
        pesquisa: string;
        filtros?: any;
        limite?: number;
        usar_multilingue?: boolean;
    }): Promise<PythonProcessResult>;
    /**
     * Sincroniza produtos do Supabase para o Weaviate
     */
    syncProducts(): Promise<PythonProcessResult>;
    /**
     * Verifica se a API Python está disponível
     */
    checkPythonAvailability(): Promise<boolean>;
    /**
     * Obtém estatísticas do processador
     */
    getStats(): {
        type: string;
        enableFallback: boolean;
        apiStats: {
            baseUrl: string;
            timeout: number;
            isHealthy: boolean;
            lastHealthCheck: string;
        };
        environment: {
            defaultLimit: number;
            useMultilingual: boolean;
            createQuotation: boolean;
            apiUrl: string;
            apiTimeout: number;
        };
    };
    /**
     * Verifica saúde da API Python
     */
    healthCheck(): Promise<import("./PythonApiClient").HealthStatus>;
}
export default PythonInterpretationProcessor;
export declare const pythonProcessor: PythonInterpretationProcessor;
export type { PythonProcessResult };
//# sourceMappingURL=PythonInterpretationProcessor.d.ts.map