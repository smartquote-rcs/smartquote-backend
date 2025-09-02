/**
 * Serviço para consumir a API Python de busca local
 */

import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
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

// Estender o tipo do Axios para incluir metadata
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

class PythonApiClient {
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private isHealthy: boolean = false;
  private lastHealthCheck: number = 0;
  private readonly healthCheckInterval: number = 30000; // 30 segundos

  constructor(options?: { 
    baseUrl?: string; 
    timeout?: number; 
    retries?: number;
  }) {
    this.baseUrl = options?.baseUrl || process.env.PYTHON_API_URL || 'http://127.0.0.1:5001';
    this.timeout = options?.timeout || Number(process.env.PYTHON_API_TIMEOUT || 120000);

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      validateStatus: (status) => status < 500, // Não rejeitar para status < 500
    });

    // Interceptor para logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🐍 [PYTHON-API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error(`❌ [PYTHON-API] Request error: ${error.message}`);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        const startTime = response.config.metadata?.startTime || 0;
        const endTime = response.config.metadata?.endTime || Date.now();
        const duration = endTime - startTime;
        console.log(`✅ [PYTHON-API] ${response.status} ${response.config.url} (${duration}ms)`);
        return response;
      },
      (error) => {
        if (error.code === 'ECONNREFUSED') {
          console.error(`🔌 [PYTHON-API] Connection refused - API may be down`);
        } else if (error.code === 'ETIMEDOUT') {
          console.error(`⏱️ [PYTHON-API] Request timeout`);
        } else {
          console.error(`❌ [PYTHON-API] Response error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );

    // Interceptor para medir tempo
    this.client.interceptors.request.use((config) => {
      config.metadata = { startTime: Date.now() };
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        if (response.config.metadata) {
          response.config.metadata.endTime = Date.now();
        }
        return response;
      },
      (error) => {
        if (error.config?.metadata) {
          error.config.metadata.endTime = Date.now();
        }
        return Promise.reject(error);
      }
    );

    // Verificar saúde inicial
    this.checkHealth().catch(() => {
      console.warn(`⚠️ [PYTHON-API] Initial health check failed - API may not be ready`);
    });
  }

  /**
   * Verifica se a API Python está saudável
   */
  async checkHealth(): Promise<HealthStatus> {
    try {
      const response: AxiosResponse<HealthStatus> = await this.client.get('/health');
      
      if (response.status === 200 && response.data.status === 'healthy') {
        this.isHealthy = true;
        this.lastHealthCheck = Date.now();
        console.log(`💚 [PYTHON-API] Health check passed - all services operational`);
        return response.data;
      } else {
        this.isHealthy = false;
        console.warn(`⚠️ [PYTHON-API] Health check failed: ${response.data.status}`);
        throw new Error(`Health check failed: ${response.data.status}`);
      }
    } catch (error: any) {
      this.isHealthy = false;
      console.error(`❌ [PYTHON-API] Health check error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica se deve fazer health check (baseado no intervalo)
   */
  private shouldHealthCheck(): boolean {
    return Date.now() - this.lastHealthCheck > this.healthCheckInterval;
  }

  /**
   * Garante que a API está saudável antes de fazer requisições
   */
  private async ensureHealthy(): Promise<void> {
    if (!this.isHealthy || this.shouldHealthCheck()) {
      await this.checkHealth();
    }
  }

  /**
   * Processa uma interpretação de email
   */
  async processInterpretation(payload: ProcessInterpretationPayload): Promise<PythonApiResult> {
    const startTime = Date.now();

    try {
      await this.ensureHealthy();

      console.log(`🔄 [PYTHON-API] Processing interpretation...`);
      
      const response: AxiosResponse = await this.client.post('/process-interpretation', payload);
      
      const executionTime = Date.now() - startTime;

      if (response.status === 200) {
        console.log(`✅ [PYTHON-API] Interpretation processed successfully in ${executionTime}ms`);
        return {
          success: true,
          result: response.data,
          executionTime
        };
      } else {
        console.error(`❌ [PYTHON-API] Processing failed: ${response.status} - ${response.data?.error || 'Unknown error'}`);
        return {
          success: false,
          error: response.data?.error || `HTTP ${response.status}`,
          executionTime
        };
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ [PYTHON-API] Request failed: ${error.message}`);
      
      return {
        success: false,
        error: error.code === 'ECONNREFUSED' 
          ? 'Python API não está disponível' 
          : error.message,
        executionTime
      };
    }
  }

  /**
   * Executa busca híbrida ponderada
   */
  async hybridSearch(payload: HybridSearchPayload): Promise<PythonApiResult> {
    const startTime = Date.now();

    try {
      await this.ensureHealthy();

      console.log(`🔍 [PYTHON-API] Executing hybrid search: "${payload.pesquisa}"`);
      
      const response: AxiosResponse<HybridSearchResult> = await this.client.post('/hybrid-search', payload);
      
      const executionTime = Date.now() - startTime;

      if (response.status === 200) {
        console.log(`🎯 [PYTHON-API] Hybrid search completed: ${response.data.total_encontrados} results in ${executionTime}ms`);
        return {
          success: true,
          result: response.data,
          executionTime
        };
      } else {
        console.error(`❌ [PYTHON-API] Hybrid search failed: ${response.status} - ${response.data?.error || 'Unknown error'}`);
        return {
          success: false,
          error: response.data?.error || `HTTP ${response.status}`,
          executionTime
        };
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ [PYTHON-API] Hybrid search request failed: ${error.message}`);
      
      return {
        success: false,
        error: error.code === 'ECONNREFUSED' 
          ? 'Python API não está disponível' 
          : error.message,
        executionTime
      };
    }
  }

  /**
   * Sincroniza produtos do Supabase para o Weaviate
   */
  async syncProducts(): Promise<PythonApiResult> {
    const startTime = Date.now();

    try {
      await this.ensureHealthy();

      console.log(`🔄 [PYTHON-API] Syncing products...`);
      
      const response: AxiosResponse = await this.client.post('/sync-products');
      
      const executionTime = Date.now() - startTime;

      if (response.status === 200) {
        const syncedCount = response.data?.produtos_sincronizados || 0;
        console.log(`✅ [PYTHON-API] Products synced: ${syncedCount} products in ${executionTime}ms`);
        return {
          success: true,
          result: response.data,
          executionTime
        };
      } else {
        console.error(`❌ [PYTHON-API] Product sync failed: ${response.status} - ${response.data?.error || 'Unknown error'}`);
        return {
          success: false,
          error: response.data?.error || `HTTP ${response.status}`,
          executionTime
        };
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ [PYTHON-API] Product sync request failed: ${error.message}`);
      
      return {
        success: false,
        error: error.code === 'ECONNREFUSED' 
          ? 'Python API não está disponível' 
          : error.message,
        executionTime
      };
    }
  }

  /**
   * Verifica se a API está disponível
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.checkHealth();
      return this.isHealthy;
    } catch {
      return false;
    }
  }

  /**
   * Obtém estatísticas da API
   */
  getStats() {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      isHealthy: this.isHealthy,
      lastHealthCheck: new Date(this.lastHealthCheck).toISOString(),
    };
  }
}

// Instância singleton
export const pythonApiClient = new PythonApiClient();

export default PythonApiClient;
export type { PythonApiResult, HealthStatus, HybridSearchPayload, HybridSearchResult, ProcessInterpretationPayload };
