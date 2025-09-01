import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { ProdutosService } from '../services/ProdutoService';
import { Notification } from '../models/Notification';

class NotificationController {

  private notificationService: NotificationService;
  private produtosService: ProdutosService;
  private readonly ESTOQUE_MINIMO_PADRAO = 10;

  constructor() {
    this.notificationService = new NotificationService();
    this.produtosService = new ProdutosService();

    // Bind dos métodos para manter o contexto correto
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.delete = this.delete.bind(this);
    this.update = this.update.bind(this);
    this.verificarEstoqueBaixo = this.verificarEstoqueBaixo.bind(this);
    this.verificacaoAutomatica = this.verificacaoAutomatica.bind(this);
    this.limparNotificacoesObsoletas = this.limparNotificacoesObsoletas.bind(this);
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const notification: Notification = req.body;
      const result = await this.notificationService.create(notification);
      return res.status(201).json({
        message: 'Notificação criada com sucesso.',
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const notifications = await this.notificationService.getAll();
      return res.status(200).json({
        message: 'Lista de notificações.',
        data: notifications,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.getById(Number(id));
      return res.status(200).json({
        message: 'Notificação encontrada.',
        data: notification,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await this.notificationService.delete(Number(id));
      return res.status(200).json({ message: 'Notificação deletada com sucesso.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const notification = await this.notificationService.updatePartial(Number(id), updates);
      return res.status(200).json({
        message: 'Notificação atualizada com sucesso.',
        data: notification,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Verifica estoque baixo e cria notificações automaticamente
   */
  async verificarEstoqueBaixo(req: Request, res: Response): Promise<Response> {
    try {
      const { estoqueMinimo } = req.query;
      const limiteEstoque = estoqueMinimo ? Number(estoqueMinimo) : this.ESTOQUE_MINIMO_PADRAO;
      
      const resultado = await this.processarEstoqueBaixo(limiteEstoque);
      
      return res.status(200).json({
        message: 'Verificação de estoque concluída.',
        data: {
          produtosComEstoqueBaixo: resultado.produtosComEstoqueBaixo,
          notificacoesCriadas: resultado.notificacoesCriadas,
          notificacoesJaExistentes: resultado.notificacoesJaExistentes,
          limiteUtilizado: limiteEstoque
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Endpoint para verificação automática de estoque (para uso em cron jobs)
   */
  async verificacaoAutomatica(req: Request, res: Response): Promise<Response> {
    try {
      const resultado = await this.processarEstoqueBaixo(this.ESTOQUE_MINIMO_PADRAO);
      
      return res.status(200).json({
        message: 'Verificação automática executada.',
        data: resultado
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Lógica principal para processar produtos com estoque baixo
   */
  private async processarEstoqueBaixo(limiteEstoque: number) {
    // 1. Buscar todos os produtos
    const todosProdutos = await this.produtosService.getAll();
    
    // 2. Filtrar produtos com estoque baixo
    const produtosComEstoqueBaixo = todosProdutos.filter(produto => 
      produto.estoque <= limiteEstoque
    );

    // 3. Buscar notificações existentes de estoque baixo
    const notificacoesExistentes = await this.notificationService.getAll();
    const notificacoesEstoque = notificacoesExistentes.filter(notif => 
      notif.type === 'estoque_baixo'
    );

    let notificacoesCriadas = 0;
    let notificacoesJaExistentes = 0;

    // 4. Para cada produto com estoque baixo, verificar se já existe notificação
    for (const produto of produtosComEstoqueBaixo) {
      const jaExisteNotificacao = notificacoesEstoque.some(notif => 
        notif.subject.includes(`Produto ID: ${produto.id}`) || 
        notif.subject.includes(produto.nome)
      );

      if (!jaExisteNotificacao) {
        // Criar nova notificação
        const novaNotificacao: Notification = {
          title: 'Alerta: Estoque Baixo',
          subject: `Estoque baixo - ${produto.nome} (ID: ${produto.id})`,
          type: 'estoque_baixo',
          url_redir: `/produtos/${produto.id}`
        };

        await this.notificationService.create(novaNotificacao);
        notificacoesCriadas++;
        
        console.log(`🔔 Notificação criada para produto: ${produto.nome} (Estoque: ${produto.estoque})`);
      } else {
        notificacoesJaExistentes++;
      }
    }

    return {
      produtosComEstoqueBaixo: produtosComEstoqueBaixo.length,
      notificacoesCriadas,
      notificacoesJaExistentes,
      produtos: produtosComEstoqueBaixo.map(p => ({
        id: p.id,
        nome: p.nome,
        estoque: p.estoque,
        codigo: p.codigo
      }))
    };
  }

  /**
   * Limpar notificações antigas de estoque baixo (produtos que já foram reabastecidos)
   */
  async limparNotificacoesObsoletas(req: Request, res: Response): Promise<Response> {
    try {
      const { estoqueMinimo } = req.query;
      const limiteEstoque = estoqueMinimo ? Number(estoqueMinimo) : this.ESTOQUE_MINIMO_PADRAO;
      
      // Buscar todas as notificações de estoque baixo
      const todasNotificacoes = await this.notificationService.getAll();
      const notificacoesEstoque = todasNotificacoes.filter(notif => 
        notif.type === 'estoque_baixo'
      );

      // Buscar todos os produtos
      const todosProdutos = await this.produtosService.getAll();
      
      let notificacoesRemovidas = 0;

      // Para cada notificação de estoque, verificar se o produto ainda tem estoque baixo
      for (const notificacao of notificacoesEstoque) {
        // Extrair ID do produto da notificação
        const matchId = notificacao.subject.match(/ID:\s*(\d+)/);
        if (matchId) {
          const produtoId = Number(matchId[1]);
          const produto = todosProdutos.find(p => p.id === produtoId);
          
          // Se produto não existe ou estoque foi normalizado
          if (!produto || produto.estoque > limiteEstoque) {
            await this.notificationService.delete(notificacao.id);
            notificacoesRemovidas++;
            console.log(`🗑️ Notificação removida para produto ID: ${produtoId}`);
          }
        }
      }

      return res.status(200).json({
        message: 'Limpeza de notificações concluída.',
        data: {
          notificacoesRemovidas,
          limiteUtilizado: limiteEstoque
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default new NotificationController();
