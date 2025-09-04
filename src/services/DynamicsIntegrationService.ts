import { CotacaoDTO } from '../models/Cotacao';

interface DynamicsConfig {
  webApiEndpoint: string;
  azureTenantId: string;
  azureClientId: string;
  azureClientSecret: string;
}

interface DynamicsEntity {
  // Estrutura base para entidades do Dynamics
  [key: string]: any;
}

class DynamicsIntegrationService {
  private config: DynamicsConfig;

  constructor() {
    this.config = {
      webApiEndpoint: process.env.DYNAMICS_WEB_API_ENDPOINT || '',
      azureTenantId: process.env.AZURE_TENANT_ID || '',
      azureClientId: process.env.AZURE_CLIENT_ID || '',
      azureClientSecret: process.env.AZURE_CLIENT_SECRET || ''
    };

    this.validateConfig();
  }

  /**
   * Valida se todas as configurações necessárias estão presentes
   */
  private validateConfig(): void {
    const requiredFields = [
      'webApiEndpoint',
      'azureTenantId', 
      'azureClientId',
      'azureClientSecret'
    ];

    const missingFields = requiredFields.filter(field => !this.config[field as keyof DynamicsConfig]);
    
    if (missingFields.length > 0) {
      console.warn(`⚠️ [DYNAMICS] Configurações essenciais faltando: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Obtém token OAuth do Azure AD para autenticação no Dynamics
   */
  private async getOAuthToken(): Promise<string> {
    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.config.azureTenantId}/oauth2/v2.0/token`;
      
      // Extrair apenas a URL base (sem /api/data/v9.2) para o scope
      const baseUrl = this.config.webApiEndpoint.replace('/api/data/v9.2', '');
      
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.azureClientId,
        client_secret: this.config.azureClientSecret,
        scope: `${baseUrl}/.default`
      });

      console.log(`🔑 [DYNAMICS] Obtendo token OAuth para scope: ${baseUrl}/.default`);

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OAuth falhou (${response.status}): ${errorText}`);
      }

      const tokenData = await response.json() as { access_token: string };
      console.log(`✅ [DYNAMICS] Token OAuth obtido com sucesso`);
      
      return tokenData.access_token;
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao obter token OAuth:`, error);
      throw error;
    }
  }

  /**
   * Testa a conexão com Dynamics 365
   */
  async testarConexao(): Promise<boolean> {
    try {
      console.log(`🔍 [DYNAMICS] Testando conexão com Dynamics...`);
      console.log(`🔍 [DYNAMICS] Config atual: {
  webApiEndpoint: '${this.config.webApiEndpoint}',
  azureTenantId: '${this.config.azureTenantId.substring(0, 8)}...',
  azureClientId: '${this.config.azureClientId.substring(0, 8)}...',
  hasAzureConfig: ${!!(this.config.azureClientSecret)}
}`);

      const testUrl = `${this.config.webApiEndpoint}/$metadata`;
      console.log(`🔍 [DYNAMICS] Testando URL: ${testUrl}`);

      const token = await this.getOAuthToken();
      console.log(`🔍 [DYNAMICS] Token OAuth obtido para teste`);

      const headers = {
        'Accept': 'application/xml',
        'Authorization': `Bearer ${token}`
      };

      console.log(`🔍 [DYNAMICS] Headers:`, {
        'Accept': 'application/xml',
        'Authorization': `Bearer [HIDDEN]`
      });

      const response = await fetch(testUrl, {
        method: 'GET',
        headers
      });

      console.log(`🔍 [DYNAMICS] Response status: ${response.status}`);

      if (response.ok) {
        console.log(`✅ [DYNAMICS] Conexão estabelecida com sucesso!`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ [DYNAMICS] Falha na conexão: ${response.status} - ${errorText}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao testar conexão:`, error);
      return false;
    }
  }

  /**
   * Transforma dados da cotação para formato do Dynamics
   */
  private transformCotacaoToDynamics(cotacao: CotacaoDTO): DynamicsEntity {
    return {
      // Mapeamento básico - ajuste conforme sua estrutura no Dynamics
      name: `Cotação #${cotacao.id} - ${cotacao.produto?.nome || 'Produto'}`,
      quotenumber: `COT-${cotacao.id}`,
      description: `Cotação aprovada para ${cotacao.produto?.nome || 'produto'} - ${cotacao.motivo || ''}`,
      
      // Dados do produto
      productname: cotacao.produto?.nome || '',
      productid: cotacao.produto?.id || null,
      
      // Dados financeiros (usar orcamento_geral se disponível)
      totalamount: cotacao.orcamento_geral || 0,
      quotetotalamount: cotacao.orcamento_geral || 0,
      
      // Status da cotação
      statuscode: cotacao.aprovacao ? 'approved' : 'pending',
      approvalstatus: cotacao.aprovacao ? 'Aprovada' : 'Pendente',
      quotationstatus: cotacao.status || 'incompleta',
      
      // Dados de auditoria
      quotecreateddate: cotacao.cadastrado_em || new Date().toISOString(),
      approvaldate: cotacao.data_aprovacao || new Date().toISOString(),
      validitydate: cotacao.prazo_validade || null,
      requestdate: cotacao.data_solicitacao || null,
      
      // Observações e condições
      description_extended: cotacao.observacao || cotacao.observacoes || '',
      conditions: JSON.stringify(cotacao.condicoes || {}),
      missingitems: JSON.stringify(cotacao.faltantes || []),
      
      // IDs de relacionamento
      prompt_id: cotacao.prompt_id || null,
      produto_id: cotacao.produto_id || null,
      aprovado_por: cotacao.aprovado_por || null,
      
      // Metadados de integração
      externalsourceid: cotacao.id.toString(),
      externalsource: 'SmartQuote',
      integrationtimestamp: new Date().toISOString()
    };
  }

  /**
   * Envia dados para o Dynamics 365
   */
  private async enviarParaDynamics(entity: DynamicsEntity, entityName?: string): Promise<boolean> {
    try {
      const url = `${this.config.webApiEndpoint}/${entityName}`;
      console.log(`🔄 [DYNAMICS] Preparando envio para: ${url}`);
      console.log(`📊 [DYNAMICS] Entity name: ${entityName}`);

      // Obter token OAuth
      console.log(`🔑 [DYNAMICS] Obtendo token OAuth...`);
      const token = await this.getOAuthToken();
      console.log(`✅ [DYNAMICS] Token obtido com sucesso`);

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Authorization': `Bearer ${token}`
      };

      console.log(`🔄 [DYNAMICS] Enviando dados para: ${url}`);
      console.log(`📊 [DYNAMICS] Payload:`, JSON.stringify(entity, null, 2));
      console.log(`📋 [DYNAMICS] Headers:`, {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Authorization': 'Bearer [HIDDEN]'
      });

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(entity)
      });

      console.log(`📡 [DYNAMICS] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [DYNAMICS] Erro HTTP ${response.status}: ${errorText}`);
        
        // Se for 404, tentar próxima entidade
        if (response.status === 404 && !entityName) {
          console.log(`🔄 [DYNAMICS] Tentando próxima entidade...`);
          return false; // Falha, mas pode tentar outra entidade
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Status 201 (Created) ou 204 (No Content) = sucesso
      if (response.status === 201 || response.status === 204) {
        console.log(`✅ [DYNAMICS] Dados enviados com sucesso! Status: ${response.status}`);
        
        // 204 não retorna conteúdo, 201 pode retornar
        if (response.status === 204) {
          console.log(`📋 [DYNAMICS] Entidade criada sem retorno de dados (204 No Content)`);
          return true;
        } else {
          const result = await response.json();
          console.log(`📋 [DYNAMICS] Entidade criada com retorno:`, JSON.stringify(result, null, 2));
          return true;
        }
      }

      // Se chegou aqui, não era nem erro nem sucesso conhecido
      const result = await response.json();
      console.log(`✅ [DYNAMICS] Resposta inesperada mas válida:`, JSON.stringify(result, null, 2));
      
      return true;
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro completo ao enviar dados:`, error);
      return false;
    }
  }

  /**
   * Processa cotação aprovada e envia para Dynamics
   */
  async processarCotacaoAprovada(cotacao: CotacaoDTO): Promise<boolean> {
    console.log(`📋 [DYNAMICS] Processando cotação aprovada ID: ${cotacao.id}`);

    const entidadesCandidatas = ['quotes', 'opportunities', 'incidents', 'leads'];

    for (const entidade of entidadesCandidatas) {
      try {
        console.log(`🎯 [DYNAMICS] Tentando enviar como ${entidade}...`);
        
        const entity = this.transformCotacaoToDynamicsSimples(cotacao, entidade);
        const sucesso = await this.enviarParaDynamics(entity, entidade);

        if (sucesso) {
          console.log(`✅ [DYNAMICS] Cotação ${cotacao.id} enviada com sucesso como ${entidade}!`);
          return true;
        } else {
          console.log(`❌ [DYNAMICS] Falha ao enviar como ${entidade}, tentando próxima...`);
        }
      } catch (error) {
        console.error(`❌ [DYNAMICS] Erro ao tentar ${entidade}:`, error);
        console.log(`❌ [DYNAMICS] Falha ao enviar como ${entidade}, tentando próxima...`);
      }
    }

    console.error(`❌ [DYNAMICS] Falha ao enviar cotação ${cotacao.id} em todas as entidades testadas`);
    return false;
  }

  /**
   * Busca todas as oportunidades (opportunities) no Dynamics 365
   */
  async listarOportunidades(): Promise<any[]> {
    try {
      console.log(`🔍 [DYNAMICS] Buscando oportunidades...`);
      
      const token = await this.getOAuthToken();
      const url = `${this.config.webApiEndpoint}/opportunities?$top=100`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar oportunidades: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ [DYNAMICS] ${data.value?.length || 0} oportunidades encontradas`);
      
      return data.value || [];
    } catch (error) {
      console.error('❌ [DYNAMICS] Erro ao listar oportunidades:', error);
      throw error;
    }
  }

  /**
   * Lista todas as entidades disponíveis no Dynamics (método direto)
   */
  async listarEntidadesDisponiveis(): Promise<string[]> {
    try {
      console.log(`🔍 [DYNAMICS] Listando entidades disponíveis...`);
      
      // Obter token OAuth
      const token = await this.getOAuthToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      };

      const baseUrl = this.config.webApiEndpoint;
      
      // Consultar o endpoint raiz que deve listar todas as entidades
      console.log(`🔍 [DYNAMICS] Consultando: ${baseUrl}`);
      const response = await fetch(baseUrl, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        console.error(`❌ [DYNAMICS] Erro ${response.status}:`, await response.text());
        return [];
      }

      const data = await response.json() as any;
      console.log(`📋 [DYNAMICS] Resposta do endpoint raiz:`, JSON.stringify(data, null, 2));
      
      // Extrair nomes das entidades da resposta
      const entidades: string[] = [];
      
      if (data.value && Array.isArray(data.value)) {
        // Se a resposta tem um array 'value'
        data.value.forEach((item: any) => {
          if (item.name) entidades.push(item.name);
          if (item.url) entidades.push(item.url);
        });
      } else if (typeof data === 'object') {
        // Se a resposta é um objeto, pegar as chaves
        Object.keys(data).forEach(key => {
          if (key !== '@odata.context') {
            entidades.push(key);
          }
        });
      }

      console.log(`📊 [DYNAMICS] Entidades encontradas: ${entidades.length}`);
      console.log(`📋 [DYNAMICS] Primeiras 10:`, entidades.slice(0, 10));

      return entidades;
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao listar entidades:`, error);
      return [];
    }
  }

  /**
   * Consulta entidades disponíveis no Dynamics para descobrir nomes corretos
   */
  async consultarEntidadesDisponiveis(): Promise<{
    entidades: string[];
    quotesRelated: string[];
    salesRelated: string[];
  }> {
    try {
      console.log(`🔍 [DYNAMICS] Consultando entidades disponíveis...`);
      console.log(`🔍 [DYNAMICS] Consultando metadados para descobrir entidades...`);
      
      // Obter token OAuth
      const token = await this.getOAuthToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/xml',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      };

      const metadataUrl = `${this.config.webApiEndpoint}/$metadata`;
      
      // Consultar metadados
      const response = await fetch(metadataUrl, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        console.error(`❌ [DYNAMICS] Erro ${response.status}:`, await response.text());
        return {
          entidades: [],
          quotesRelated: [],
          salesRelated: []
        };
      }

      const metadataXml = await response.text();
      console.log(`📋 [DYNAMICS] Metadados obtidos (${metadataXml.length} chars)`);

      // Extrair nomes das entidades usando regex simples
      const entityMatches = metadataXml.match(/EntitySet Name="([^"]+)"/g) || [];
      const quotesRelated: string[] = [];
      const salesRelated: string[] = [];
      const allEntities: string[] = [];

      entityMatches.forEach(match => {
        const entityName = match.match(/Name="([^"]+)"/)?.[1];
        if (entityName) {
          allEntities.push(entityName);
          const lowerName = entityName.toLowerCase();
          
          if (lowerName.includes('quote')) {
            quotesRelated.push(entityName);
          }
          
          if (lowerName.includes('sales') || lowerName.includes('lead') || lowerName.includes('opportunity')) {
            salesRelated.push(entityName);
          }
        }
      });

      console.log(`📋 [DYNAMICS] Entidades relacionadas a quotes:`, quotesRelated);
      console.log(`💼 [DYNAMICS] Entidades relacionadas a sales:`, salesRelated);
      console.log(`📊 [DYNAMICS] Total de entidades encontradas: ${allEntities.length}`);

      return {
        entidades: allEntities.slice(0, 50), // Primeiras 50 para não sobrecarregar
        quotesRelated,
        salesRelated
      };
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao consultar entidades:`, error);
      return {
        entidades: [],
        quotesRelated: [],
        salesRelated: []
      };
    }
  }

  /**
   * Consulta entidades padrão no Dynamics
   */
  async consultarEntidadesPadrao(): Promise<{
    accounts: any[];
    currencies: any[];
    pricelevels: any[];
  }> {
    try {
      console.log(`🔍 [DYNAMICS] Consultando entidades padrão...`);
      
      // Obter token OAuth
      const token = await this.getOAuthToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      };

      const baseUrl = this.config.webApiEndpoint;
      
      // Consultar accounts (primeiras 5)
      const accountsResponse = await fetch(`${baseUrl}/accounts?$top=5&$select=accountid,name`, {
        method: 'GET',
        headers
      });
      const accounts = accountsResponse.ok ? (await accountsResponse.json() as any).value || [] : [];
      console.log(`📋 [DYNAMICS] Accounts encontradas: ${accounts.length}`);

      // Consultar moedas (primeiras 5)
      const currenciesResponse = await fetch(`${baseUrl}/transactioncurrencies?$top=5&$select=transactioncurrencyid,currencyname,isocurrencycode`, {
        method: 'GET',
        headers
      });
      const currencies = currenciesResponse.ok ? (await currenciesResponse.json() as any).value || [] : [];
      console.log(`💰 [DYNAMICS] Moedas encontradas: ${currencies.length}`);

      // Consultar listas de preços (primeiras 5)
      const pricelevelsResponse = await fetch(`${baseUrl}/pricelevels?$top=5&$select=pricelevelid,name`, {
        method: 'GET',
        headers
      });
      const pricelevels = pricelevelsResponse.ok ? (await pricelevelsResponse.json() as any).value || [] : [];
      console.log(`💲 [DYNAMICS] Price levels encontrados: ${pricelevels.length}`);

      return {
        accounts,
        currencies,
        pricelevels
      };
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao consultar entidades padrão:`, error);
      return {
        accounts: [],
        currencies: [],
        pricelevels: []
      };
    }
  }

  /**
   * Obtém configurações atuais (sem dados sensíveis)
   */
  obterConfig(): Omit<DynamicsConfig, 'azureClientSecret'> {
    const { azureClientSecret, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Status da integração
   */
  async obterStatusIntegracao(): Promise<{
    configurado: boolean;
    conectado: boolean;
    ultimoTeste?: Date;
    config: any;
  }> {
    const configurado = !!(
      this.config.webApiEndpoint &&
      this.config.azureTenantId &&
      this.config.azureClientId &&
      this.config.azureClientSecret
    );

    let conectado = false;
    try {
      if (configurado) {
        conectado = await this.testarConexao();
      }
    } catch {
      conectado = false;
    }

    return {
      configurado,
      conectado,
      ultimoTeste: new Date(),
      config: this.obterConfig()
    };
  }

  /**
   * Obtém informações do ambiente Dynamics (método simplificado)
   */
  async obterInformacoesAmbiente(): Promise<any> {
    console.log(`ℹ️ [DYNAMICS] Método obterInformacoesAmbiente simplificado`);
    return {
      webApiEndpoint: this.config.webApiEndpoint,
      message: "Usando configuração simplificada - apenas Web API endpoint necessário",
      status: "active"
    };
  }
}

export default DynamicsIntegrationService;
