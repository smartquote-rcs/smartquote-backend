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
   * Envia dados para o Dynamics 365 e retorna o ID criado
   */
  private async enviarParaDynamics(entity: DynamicsEntity, entityName?: string): Promise<string | boolean> {
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
        
        // Extrair o ID do recurso criado do header OData-EntityId ou Location
        const entityIdHeader = response.headers.get('OData-EntityId') || response.headers.get('Location');
        if (entityIdHeader) {
          // Extrair o GUID do header (formato: .../<entity>(<guid>))
          const guidMatch = entityIdHeader.match(/\(([a-f0-9\-]+)\)/i);
          if (guidMatch && guidMatch[1]) {
            const entityId = guidMatch[1];
            console.log(`📋 [DYNAMICS] ID da entidade criada: ${entityId}`);
            return entityId;
          }
        }
        
        // 204 não retorna conteúdo, 201 pode retornar
        if (response.status === 204) {
          console.log(`📋 [DYNAMICS] Entidade criada sem retorno de dados (204 No Content)`);
          return true;
        } else {
          const result = await response.json() as any;
          console.log(`📋 [DYNAMICS] Entidade criada com retorno:`, JSON.stringify(result, null, 2));
          // Tentar extrair ID do resultado se disponível
          if (result && typeof result === 'object') {
            const idKey = Object.keys(result).find(key => key.toLowerCase().includes('id'));
            if (idKey && result[idKey]) {
              return result[idKey];
            }
          }
          return true;
        }
      }

      // Se chegou aqui, não era nem erro nem sucesso conhecido
      const result = await response.json() as any;
      console.log(`✅ [DYNAMICS] Resposta inesperada mas válida:`, JSON.stringify(result, null, 2));
      
      return true;
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro completo ao enviar dados:`, error);
      return false;
    }
  }

  /**
   * Processa uma cotação aprovada e tenta enviá-la para o Dynamics
   */

  private cotacoesProcessadas = new Set<number>();

  async processarCotacaoAprovada(cotacao: any): Promise<boolean> {
    // Verificar se já foi processada
    if (this.cotacoesProcessadas.has(cotacao.id)) {
      console.log(`⚠️ [DYNAMICS] Cotação ${cotacao.id} já foi processada, ignorando...`);
      return true;
    }
    
    this.cotacoesProcessadas.add(cotacao.id);
    console.log(`📋 [DYNAMICS] Processando cotação aprovada ID: ${cotacao.id}`);
      
    // Buscar itens da cotação para enriquecer os dados
    const cotacaoComItens = await this.buscarCotacaoComItens(cotacao.id);
    
    const entidade = 'quotes';
    const quotenumber = `SQ-${cotacao.id}`;
    
    // Verificar se a quote já existe no Dynamics
    console.log(`🔍 [DYNAMICS] Verificando se quote ${quotenumber} já existe...`);
    const quoteExistente = await this.buscarQuotePorNumero(quotenumber);
    
    if (quoteExistente) {
      console.log(`📝 [DYNAMICS] Quote ${quotenumber} já existe (ID: ${quoteExistente.quoteid}). Atualizando...`);
      
      // Atualizar quote existente
      const entity = this.transformCotacaoToDynamics(cotacaoComItens, entidade);
      const atualizado = await this.atualizarQuote(quoteExistente.quoteid, entity);
      
      if (atualizado) {
        console.log(`✅ [DYNAMICS] Quote ${quotenumber} atualizada com sucesso!`);
        
        // Enviar/atualizar os itens
        if (!cotacaoComItens.itens || cotacaoComItens.itens.length === 0) {
          console.warn(`⚠️ [DYNAMICS] Nenhum item encontrado para enviar!`);
        } else {
          console.log(`📦 [DYNAMICS] Enviando ${cotacaoComItens.itens.length} itens como quotedetails...`);
          const itensEnviados = await this.enviarQuoteDetails(quoteExistente.quoteid, cotacaoComItens.itens);
          if (itensEnviados) {
            console.log(`✅ [DYNAMICS] Todos os ${cotacaoComItens.itens.length} itens enviados com sucesso!`);
          } else {
            console.warn(`⚠️ [DYNAMICS] Alguns itens falharam ao enviar`);
          }
        }
        
        // Também criar/atualizar Opportunity
        await this.criarOpportunity(cotacaoComItens);
        
        return true;
      } else {
        console.error(`❌ [DYNAMICS] Falha ao atualizar quote no Dynamics`);
        return false;
      }
    }
    
    // Quote não existe, criar nova
    console.log(`🎯 [DYNAMICS] Criando nova quote ${quotenumber}...`);
    
    try {
      const entity = this.transformCotacaoToDynamics(cotacaoComItens, entidade);
      const resultado = await this.enviarParaDynamics(entity, entidade);

      if (resultado) {
        console.log(`✅ [DYNAMICS] Cotação ${cotacao.id} enviada como ${entidade}!`);
        
        // Se temos um ID, enviar os itens (quotedetails)
        if (typeof resultado === 'string') {
          console.log(`📦 [DYNAMICS] Quote ID recebido: ${resultado}`);
          console.log(`📦 [DYNAMICS] Enviando ${cotacaoComItens.itens?.length || 0} itens como quotedetails...`);
          
          if (!cotacaoComItens.itens || cotacaoComItens.itens.length === 0) {
            console.warn(`⚠️ [DYNAMICS] Nenhum item encontrado para enviar!`);
          } else {
            const itensEnviados = await this.enviarQuoteDetails(resultado, cotacaoComItens.itens);
            if (itensEnviados) {
              console.log(`✅ [DYNAMICS] Todos os ${cotacaoComItens.itens.length} itens enviados com sucesso!`);
            } else {
              console.warn(`⚠️ [DYNAMICS] Alguns itens falharam ao enviar`);
            }
          }
        } else {
          console.warn(`⚠️ [DYNAMICS] Quote criada mas ID não foi retornado. Itens não podem ser adicionados.`);
        }
        
        // Também criar como Opportunity
        await this.criarOpportunity(cotacaoComItens);
        
        return true;
      } else {
        console.error(`❌ [DYNAMICS] Falha ao criar quote no Dynamics`);
        return false;
      }
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao enviar como ${entidade}:`, error);
      return false;
    }
    
    console.log(`❌ [DYNAMICS] Falha ao enviar cotação ${cotacao.id}`);
    
    // Tentar descobrir entidades disponíveis
    try {
      console.log(`🔍 [DYNAMICS] Consultando entidades disponíveis...`);
      await this.consultarEntidadesDisponiveis();
    } catch (err) {
      console.error('Erro ao consultar entidades:', err);
    }
    
    return false;
  }

  /**
   * Processa uma cotação (criada) e tenta enviá-la para o Dynamics
   */
  async processarCotacao(cotacao: any): Promise<boolean> {
    console.log(`📋 [DYNAMICS] Processando cotação ID: ${cotacao.id}`);
    
    // Buscar itens da cotação para enriquecer os dados
    const cotacaoComItens = await this.buscarCotacaoComItens(cotacao.id);
    
    // Tentar criar apenas como Quote (para ter produtos/preços detalhados)
    const entidade = 'quotes';
    
    console.log(`🎯 [DYNAMICS] Criando como ${entidade} com itens detalhados...`);
    
    try {
      const entity = this.transformCotacaoToDynamics(cotacaoComItens, entidade);
      console.log(`📤 [DYNAMICS] Dados da quote:`, JSON.stringify(entity, null, 2));
      
      const resultado = await this.enviarParaDynamics(entity, entidade);

      if (resultado) {
        console.log(`✅ [DYNAMICS] Cotação ${cotacao.id} enviada como ${entidade}!`);
        
        // Se temos um ID, enviar os itens (quotedetails)
        if (typeof resultado === 'string') {
          console.log(`📦 [DYNAMICS] Quote ID recebido: ${resultado}`);
          console.log(`📦 [DYNAMICS] Enviando ${cotacaoComItens.itens?.length || 0} itens como quotedetails...`);
          
          if (!cotacaoComItens.itens || cotacaoComItens.itens.length === 0) {
            console.warn(`⚠️ [DYNAMICS] Nenhum item encontrado para enviar!`);
          } else {
            const itensEnviados = await this.enviarQuoteDetails(resultado, cotacaoComItens.itens);
            if (itensEnviados) {
              console.log(`✅ [DYNAMICS] Todos os ${cotacaoComItens.itens.length} itens enviados com sucesso!`);
            } else {
              console.warn(`⚠️ [DYNAMICS] Alguns itens falharam ao enviar`);
            }
          }
        } else {
          console.warn(`⚠️ [DYNAMICS] Quote criada mas ID não foi retornado. Itens não podem ser adicionados.`);
        }
        
        return true;
      } else {
        console.error(`❌ [DYNAMICS] Falha ao criar quote no Dynamics`);
        return false;
      }
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao enviar como ${entidade}:`, error);
      return false;
    }
    
    console.log(`❌ [DYNAMICS] Falha ao enviar cotação ${cotacao.id}`);
    
    // Tentar descobrir entidades disponíveis
    try {
      console.log(`🔍 [DYNAMICS] Consultando entidades disponíveis...`);
      await this.consultarEntidadesDisponiveis();
    } catch (err) {
      console.error('Erro ao consultar entidades:', err);
    }
    
    return false;
  }

  /**
   * Cria uma Opportunity no Dynamics para a cotação
   */
  private async criarOpportunity(cotacao: any): Promise<boolean> {
    try {
      const opportunityName = `Oportunidade #${cotacao.id} - SmartQuote`;
      
      console.log(`💼 [DYNAMICS] Verificando se Opportunity "${opportunityName}" já existe...`);
      const oppExistente = await this.buscarOpportunityPorNome(opportunityName);
      
      if (oppExistente) {
        console.log(`📝 [DYNAMICS] Opportunity já existe (ID: ${oppExistente.opportunityid}). Atualizando...`);
        
        const opportunityData = this.transformCotacaoToDynamics(cotacao, 'opportunities');
        const atualizado = await this.atualizarOpportunity(oppExistente.opportunityid, opportunityData);
        
        if (atualizado) {
          console.log(`✅ [DYNAMICS] Opportunity atualizada com sucesso!`);
          return true;
        } else {
          console.warn(`⚠️ [DYNAMICS] Falha ao atualizar Opportunity`);
          return false;
        }
      }
      
      console.log(`💼 [DYNAMICS] Criando nova Opportunity para cotação ${cotacao.id}...`);
      
      const opportunityData = this.transformCotacaoToDynamics(cotacao, 'opportunities');
      const resultado = await this.enviarParaDynamics(opportunityData, 'opportunities');
      
      if (resultado) {
        console.log(`✅ [DYNAMICS] Opportunity criada com sucesso para cotação ${cotacao.id}!`);
        return true;
      } else {
        console.warn(`⚠️ [DYNAMICS] Falha ao criar Opportunity para cotação ${cotacao.id}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao criar Opportunity:`, error);
      return false;
    }
  }

  /**
   * Busca uma opportunity no Dynamics pelo nome
   */
  private async buscarOpportunityPorNome(name: string): Promise<any | null> {
    try {
      const token = await this.getOAuthToken();
      const url = `${this.config.webApiEndpoint}/opportunities?$filter=name eq '${name}'&$select=opportunityid,name`;
      
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
        console.error(`❌ [DYNAMICS] Erro ao buscar opportunity ${name}:`, response.status);
        return null;
      }

      const data = await response.json() as { value?: any[] };
      
      if (data.value && data.value.length > 0) {
        console.log(`✅ [DYNAMICS] Opportunity encontrada`);
        return data.value[0];
      }
      
      return null;
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao buscar opportunity:`, error);
      return null;
    }
  }

  /**
   * Atualiza uma opportunity existente no Dynamics
   */
  private async atualizarOpportunity(opportunityId: string, dados: any): Promise<boolean> {
    try {
      const token = await this.getOAuthToken();
      const url = `${this.config.webApiEndpoint}/opportunities(${opportunityId})`;
      
      // Remover campos que não podem ser atualizados
      const { name, ...dadosAtualizacao } = dados;
      
      console.log(`🔄 [DYNAMICS] Atualizando opportunity ${opportunityId}...`);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dadosAtualizacao)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [DYNAMICS] Erro ao atualizar opportunity: ${response.status} - ${errorText}`);
        return false;
      }

      console.log(`✅ [DYNAMICS] Opportunity atualizada com sucesso`);
      return true;
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao atualizar opportunity:`, error);
      return false;
    }
  }

  /**
   * Busca uma quote no Dynamics pelo número (quotenumber)
   */
  private async buscarQuotePorNumero(quotenumber: string): Promise<any | null> {
    try {
      const token = await this.getOAuthToken();
      const url = `${this.config.webApiEndpoint}/quotes?$filter=quotenumber eq '${quotenumber}'&$select=quoteid,quotenumber`;
      
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
        console.error(`❌ [DYNAMICS] Erro ao buscar quote ${quotenumber}:`, response.status);
        return null;
      }

      const data = await response.json() as { value?: any[] };
      
      if (data.value && data.value.length > 0) {
        console.log(`✅ [DYNAMICS] Quote ${quotenumber} encontrada`);
        return data.value[0];
      }
      
      return null;
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao buscar quote:`, error);
      return null;
    }
  }

  /**
   * Atualiza uma quote existente no Dynamics
   */
  private async atualizarQuote(quoteId: string, dados: any): Promise<boolean> {
    try {
      const token = await this.getOAuthToken();
      const url = `${this.config.webApiEndpoint}/quotes(${quoteId})`;
      
      // Remover campos que não podem ser atualizados
      const { quotenumber, ...dadosAtualizacao } = dados;
      
      console.log(`🔄 [DYNAMICS] Atualizando quote ${quoteId}...`);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dadosAtualizacao)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [DYNAMICS] Erro ao atualizar quote: ${response.status} - ${errorText}`);
        return false;
      }

      console.log(`✅ [DYNAMICS] Quote atualizada com sucesso`);
      return true;
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao atualizar quote:`, error);
      return false;
    }
  }

  /**
   * Envia os itens da cotação como quotedetails após criar a quote
   */
  private async enviarQuoteDetails(quoteId: string, itens: any[]): Promise<boolean> {
    if (!itens || itens.length === 0) {
      console.log(`⚠️ [DYNAMICS] Nenhum item para enviar como quotedetails`);
      return true;
    }

    console.log(`📦 [DYNAMICS] Enviando ${itens.length} itens como quotedetails para quote ${quoteId}`);

    let sucessos = 0;
    let falhas = 0;

    for (let index = 0; index < itens.length; index++) {
      const item = itens[index];
      try {
          // Se item_preco não existe mas tem produto_id, buscar do produto
        let precoUnitario = this.extrairPreco(item);
        
        if (precoUnitario === 0 && item.produto_id) {
          const precoDoProduto = await this.buscarPrecoDoProduto(item.produto_id);
          if (precoDoProduto > 0) {
            precoUnitario = precoDoProduto;
          }
        }
        
        const quantidade = item.quantidade || 1;
        const valorTotal = precoUnitario * quantidade;

        const quoteDetail = {
          'quoteid@odata.bind': `/quotes(${quoteId})`,
          productdescription: item.item_nome || item.pedido || 'Produto',
          quantity: quantidade,
          priceperunit: precoUnitario,
          baseamount: valorTotal,
          extendedamount: valorTotal,
          manualdiscountamount: 0,
          // Se tiver product ID do Dynamics, adicione:
          // 'productid@odata.bind': `/products(${item.dynamics_product_id})`
        };

        const resultado = await this.enviarParaDynamics(quoteDetail, 'quotedetails');
        
        if (resultado) {
          sucessos++;
        } else {
          falhas++;
          console.error(`❌ [DYNAMICS] Falha ao enviar item "${item.item_nome}"`);
        }
      } catch (error) {
        falhas++;
        console.error(`❌ [DYNAMICS] Erro ao enviar item:`, error);
      }
    }

    console.log(`📊 [DYNAMICS] Resumo: ${sucessos} sucessos, ${falhas} falhas de ${itens.length} itens`);
    return falhas === 0;
  }

  /**
   * Busca o preço de um produto pelo ID
   */
  private async buscarPrecoDoProduto(produtoId: number): Promise<number> {
    try {
      const supabase = require('../infra/supabase/connect').default;
      const { data, error } = await supabase
        .from('produtos')
        .select('preco')
        .eq('id', produtoId)
        .single();
      
      if (error || !data) {
        console.warn(`⚠️ [DYNAMICS] Erro ao buscar preço do produto ${produtoId}`);
        return 0;
      }
      
      const preco = Number(data.preco);
      return isNaN(preco) ? 0 : preco;
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao buscar produto:`, error);
      return 0;
    }
  }

  /**
   * Extrai o preço de um item de cotação
   */
  private extrairPreco(item: any): number {
    // Tentar diferentes campos onde o preço pode estar (em ordem de prioridade)
    if (item.item_preco !== null && item.item_preco !== undefined && item.item_preco !== '') {
      const preco = Number(item.item_preco);
      if (!isNaN(preco) && preco > 0) return preco;
    }
    
    if (item.preco_unitario) {
      const preco = Number(item.preco_unitario);
      if (!isNaN(preco)) return preco;
    }
    
    if (item.preco) {
      const preco = Number(item.preco);
      if (!isNaN(preco)) return preco;
    }
    
    if (item.valor_unitario) {
      const preco = Number(item.valor_unitario);
      if (!isNaN(preco)) return preco;
    }
    
    if (item.valor) {
      const preco = Number(item.valor);
      if (!isNaN(preco)) return preco;
    }
    
    if (item.price) {
      const preco = Number(item.price);
      if (!isNaN(preco)) return preco;
    }
    
    // Se tiver valor total e quantidade, calcular
    if (item.valor_total && item.quantidade) {
      const preco = Number(item.valor_total) / Number(item.quantidade);
      if (!isNaN(preco)) return preco;
    }
    
    // Último recurso: retornar 0
    console.warn(`⚠️ [DYNAMICS] Não foi possível extrair preço do item. Campos disponíveis:`, Object.keys(item));
    return 0;
  }

  /**
   * Busca a cotação junto com seus itens para ter dados mais ricos
   */
  private async buscarCotacaoComItens(cotacaoId: number): Promise<any> {
    try {
      // Importar supabase para buscar os dados
      const supabase = require('../infra/supabase/connect').default;
      
      // Buscar dados da cotação principal
      const { data: cotacao, error: errorCotacao } = await supabase
        .from('cotacoes')
        .select('*')
        .eq('id', cotacaoId)
        .single();
      
      if (errorCotacao) {
        console.warn(`⚠️ [DYNAMICS] Erro ao buscar cotação ${cotacaoId}:`, errorCotacao);
        return { id: cotacaoId, itens: [], orcamento_geral: 0 };
      }
      
      // Buscar itens da cotação
      const { data: itens, error: errorItens } = await supabase
        .from('cotacoes_itens')
        .select('*')
        .eq('cotacao_id', cotacaoId);
      
      if (errorItens) {
        console.warn(`⚠️ [DYNAMICS] Erro ao buscar itens da cotação ${cotacaoId}:`, errorItens);
      }
      
      console.log(`📦 [DYNAMICS] Cotação ${cotacaoId} - Orçamento: R$ ${cotacao.orcamento_geral || 0} - Itens: ${itens?.length || 0}`);
      
      return {
        ...cotacao, // Todos os dados da cotação (incluindo orcamento_geral)
        itens: itens || [],
        customerNeed: this.montarCustomerNeed(itens || [])
      };
      
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao buscar cotação com itens:`, error);
      return { id: cotacaoId, itens: [], orcamento_geral: 0 };
    }
  }

  /**
   * Monta a descrição customer need baseada nos pedidos dos itens
   */
  private montarCustomerNeed(itens: any[]): string {
    if (!itens || itens.length === 0) {
      return 'Cotação aprovada sem itens específicos';
    }
    
    const pedidos = itens
      .filter(item => item.pedido && item.pedido.trim())
      .map(item => `• ${item.pedido}`)
      .join('\n');
    
    const itensComNome = itens
      .filter(item => item.item_nome && item.item_nome.trim())
      .map(item => `• ${item.item_nome}${item.quantidade ? ` (Qtd: ${item.quantidade})` : ''}`)
      .join('\n');
    
    let description = 'NECESSIDADES DO CLIENTE:\n';
    
    if (pedidos) {
      description += pedidos + '\n\n';
    }
    
    if (itensComNome) {
      description += 'ITENS COTADOS:\n' + itensComNome;
    }
    
    return description;
  }

  /**
   * Transforma uma cotação (com itens) em formato para Dynamics
   */
  private transformCotacaoToDynamics(cotacao: any, entityName: string): DynamicsEntity {
    console.log(`🔄 [DYNAMICS] Transformando cotação ${cotacao.id} para entidade ${entityName}`);
    
    const baseDescription = `Cotação gerada no SmartQuote - ID ${cotacao.id}`;
    const customerNeed = cotacao.customerNeed || this.extrairPedidosPrincipais(cotacao.itens);

    switch (entityName) {
      case 'quotes':
        return {
          name: `Cotação #${cotacao.id} - SmartQuote`,
          description: baseDescription,
          quotenumber: `SQ-${cotacao.id}`,
          totalamount: cotacao.orcamento_geral || 0,
          statecode: 0,
          statuscode: 1,
          // Adicione outros campos específicos de quotes aqui, se necessário
        };
        
      case 'opportunities':
        return {
          name: `Oportunidade #${cotacao.id} - SmartQuote`,
          description: baseDescription,
          customerneed: customerNeed,
          estimatedvalue: cotacao.orcamento_geral || 0,
          statecode: 0,
          statuscode: 1,
          // Exemplos de campos adicionais (adicione conforme necessário e conforme o Dynamics aceita):
          // parentaccountid: cotacao.parentaccountid,
          // parentcontactid: cotacao.parentcontactid,
          // opportunityratingcode: cotacao.opportunityratingcode,
          // closeprobability: cotacao.closeprobability,
          // estimatedclosedate: cotacao.estimatedclosedate,
          // campaignid: cotacao.campaignid,
          // transactioncurrencyid: cotacao.transactioncurrencyid,
          // ...outros campos customizados...
        };
        
      case 'incidents':
        return {
          title: `Ticket #${cotacao.id} - SmartQuote`,
          description: baseDescription,
          ticketnumber: `SQ-${cotacao.id}`,
          prioritycode: 2,
          severitycode: 1,
          statecode: 0,
          statuscode: 1
        };
        
      case 'leads':
        return {
          fullname: `Lead SmartQuote #${cotacao.id}`,
          subject: `Lead da cotação #${cotacao.id}`,
          description: baseDescription,
          firstname: 'SmartQuote',
          lastname: `Lead ${cotacao.id}`,
          companyname: 'SmartQuote System',
          budgetamount: cotacao.orcamento_geral || 0,
          statecode: 0,
          statuscode: 1
        };
        
      default:
        return {
          name: `Cotação #${cotacao.id} - SmartQuote`,
          description: baseDescription
        };
    }
  }

  /**
   * Extrai os pedidos principais dos itens de forma concisa para o campo customerneed
   */
  private extrairPedidosPrincipais(itens: any[]): string {
    if (!itens || itens.length === 0) {
      return 'Customer needs high-quality products and services to meet business requirements.';
    }
    
    // Buscar pedidos únicos e formatá-los de forma concisa
    const pedidosUnicos = [...new Set(
      itens
        .filter(item => item.pedido && item.pedido.trim())
        .map(item => item.pedido.trim())
    )];
    
    if (pedidosUnicos.length === 0) {
      // Se não há pedidos específicos, criar baseado nos itens
      const itensNomes = itens
        .filter(item => item.item_nome && item.item_nome.trim())
        .slice(0, 3) // Pegar apenas os 3 primeiros
        .map(item => item.item_nome.trim());
      
      if (itensNomes.length > 0) {
        return `Customer needs ${itensNomes.join(', ')} to enhance business operations.`;
      }
    }
    
    // Juntar pedidos de forma legível
    if (pedidosUnicos.length === 1) {
      return pedidosUnicos[0];
    } else if (pedidosUnicos.length <= 3) {
      return pedidosUnicos.join('. ') + '.';
    } else {
      // Se há muitos pedidos, resumir
      return pedidosUnicos.slice(0, 2).join('. ') + ` and ${pedidosUnicos.length - 2} additional requirements.`;
    }
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

      const data = await response.json() as { value?: any[] };
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
