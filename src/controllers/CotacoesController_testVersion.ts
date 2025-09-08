import { Request, Response } from 'express';
import CotacoesService from '../services/CotacoesService';
import { cotacaoSchema } from '../schemas/CotacaoSchema';
import { Cotacao } from '../models/Cotacao';
import CotacaoNotificationService from '../services/CotacaoNotificationService';
import DynamicsIntegrationService from '../services/DynamicsIntegrationService';

class CotacoesController {
  async create(req: Request, res: Response): Promise<Response> {
  // compat: aceitar camelCase e converter
    const body = { ...req.body } as any;
  if (body.promptId && !body.prompt_id) body.prompt_id = body.promptId;
  if (body.aprovadoPor && !body.aprovado_por) body.aprovado_por = body.aprovadoPor;
    if (body.orcamentoGeral && !body.orcamento_geral) body.orcamento_geral = body.orcamentoGeral;
    if (body.dataAprovacao && !body.data_aprovacao) body.data_aprovacao = body.dataAprovacao;
    if (body.dataSolicitacao && !body.data_solicitacao) body.data_solicitacao = body.dataSolicitacao;
    if (body.prazoValidade && !body.prazo_validade) body.prazo_validade = body.prazoValidade;
    
    // Adicionar prompt_id padrão se não fornecido (TEMPORÁRIO PARA TESTES)
    if (!body.prompt_id) {
      body.prompt_id = 1;
    }
    
    // mapear status antigo -> novo
    if (body.status && ['pendente','aceite','recusado'].includes(body.status)) {
      body.status = body.status === 'aceite' ? 'completa' : 'incompleta';
    }
  const parsed = cotacaoSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({ errors });
    }

    try {
      const cotacao = await CotacoesService.create(parsed.data as unknown as Cotacao);
      
      // Criar notificação para nova cotação
      try {
        await CotacaoNotificationService.processarNotificacaoCotacao(cotacao, 'criada');
      } catch (notifError) {
        console.error('Erro ao criar notificação de cotação criada:', notifError);
        // Não quebra o fluxo principal, apenas loga o erro
      }

      return res.status(201).json({
        message: 'Cotação cadastrada com sucesso.',
        data: cotacao,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const cotacoes = await CotacoesService.getAll();
      return res.status(200).json({
        message: 'Lista de cotações.',
        data: cotacoes,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const cotacao = await CotacoesService.getById(Number(id));
      return res.status(200).json({
        message: 'Cotação encontrada.',
        data: cotacao,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      // Buscar cotação antes de deletar para notificações
      let cotacaoParaDeletar;
      try {
        cotacaoParaDeletar = await CotacoesService.getById(Number(id));
      } catch (error) {
        // Se não encontrou a cotação, continua com a deleção
        console.warn('Cotação não encontrada para notificação de deleção:', id);
      }
      
      await CotacoesService.delete(Number(id));
      
      // Criar notificação de deleção se conseguiu buscar a cotação
      if (cotacaoParaDeletar) {
        try {
          await CotacaoNotificationService.processarNotificacaoCotacao(cotacaoParaDeletar, 'deletada');
        } catch (notifError) {
          console.error('Erro ao criar notificação de cotação deletada:', notifError);
          // Não quebra o fluxo principal, apenas loga o erro
        }
      }
      
      return res.status(200).json({ message: 'Cotação deletada com sucesso.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async patch(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updates = { ...req.body } as any;
  if (updates.promptId && !updates.prompt_id) updates.prompt_id = updates.promptId;
  if (updates.aprovadoPor && !updates.aprovado_por) updates.aprovado_por = updates.aprovadoPor;
      if (updates.orcamentoGeral && !updates.orcamento_geral) updates.orcamento_geral = updates.orcamentoGeral;
      if (updates.dataAprovacao && !updates.data_aprovacao) updates.data_aprovacao = updates.dataAprovacao;
      if (updates.dataSolicitacao && !updates.data_solicitacao) updates.data_solicitacao = updates.dataSolicitacao;
      if (updates.prazoValidade && !updates.prazo_validade) updates.prazo_validade = updates.prazoValidade;
      if (updates.status && ['pendente','aceite','recusado'].includes(updates.status)) {
        updates.status = updates.status === 'aceite' ? 'completa' : 'incompleta';
      }

      // ⚠️ VERSÃO SIMPLIFICADA PARA TESTES - SEM VALIDAÇÃO DE PERMISSÕES
      if (Object.prototype.hasOwnProperty.call(updates, 'aprovacao')) {
        const aprov = updates.aprovacao === true || updates.aprovacao === 'true';
        const usuarioId = updates.aprovado_por || 1; // USAR ID NUMÉRICO EM VEZ DE STRING

        console.log(`🧪 [TESTE-SIMPLICADO] Aprovação solicitada para cotação ${id}: ${aprov ? 'APROVAR' : 'REJEITAR'}`);

        if (aprov) {
          updates.status = 'completa';
          updates.data_aprovacao = new Date().toISOString();
          updates.aprovado_por = usuarioId;
        } else {
          updates.status = 'incompleta';
          updates.data_aprovacao = null;
          updates.aprovado_por = usuarioId;
        }
      }

      // Buscar cotação antes de atualizar para comparação
      let cotacaoAnterior;
      try {
        cotacaoAnterior = await CotacoesService.getById(Number(id));
      } catch (error) {
        console.warn('Cotação não encontrada para comparação de mudanças:', id);
      }

      const cotacaoAtualizada = await CotacoesService.updatePartial(Number(id), updates);

      // Processar notificações baseadas em mudanças
      if (cotacaoAnterior && cotacaoAtualizada) {
        try {
          await CotacaoNotificationService.analisarENotificarMudancas(cotacaoAnterior, cotacaoAtualizada);
        } catch (notifError) {
          console.error('Erro ao processar notificações de mudanças na cotação:', notifError);
          // Não quebra o fluxo principal, apenas loga o erro
        }
        
        // Enviar para Dynamics se foi aprovado (novo código adicionado)
        if (
          cotacaoAnterior.aprovacao !== true &&
          cotacaoAtualizada.aprovacao === true
        ) {
          try {
            console.log(`🚀 [DYNAMICS-AUTO] Cotação ${id} foi aprovada, enviando para Dynamics...`);
            // Import estático no topo do arquivo
            const dynamicsService = new DynamicsIntegrationService();
            const resultado = await dynamicsService.processarCotacao(cotacaoAtualizada);
            if (resultado) {
              console.log(`✅ [DYNAMICS-AUTO] Cotação ${id} enviada para Dynamics com sucesso!`);
            } else {
              console.warn(`⚠️ [DYNAMICS-AUTO] Cotação ${id} não foi enviada para Dynamics (falha no processamento)`);
            }
          } catch (dynError) {
            console.error(`❌ [DYNAMICS-AUTO] Erro ao enviar cotação ${id} aprovada para Dynamics:`, dynError);
            // Não quebra o fluxo principal, apenas loga o erro
          }
        }
      }

      return res.status(200).json({
        message: 'Cotação atualizada com sucesso.',
        data: cotacaoAtualizada,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Remove um placeholder (faltante) da cotação.
   * Agora os faltantes são representados por registros em cotacoes_itens com status=false e campo pedido.
   */
  async removeFaltante(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { index, query, nome } = req.body;

      if (index === undefined && !query && !nome) {
        return res.status(400).json({ 
          error: 'É necessário fornecer index, query ou nome para identificar o elemento a ser removido' 
        });
      }
      
      // Remover placeholder em cotacoes_itens
      const svc = require('../services/CotacoesItensService').default as typeof import('../services/CotacoesItensService').default;
      let elementoRemovido: any = null;
      if (index !== undefined) {
        const removed = await svc.removePlaceholderByIndex(Number(id), Number(index));
        if (removed) elementoRemovido = removed;
        else return res.status(400).json({ error: 'Índice inválido ou placeholder não encontrado' });
      } else if (query) {
        const removed = await svc.removePlaceholderByPedido(Number(id), String(query));
        if (removed) elementoRemovido = removed;
      } else if (nome) {
        const removed = await svc.removePlaceholderByNome(Number(id), String(nome));
        if (removed) elementoRemovido = removed;
      }

      if (!elementoRemovido) {
        return res.status(404).json({ error: 'Placeholder não encontrado' });
      }

      // Atualizar status da cotação com base nos placeholders restantes
      const placeholdersRestantes = await svc.listPlaceholders(Number(id));
      const novoStatus = placeholdersRestantes.length === 0 ? 'completa' : 'incompleta';
      const cotacaoAtualizada = await CotacoesService.updatePartial(Number(id), { status: novoStatus });

      return res.status(200).json({
        message: 'Placeholder removido com sucesso.',
        data: {
          elementoRemovido,
          faltantesRestantes: placeholdersRestantes.length,
          novoStatus,
          cotacao: cotacaoAtualizada
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default new CotacoesController();