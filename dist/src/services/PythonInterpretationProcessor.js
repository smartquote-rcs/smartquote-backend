"use strict";
/**
 * Serviço para processar interpretações usando API Python
 * Migrado de processo filho para cliente HTTP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pythonProcessor = void 0;
const PythonApiClient_1 = require("./PythonApiClient");
class PythonInterpretationProcessor {
    enableFallback;
    constructor(options) {
        this.enableFallback = options?.enableFallback ?? true;
        console.log(`🐍 [PYTHON-PROCESSOR] Initialized with API client (fallback: ${this.enableFallback})`);
    }
    /**
     * Processa uma interpretação usando a API Python
     */
    async processInterpretation(interpretation) {
        try {
            console.log(`📥 [PYTHON-PROCESSOR] Processing interpretation via API...`);
            const result = await PythonApiClient_1.pythonApiClient.processInterpretation({
                interpretation,
                limite: Number(process.env.PYTHON_DEFAULT_LIMIT || 10),
                usar_multilingue: process.env.PYTHON_USE_MULTILINGUAL !== 'false',
                criar_cotacao: process.env.PYTHON_CREATE_QUOTATION === 'true'
            });
            if (result.success) {
                console.log(`✅ [PYTHON-PROCESSOR] Processing completed successfully in ${result.executionTime}ms`);
                return {
                    success: true,
                    result: result.result,
                    executionTime: result.executionTime
                };
            }
            else {
                console.error(`❌ [PYTHON-PROCESSOR] Processing failed: ${result.error}`);
                return {
                    success: false,
                    error: result.error || 'Unknown API error',
                    executionTime: result.executionTime
                };
            }
        }
        catch (error) {
            console.error(`❌ [PYTHON-PROCESSOR] Request failed: ${error.message}`);
            return {
                success: false,
                error: `API request failed: ${error.message}`,
                executionTime: 0
            };
        }
    }
    /**
     * Executa busca híbrida ponderada usando a API Python
     */
    async processHybridSearch(searchPayload) {
        try {
            console.log(`🔍 [PYTHON-PROCESSOR] Executing hybrid search via API: "${searchPayload.pesquisa}"`);
            const result = await PythonApiClient_1.pythonApiClient.hybridSearch({
                pesquisa: searchPayload.pesquisa,
                filtros: searchPayload.filtros,
                limite: searchPayload.limite || Number(process.env.PYTHON_DEFAULT_LIMIT || 10),
                usar_multilingue: searchPayload.usar_multilingue ?? (process.env.PYTHON_USE_MULTILINGUAL !== 'false')
            });
            if (result.success) {
                console.log(`🎯 [PYTHON-PROCESSOR] Hybrid search completed: ${result.result?.total_encontrados || 0} results in ${result.executionTime}ms`);
                return {
                    success: true,
                    result: result.result,
                    executionTime: result.executionTime
                };
            }
            else {
                console.error(`❌ [PYTHON-PROCESSOR] Hybrid search failed: ${result.error}`);
                return {
                    success: false,
                    error: result.error || 'Unknown API error',
                    executionTime: result.executionTime
                };
            }
        }
        catch (error) {
            console.error(`❌ [PYTHON-PROCESSOR] Hybrid search request failed: ${error.message}`);
            return {
                success: false,
                error: `API request failed: ${error.message}`,
                executionTime: 0
            };
        }
    }
    /**
     * Sincroniza produtos do Supabase para o Weaviate
     */
    async syncProducts() {
        try {
            console.log(`🔄 [PYTHON-PROCESSOR] Syncing products via API...`);
            const result = await PythonApiClient_1.pythonApiClient.syncProducts();
            if (result.success) {
                const syncedCount = result.result?.produtos_sincronizados || 0;
                console.log(`✅ [PYTHON-PROCESSOR] Products synced: ${syncedCount} products in ${result.executionTime}ms`);
                return {
                    success: true,
                    result: result.result,
                    executionTime: result.executionTime
                };
            }
            else {
                console.error(`❌ [PYTHON-PROCESSOR] Product sync failed: ${result.error}`);
                return {
                    success: false,
                    error: result.error || 'Unknown API error',
                    executionTime: result.executionTime
                };
            }
        }
        catch (error) {
            console.error(`❌ [PYTHON-PROCESSOR] Product sync request failed: ${error.message}`);
            return {
                success: false,
                error: `API request failed: ${error.message}`,
                executionTime: 0
            };
        }
    }
    /**
     * Verifica se a API Python está disponível
     */
    async checkPythonAvailability() {
        try {
            const isAvailable = await PythonApiClient_1.pythonApiClient.isAvailable();
            console.log(`🔍 [PYTHON-PROCESSOR] API availability check: ${isAvailable ? 'available' : 'unavailable'}`);
            return isAvailable;
        }
        catch (error) {
            console.error(`❌ [PYTHON-PROCESSOR] Availability check failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Obtém estatísticas do processador
     */
    getStats() {
        return {
            type: 'api-client',
            enableFallback: this.enableFallback,
            apiStats: PythonApiClient_1.pythonApiClient.getStats(),
            environment: {
                defaultLimit: Number(process.env.PYTHON_DEFAULT_LIMIT || 10),
                useMultilingual: process.env.PYTHON_USE_MULTILINGUAL !== 'false',
                createQuotation: process.env.PYTHON_CREATE_QUOTATION === 'true',
                apiUrl: process.env.PYTHON_API_URL || 'http://127.0.0.1:5001',
                apiTimeout: Number(process.env.PYTHON_API_TIMEOUT || 120000)
            }
        };
    }
    /**
     * Verifica saúde da API Python
     */
    async healthCheck() {
        try {
            const health = await PythonApiClient_1.pythonApiClient.checkHealth();
            console.log(`💚 [PYTHON-PROCESSOR] Health check passed: ${JSON.stringify(health.services)}`);
            return health;
        }
        catch (error) {
            console.error(`❌ [PYTHON-PROCESSOR] Health check failed: ${error.message}`);
            throw error;
        }
    }
}
exports.default = PythonInterpretationProcessor;
exports.pythonProcessor = new PythonInterpretationProcessor();
//# sourceMappingURL=PythonInterpretationProcessor.js.map