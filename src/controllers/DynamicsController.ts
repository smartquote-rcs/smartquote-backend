import { Request, Response } from 'express';
import DynamicsIntegrationService from '../services/DynamicsIntegrationService';
import CotacoesService from '../services/CotacoesService';
import { CotacaoDTO } from '../models/Cotacao';

class DynamicsController {
  /**
   * Testa a conexão com Dynamics 365
   */
  async testarConexao(req: Request, res: Response): Promise<Response> {
    try {
      const sucesso = await DynamicsIntegrationService.testarConexao();
      
      if (sucesso) {
        return res.status(200).json({
          message: 'Conexão com Dynamics 365 estabelecida com sucesso!',
          status: 'conectado'
        });
      } else {
        return res.status(503).json({
          message: 'Falha ao conectar com Dynamics 365',
          status: 'desconectado'
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro interno ao testar conexão',
        error: error.message
      });
    }
  }

  /**
   * Obtém informações do ambiente Dynamics
   */
  async obterInformacoesAmbiente(req: Request, res: Response): Promise<Response> {
    try {
      const info = await DynamicsIntegrationService.obterInformacoesAmbiente();
      
      if (info) {
        return res.status(200).json({
          message: 'Informações do ambiente obtidas com sucesso',
          data: info
        });
      } else {
        return res.status(404).json({
          message: 'Não foi possível obter informações do ambiente'
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro ao obter informações do ambiente',
        error: error.message
      });
    }
  }

  /**
   * Obtém configurações atuais do Dynamics (sem dados sensíveis)
   */
  async obterConfiguracoes(req: Request, res: Response): Promise<Response> {
    try {
      const config = DynamicsIntegrationService.obterConfig();
      
      return res.status(200).json({
        message: 'Configurações do Dynamics 365',
        data: config
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro ao obter configurações',
        error: error.message
      });
    }
  }

  /**
   * Atualiza configurações do Dynamics
   */
  async atualizarConfiguracoes(req: Request, res: Response): Promise<Response> {
    try {
      const { organizationId, environmentId, webApiEndpoint, discoveryEndpoint, accessToken } = req.body;

      const novaConfig = {
        ...(organizationId && { organizationId }),
        ...(environmentId && { environmentId }),
        ...(webApiEndpoint && { webApiEndpoint }),
        ...(discoveryEndpoint && { discoveryEndpoint }),
        ...(accessToken && { accessToken })
      };

      DynamicsIntegrationService.atualizarConfig(novaConfig);

      return res.status(200).json({
        message: 'Configurações atualizadas com sucesso',
        updatedFields: Object.keys(novaConfig)
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro ao atualizar configurações',
        error: error.message
      });
    }
  }

  /**
   * Envia uma cotação específica para Dynamics (teste manual)
   */
  async enviarCotacao(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          message: 'ID da cotação é obrigatório e deve ser um número'
        });
      }

      // Buscar cotação
      const cotacao = await CotacoesService.getById(Number(id));
      
      if (!cotacao) {
        return res.status(404).json({
          message: `Cotação com ID ${id} não encontrada`
        });
      }

      // Verificar se está aprovada
      if (!cotacao.aprovacao) {
        return res.status(400).json({
          message: 'Apenas cotações aprovadas podem ser enviadas para o Dynamics',
          cotacao: {
            id: cotacao.id,
            aprovacao: cotacao.aprovacao,
            status: cotacao.status
          }
        });
      }

      // Enviar para Dynamics
      const sucesso = await DynamicsIntegrationService.processarCotacaoAprovada(cotacao);

      if (sucesso) {
        return res.status(200).json({
          message: `Cotação ${id} enviada para Dynamics com sucesso!`,
          cotacao: {
            id: cotacao.id,
            produto: cotacao.produto?.nome,
            orcamento_geral: cotacao.orcamento_geral,
            aprovacao: cotacao.aprovacao
          }
        });
      } else {
        return res.status(502).json({
          message: `Falha ao enviar cotação ${id} para Dynamics`,
          cotacao: {
            id: cotacao.id,
            aprovacao: cotacao.aprovacao
          }
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro interno ao enviar cotação',
        error: error.message
      });
    }
  }

  /**
   * Reenvia todas as cotações aprovadas para Dynamics (sincronização em lote)
   */
  async sincronizarCotacoesAprovadas(req: Request, res: Response): Promise<Response> {
    try {
      console.log('🔄 [DYNAMICS] Iniciando sincronização em lote...');
      
      // Buscar todas as cotações aprovadas
      const todasCotacoes = await CotacoesService.getAll();
      const cotacoesAprovadas = todasCotacoes.filter((cotacao: CotacaoDTO) => cotacao.aprovacao === true);

      if (cotacoesAprovadas.length === 0) {
        return res.status(200).json({
          message: 'Nenhuma cotação aprovada encontrada para sincronização',
          total: 0,
          enviadas: 0,
          falharam: 0
        });
      }

      let enviadas = 0;
      let falharam = 0;
      const resultados = [];

      // Processar cada cotação
      for (const cotacao of cotacoesAprovadas) {
        try {
          const sucesso = await DynamicsIntegrationService.processarCotacaoAprovada(cotacao);
          
          if (sucesso) {
            enviadas++;
            resultados.push({
              id: cotacao.id,
              status: 'enviada',
              produto: cotacao.produto?.nome
            });
          } else {
            falharam++;
            resultados.push({
              id: cotacao.id,
              status: 'falhou',
              produto: cotacao.produto?.nome
            });
          }
        } catch (error) {
          falharam++;
          resultados.push({
            id: cotacao.id,
            status: 'erro',
            produto: cotacao.produto?.nome,
            erro: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      return res.status(200).json({
        message: `Sincronização concluída`,
        total: cotacoesAprovadas.length,
        enviadas,
        falharam,
        resultados
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro interno na sincronização',
        error: error.message
      });
    }
  }
}

export default new DynamicsController();
