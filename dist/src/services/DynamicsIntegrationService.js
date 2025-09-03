"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DynamicsIntegrationService {
    config;
    constructor() {
        this.config = {
            organizationId: process.env.DYNAMICS_ORGANIZATION_ID || '',
            environmentId: process.env.DYNAMICS_ENVIRONMENT_ID || '',
            webApiEndpoint: process.env.DYNAMICS_WEB_API_ENDPOINT || '',
            discoveryEndpoint: process.env.DYNAMICS_DISCOVERY_ENDPOINT || '',
            accessToken: process.env.DYNAMICS_ACCESS_TOKEN || ''
        };
        this.validateConfig();
    }
    /**
     * Valida se todas as configurações necessárias estão presentes
     */
    validateConfig() {
        const requiredFields = [
            'organizationId',
            'environmentId',
            'webApiEndpoint',
            'discoveryEndpoint'
        ];
        const missingFields = requiredFields.filter(field => !this.config[field]);
        if (missingFields.length > 0) {
            console.warn(`⚠️ [DYNAMICS] Configurações faltando: ${missingFields.join(', ')}`);
        }
    }
    /**
     * Transforma dados da cotação para formato do Dynamics
     */
    transformCotacaoToDynamics(cotacao) {
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
    async sendToDynamics(entity) {
        try {
            const url = `${this.config.webApiEndpoint}/quotes`; // Ajuste a entidade conforme necessário
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0'
            };
            // Adicionar token de autenticação se disponível
            if (this.config.accessToken) {
                headers['Authorization'] = `Bearer ${this.config.accessToken}`;
            }
            console.log(`🔄 [DYNAMICS] Enviando dados para: ${url}`);
            console.log(`📊 [DYNAMICS] Payload:`, JSON.stringify(entity, null, 2));
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(entity)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            const result = await response.json();
            console.log(`✅ [DYNAMICS] Dados enviados com sucesso. ID: ${result?.id || 'N/A'}`);
            return true;
        }
        catch (error) {
            console.error(`❌ [DYNAMICS] Erro ao enviar dados:`, error);
            return false;
        }
    }
    /**
     * Processa cotação aprovada e envia para Dynamics
     */
    async processarCotacaoAprovada(cotacao) {
        try {
            console.log(`📋 [DYNAMICS] Processando cotação aprovada ID: ${cotacao.id}`);
            // Verificar se a cotação está realmente aprovada
            if (!cotacao.aprovacao) {
                console.warn(`⚠️ [DYNAMICS] Cotação ${cotacao.id} não está aprovada. Ignorando envio.`);
                return false;
            }
            // Transformar dados para formato Dynamics
            const dynamicsEntity = this.transformCotacaoToDynamics(cotacao);
            // Enviar para Dynamics
            const success = await this.sendToDynamics(dynamicsEntity);
            if (success) {
                console.log(`🎉 [DYNAMICS] Cotação ${cotacao.id} enviada com sucesso para Dynamics!`);
            }
            else {
                console.error(`💥 [DYNAMICS] Falha ao enviar cotação ${cotacao.id} para Dynamics`);
            }
            return success;
        }
        catch (error) {
            console.error(`❌ [DYNAMICS] Erro ao processar cotação ${cotacao.id}:`, error);
            return false;
        }
    }
    /**
     * Testa a conexão com Dynamics
     */
    async testarConexao() {
        try {
            console.log(`🔍 [DYNAMICS] Testando conexão com Dynamics...`);
            console.log(`🔍 [DYNAMICS] Config atual:`, {
                organizationId: this.config.organizationId,
                environmentId: this.config.environmentId,
                webApiEndpoint: this.config.webApiEndpoint,
                discoveryEndpoint: this.config.discoveryEndpoint,
                hasToken: !!this.config.accessToken
            });
            const url = `${this.config.webApiEndpoint}/$metadata`;
            console.log(`🔍 [DYNAMICS] Testando URL: ${url}`);
            const headers = {
                'Accept': 'application/xml'
            };
            if (this.config.accessToken) {
                headers['Authorization'] = `Bearer ${this.config.accessToken}`;
                console.log(`🔍 [DYNAMICS] Token configurado: ${this.config.accessToken.substring(0, 50)}...`);
            }
            else {
                console.warn(`⚠️ [DYNAMICS] Nenhum token de acesso configurado!`);
            }
            console.log(`🔍 [DYNAMICS] Headers:`, headers);
            const response = await fetch(url, {
                method: 'GET',
                headers
            });
            console.log(`🔍 [DYNAMICS] Response status: ${response.status}`);
            console.log(`🔍 [DYNAMICS] Response headers:`, Object.fromEntries(response.headers.entries()));
            if (response.ok) {
                console.log(`✅ [DYNAMICS] Conexão com Dynamics estabelecida com sucesso!`);
                return true;
            }
            else {
                const errorBody = await response.text();
                console.error(`❌ [DYNAMICS] Falha na conexão: HTTP ${response.status}`);
                console.error(`❌ [DYNAMICS] Response body:`, errorBody);
                return false;
            }
        }
        catch (error) {
            console.error(`❌ [DYNAMICS] Erro ao testar conexão:`, error);
            console.error(`❌ [DYNAMICS] Tipo do erro:`, error instanceof Error ? error.name : typeof error);
            console.error(`❌ [DYNAMICS] Mensagem do erro:`, error instanceof Error ? error.message : error);
            return false;
        }
    }
    /**
     * Obtém informações de descoberta do ambiente
     */
    async obterInformacoesAmbiente() {
        try {
            console.log(`🔍 [DYNAMICS] Obtendo informações do ambiente...`);
            const response = await fetch(this.config.discoveryEndpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                console.log(`📋 [DYNAMICS] Informações do ambiente obtidas:`, data);
                return data;
            }
            else {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
        }
        catch (error) {
            console.error(`❌ [DYNAMICS] Erro ao obter informações do ambiente:`, error);
            return null;
        }
    }
    /**
     * Atualiza configurações do Dynamics
     */
    atualizarConfig(novaConfig) {
        this.config = { ...this.config, ...novaConfig };
        console.log(`🔧 [DYNAMICS] Configurações atualizadas`);
        this.validateConfig();
    }
    /**
     * Obtém configurações atuais (sem token por segurança)
     */
    obterConfig() {
        const { accessToken, ...safeConfig } = this.config;
        return safeConfig;
    }
}
exports.default = new DynamicsIntegrationService();
//# sourceMappingURL=DynamicsIntegrationService.js.map