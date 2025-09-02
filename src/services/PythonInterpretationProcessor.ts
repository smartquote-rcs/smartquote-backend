/**
 * Serviço para processar interpretações usando API Python
 * Migrado de processo filho para cliente HTTP
 */

import type { EmailInterpretation, BuscaLocal } from './GeminiInterpretationService';
import { pythonApiClient, PythonApiResult } from './PythonApiClient';

interface PythonProcessResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

class PythonInterpretationProcessor {
  private readonly enableFallback: boolean;

  constructor(options?: { enableFallback?: boolean }) {
    this.enableFallback = options?.enableFallback ?? true;
    console.log(`🐍 [PYTHON-PROCESSOR] Initialized with API client (fallback: ${this.enableFallback})`);
  }

  /**
   * Processa uma interpretação usando a API Python
   */
  async processInterpretation(interpretation: EmailInterpretation | BuscaLocal): Promise<PythonProcessResult> {
    try {
      console.log(`📥 [PYTHON-PROCESSOR] Processing interpretation via API...`);

      const result: PythonApiResult = await pythonApiClient.processInterpretation({
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
      } else {
        console.error(`❌ [PYTHON-PROCESSOR] Processing failed: ${result.error}`);
        return {
          success: false,
          error: result.error || 'Unknown API error',
          executionTime: result.executionTime
        };
      }
    } catch (error: any) {
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
  async processHybridSearch(searchPayload: { 
    pesquisa: string; 
    filtros?: any; 
    limite?: number;
    usar_multilingue?: boolean;
  }): Promise<PythonProcessResult> {
    try {
      console.log(`🔍 [PYTHON-PROCESSOR] Executing hybrid search via API: "${searchPayload.pesquisa}"`);

      const result: PythonApiResult = await pythonApiClient.hybridSearch({
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
      } else {
        console.error(`❌ [PYTHON-PROCESSOR] Hybrid search failed: ${result.error}`);
        return {
          success: false,
          error: result.error || 'Unknown API error',
          executionTime: result.executionTime
        };
      }
    } catch (error: any) {
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
  async syncProducts(): Promise<PythonProcessResult> {
    try {
      console.log(`🔄 [PYTHON-PROCESSOR] Syncing products via API...`);

      const result: PythonApiResult = await pythonApiClient.syncProducts();

      if (result.success) {
        const syncedCount = result.result?.produtos_sincronizados || 0;
        console.log(`✅ [PYTHON-PROCESSOR] Products synced: ${syncedCount} products in ${result.executionTime}ms`);
        return {
          success: true,
          result: result.result,
          executionTime: result.executionTime
        };
      } else {
        console.error(`❌ [PYTHON-PROCESSOR] Product sync failed: ${result.error}`);
        return {
          success: false,
          error: result.error || 'Unknown API error',
          executionTime: result.executionTime
        };
      }
    } catch (error: any) {
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
  async checkPythonAvailability(): Promise<boolean> {
    try {
      const isAvailable = await pythonApiClient.isAvailable();
      console.log(`🔍 [PYTHON-PROCESSOR] API availability check: ${isAvailable ? 'available' : 'unavailable'}`);
      return isAvailable;
    } catch (error: any) {
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
      apiStats: pythonApiClient.getStats(),
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
      const health = await pythonApiClient.checkHealth();
      console.log(`💚 [PYTHON-PROCESSOR] Health check passed: ${JSON.stringify(health.services)}`);
      return health;
    } catch (error: any) {
      console.error(`❌ [PYTHON-PROCESSOR] Health check failed: ${error.message}`);
      throw error;
    }
  }
}

export default PythonInterpretationProcessor;
export const pythonProcessor = new PythonInterpretationProcessor();
export type { PythonProcessResult };
