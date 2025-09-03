import { NotificationService } from './NotificationService';
import { ProdutosService } from './ProdutoService';
import { Notification } from '../models/Notification';
 
class EstoqueMonitorService {
  private notificationService = new NotificationService();
  private produtosService = new ProdutosService();
  
  // Configurações padrão
  private readonly ESTOQUE_MINIMO_PADRAO = 10;
  private readonly INTERVALO_VERIFICACAO = 30 * 60 * 1000; // 30 minutos em ms
  
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Inicia o monitoramento automático de estoque
   */
  iniciarMonitoramento(estoqueMinimo?: number, intervaloMs?: number): void {
    if (this.isRunning) {
      console.log('📦 [ESTOQUE-MONITOR] Monitoramento já está em execução');
      return;
    }

    const limiteEstoque = estoqueMinimo || this.ESTOQUE_MINIMO_PADRAO;
    const intervalo = intervaloMs || this.INTERVALO_VERIFICACAO;

    console.log(`📦 [ESTOQUE-MONITOR] Iniciando monitoramento automático (limite: ${limiteEstoque}, intervalo: ${intervalo/1000}s)`);

    // Primeira verificação imediata
    this.verificarEstoqueAutomatico(limiteEstoque);

    // Configurar verificações periódicas
    this.intervalId = setInterval(() => {
      this.verificarEstoqueAutomatico(limiteEstoque);
    }, intervalo);

    this.isRunning = true;
  }

  /**
   * Para o monitoramento automático
   */
  pararMonitoramento(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('📦 [ESTOQUE-MONITOR] Monitoramento parado');
  }

  /**
   * Verifica se o monitoramento está ativo
   */
  isMonitorandoAtivo(): boolean {
    return this.isRunning;
  }

  /**
   * Executa uma única verificação de estoque
   */
  async verificarEstoqueManual(estoqueMinimo?: number): Promise<{
    produtosComEstoqueBaixo: number;
    notificacoesCriadas: number;
    notificacoesJaExistentes: number;
    produtos: Array<{id?: number, nome: string, estoque: number, codigo?: string}>;
  }> {
    const limiteEstoque = estoqueMinimo || this.ESTOQUE_MINIMO_PADRAO;
    return await this.processarEstoqueBaixo(limiteEstoque);
  }

  /**
   * Verificação automática (sem logs detalhados)
   */
  private async verificarEstoqueAutomatico(limiteEstoque: number): Promise<void> {
    try {
      const resultado = await this.processarEstoqueBaixo(limiteEstoque);
      
      if (resultado.notificacoesCriadas > 0) {
        console.log(`📦 [ESTOQUE-MONITOR] ${resultado.notificacoesCriadas} nova(s) notificação(ões) de estoque baixo criada(s)`);
      }
      
      // Log resumido apenas se houver produtos com estoque baixo
      if (resultado.produtosComEstoqueBaixo > 0) {
        console.log(`📦 [ESTOQUE-MONITOR] ${resultado.produtosComEstoqueBaixo} produto(s) com estoque baixo detectado(s)`);
      }
    } catch (error) {
      console.error('📦 [ESTOQUE-MONITOR] Erro na verificação automática:', error);
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

    let notificacoesCriadas = 0;
    let notificacoesJaExistentes = 0;

    // 3. Para cada produto com estoque baixo, criar notificação se não existir
    for (const produto of produtosComEstoqueBaixo) {
      // Criar nova notificação
      const novaNotificacao: Notification = {
        title: 'Alerta: Estoque Baixo',
        subject: `Estoque baixo - ${produto.nome} (ID: ${produto.id}) - Restam: ${produto.estoque} unidades`,
        type: 'estoque_baixo',
        url_redir: `/produtos/${produto.id}`
      };

      try {
        const resultado = await this.notificationService.createIfNotExists(novaNotificacao);
        
        if (resultado) {
          notificacoesCriadas++;
          console.log(`📦 [ESTOQUE-MONITOR] Nova notificação criada para produto: ${produto.nome} (Estoque: ${produto.estoque})`);
        } else {
          notificacoesJaExistentes++;
          console.log(`📦 [ESTOQUE-MONITOR] Notificação já existe para produto: ${produto.nome}`);
        }
      } catch (error) {
        console.error(`📦 [ESTOQUE-MONITOR] Erro ao processar produto ${produto.nome}:`, error);
        // Continue com outros produtos mesmo se um falhar
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
   * Limpar notificações obsoletas (produtos reabastecidos)
   */
  async limparNotificacoesObsoletas(estoqueMinimo?: number): Promise<{
    notificacoesRemovidas: number;
    limiteUtilizado: number;
  }> {
    const limiteEstoque = estoqueMinimo || this.ESTOQUE_MINIMO_PADRAO;
    
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
        }
      }
    }

    return {
      notificacoesRemovidas,
      limiteUtilizado: limiteEstoque
    };
  }
}
 
export default EstoqueMonitorService;
