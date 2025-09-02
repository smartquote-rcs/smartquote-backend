import { CotacaoDTO } from '../models/Cotacao';

interface DynamicsConfig {
  organizationId: string;
  environmentId: string;
  webApiEndpoint: string;
  discoveryEndpoint: string;
  accessToken?: string;
}

interface DynamicsEntity {
  // Estrutura base para entidades do Dynamics
  [key: string]: any;
}

class DynamicsIntegrationService {
  private config: DynamicsConfig;

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
  private validateConfig(): void {
    const requiredFields = [
      'organizationId',
      'environmentId', 
      'webApiEndpoint',
      'discoveryEndpoint'
    ];

    const missingFields = requiredFields.filter(field => !this.config[field as keyof DynamicsConfig]);
    
    if (missingFields.length > 0) {
      console.warn(`⚠️ [DYNAMICS] Configurações faltando: ${missingFields.join(', ')}`);
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
  private async sendToDynamics(entity: DynamicsEntity): Promise<boolean> {
    try {
      const url = `${this.config.webApiEndpoint}/quotes`; // Ajuste a entidade conforme necessário
      
      const headers: Record<string, string> = {
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
      console.log(`✅ [DYNAMICS] Dados enviados com sucesso. ID: ${(result as any)?.id || 'N/A'}`);
      
      return true;
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao enviar dados:`, error);
      return false;
    }
  }

  /**
   * Processa cotação aprovada e envia para Dynamics
   */
  async processarCotacaoAprovada(cotacao: CotacaoDTO): Promise<boolean> {
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
      } else {
        console.error(`💥 [DYNAMICS] Falha ao enviar cotação ${cotacao.id} para Dynamics`);
      }

      return success;
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao processar cotação ${cotacao.id}:`, error);
      return false;
    }
  }

  /**
   * Testa a conexão com Dynamics
   */
  async testarConexao(): Promise<boolean> {
    try {
      console.log(`🔍 [DYNAMICS] Testando conexão com Dynamics...`);
      
      const url = `${this.config.webApiEndpoint}/$metadata`;
      
      const headers: Record<string, string> = {
        'Accept': 'application/xml'
      };

      if (this.config.accessToken) {
        headers['Authorization'] = `Bearer ${this.config.accessToken}`;
      }

      const response = await fetch(url, { 
        method: 'GET',
        headers 
      });

      if (response.ok) {
        console.log(`✅ [DYNAMICS] Conexão com Dynamics estabelecida com sucesso!`);
        return true;
      } else {
        console.error(`❌ [DYNAMICS] Falha na conexão: HTTP ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao testar conexão:`, error);
      return false;
    }
  }

  /**
   * Obtém informações de descoberta do ambiente
   */
  async obterInformacoesAmbiente(): Promise<any> {
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
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.error(`❌ [DYNAMICS] Erro ao obter informações do ambiente:`, error);
      return null;
    }
  }

  /**
   * Atualiza configurações do Dynamics
   */
  atualizarConfig(novaConfig: Partial<DynamicsConfig>): void {
    this.config = { ...this.config, ...novaConfig };
    console.log(`🔧 [DYNAMICS] Configurações atualizadas`);
    this.validateConfig();
  }

  /**
   * Obtém configurações atuais (sem token por segurança)
   */
  obterConfig(): Omit<DynamicsConfig, 'accessToken'> {
    const { accessToken, ...safeConfig } = this.config;
    return safeConfig;
  }
}

export default new DynamicsIntegrationService();
