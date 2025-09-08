"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DynamicsIntegrationService {
    config;
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
    validateConfig() {
        const requiredFields = [
            'webApiEndpoint',
            'azureTenantId',
            'azureClientId',
            'azureClientSecret'
        ];
        const missingFields = requiredFields.filter(field => !this.config[field]);
        if (missingFields.length > 0) {
            console.warn(`⚠️ [DYNAMICS] Configurações essenciais faltando: ${missingFields.join(', ')}`);
        }
    }
    /**
     * Obtém token OAuth do Azure AD para autenticação no Dynamics
     */
    async getOAuthToken() {
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
            const tokenData = await response.json();
            console.log(`✅ [DYNAMICS] Token OAuth obtido com sucesso`);
            return tokenData.access_token;
        }
        catch (error) {
            console.error(`❌ [DYNAMICS] Erro ao obter token OAuth:`, error);
            throw error;
        }
    }
    /**
     * Testa a conexão com Dynamics 365
     */
    async testarConexao() {
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
            }
            else {
                const errorText = await response.text();
                console.error(`❌ [DYNAMICS] Falha na conexão: ${response.status} - ${errorText}`);
                return false;
            }
        }
        catch (error) {
            console.error(`❌ [DYNAMICS] Erro ao testar conexão:`, error);
            return false;
        }
    }
    /**
     * Envia dados para o Dynamics 365
     */
    async enviarParaDynamics(entity, entityName) {
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
                }
                else {
                    const result = await response.json();
                    console.log(`📋 [DYNAMICS] Entidade criada com retorno:`, JSON.stringify(result, null, 2));
                    return true;
                }
            }
            // Se chegou aqui, não era nem erro nem sucesso conhecido
            const result = await response.json();
            console.log(`✅ [DYNAMICS] Resposta inesperada mas válida:`, JSON.stringify(result, null, 2));
            return true;
        }
        catch (error) {
            console.error(`❌ [DYNAMICS] Erro completo ao enviar dados:`, error);
            return false;
        }
    }
    /**
     * Processa uma cotação aprovada e tenta enviá-la para o Dynamics
     */
    cotacoesProcessadas = new Set();
    async processarCotacaoAprovada(cotacao) {
        // Verificar se já foi processada
        if (this.cotacoesProcessadas.has(cotacao.id)) {
            console.log(`⚠️ [DYNAMICS] Cotação ${cotacao.id} já foi processada, ignorando...`);
            return true;
        }
        this.cotacoesProcessadas.add(cotacao.id);
        console.log(`📋 [DYNAMICS] Processando cotação aprovada ID: ${cotacao.id}`);
        // Buscar itens da cotação para enriquecer os dados
        const cotacaoComItens = await this.buscarCotacaoComItens(cotacao.id);
        const entidadesParaTestar = ['quotes', 'opportunities', 'incidents', 'leads'];
        for (const entidade of entidadesParaTestar) {
            console.log(`🎯 [DYNAMICS] Tentando enviar como ${entidade}...`);
            try {
                const entity = this.transformCotacaoToDynamics(cotacaoComItens, entidade);
                const resultado = await this.enviarParaDynamics(entity, entidade);
                if (resultado) {
                    console.log(`✅ [DYNAMICS] Cotação ${cotacao.id} enviada com sucesso como ${entidade}!`);
                    return true;
                }
            }
            catch (error) {
                console.log(`❌ [DYNAMICS] Falha ao enviar como ${entidade}, tentando próxima...`);
                continue;
            }
        }
        console.log(`❌ [DYNAMICS] Falha ao enviar cotação ${cotacao.id} em todas as entidades testadas`);
        // Tentar descobrir entidades disponíveis
        try {
            console.log(`🔍 [DYNAMICS] Consultando entidades disponíveis...`);
            await this.consultarEntidadesDisponiveis();
        }
        catch (err) {
            console.error('Erro ao consultar entidades:', err);
        }
        return false;
    }
    /**
     * Busca a cotação junto com seus itens para ter dados mais ricos
     */
    async buscarCotacaoComItens(cotacaoId) {
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
        }
        catch (error) {
            console.error(`❌ [DYNAMICS] Erro ao buscar cotação com itens:`, error);
            return { id: cotacaoId, itens: [], orcamento_geral: 0 };
        }
    }
    /**
     * Monta a descrição customer need baseada nos pedidos dos itens
     */
    montarCustomerNeed(itens) {
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
    transformCotacaoToDynamics(cotacao, entityName) {
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
    extrairPedidosPrincipais(itens) {
        if (!itens || itens.length === 0) {
            return 'Customer needs high-quality products and services to meet business requirements.';
        }
        // Buscar pedidos únicos e formatá-los de forma concisa
        const pedidosUnicos = [...new Set(itens
                .filter(item => item.pedido && item.pedido.trim())
                .map(item => item.pedido.trim()))];
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
        }
        else if (pedidosUnicos.length <= 3) {
            return pedidosUnicos.join('. ') + '.';
        }
        else {
            // Se há muitos pedidos, resumir
            return pedidosUnicos.slice(0, 2).join('. ') + ` and ${pedidosUnicos.length - 2} additional requirements.`;
        }
    }
    /**
     * Busca todas as oportunidades (opportunities) no Dynamics 365
     */
    async listarOportunidades() {
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
        }
        catch (error) {
            console.error('❌ [DYNAMICS] Erro ao listar oportunidades:', error);
            throw error;
        }
    }
    /**
     * Lista todas as entidades disponíveis no Dynamics (método direto)
     */
    async listarEntidadesDisponiveis() {
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
            const data = await response.json();
            console.log(`📋 [DYNAMICS] Resposta do endpoint raiz:`, JSON.stringify(data, null, 2));
            // Extrair nomes das entidades da resposta
            const entidades = [];
            if (data.value && Array.isArray(data.value)) {
                // Se a resposta tem um array 'value'
                data.value.forEach((item) => {
                    if (item.name)
                        entidades.push(item.name);
                    if (item.url)
                        entidades.push(item.url);
                });
            }
            else if (typeof data === 'object') {
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
        }
        catch (error) {
            console.error(`❌ [DYNAMICS] Erro ao listar entidades:`, error);
            return [];
        }
    }
    /**
     * Consulta entidades disponíveis no Dynamics para descobrir nomes corretos
     */
    async consultarEntidadesDisponiveis() {
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
            const quotesRelated = [];
            const salesRelated = [];
            const allEntities = [];
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
        }
        catch (error) {
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
    async consultarEntidadesPadrao() {
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
            const accounts = accountsResponse.ok ? (await accountsResponse.json()).value || [] : [];
            console.log(`📋 [DYNAMICS] Accounts encontradas: ${accounts.length}`);
            // Consultar moedas (primeiras 5)
            const currenciesResponse = await fetch(`${baseUrl}/transactioncurrencies?$top=5&$select=transactioncurrencyid,currencyname,isocurrencycode`, {
                method: 'GET',
                headers
            });
            const currencies = currenciesResponse.ok ? (await currenciesResponse.json()).value || [] : [];
            console.log(`💰 [DYNAMICS] Moedas encontradas: ${currencies.length}`);
            // Consultar listas de preços (primeiras 5)
            const pricelevelsResponse = await fetch(`${baseUrl}/pricelevels?$top=5&$select=pricelevelid,name`, {
                method: 'GET',
                headers
            });
            const pricelevels = pricelevelsResponse.ok ? (await pricelevelsResponse.json()).value || [] : [];
            console.log(`💲 [DYNAMICS] Price levels encontrados: ${pricelevels.length}`);
            return {
                accounts,
                currencies,
                pricelevels
            };
        }
        catch (error) {
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
    obterConfig() {
        const { azureClientSecret, ...safeConfig } = this.config;
        return safeConfig;
    }
    /**
     * Status da integração
     */
    async obterStatusIntegracao() {
        const configurado = !!(this.config.webApiEndpoint &&
            this.config.azureTenantId &&
            this.config.azureClientId &&
            this.config.azureClientSecret);
        let conectado = false;
        try {
            if (configurado) {
                conectado = await this.testarConexao();
            }
        }
        catch {
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
    async obterInformacoesAmbiente() {
        console.log(`ℹ️ [DYNAMICS] Método obterInformacoesAmbiente simplificado`);
        return {
            webApiEndpoint: this.config.webApiEndpoint,
            message: "Usando configuração simplificada - apenas Web API endpoint necessário",
            status: "active"
        };
    }
}
exports.default = DynamicsIntegrationService;
//# sourceMappingURL=DynamicsIntegrationService.js.map