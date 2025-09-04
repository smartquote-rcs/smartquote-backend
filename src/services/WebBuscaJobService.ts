import supabase from '../infra/supabase/connect';
import CotacoesItensService from './CotacoesItensService';
import RelatorioService from './RelatorioService';
import PonderacaoWebService from './PonderacaoWebService';


type Faltante = {
  id?: number;
  query_sugerida?: string;
  nome?: string;
  categoria?: string;
  quantidade?: number;
  custo_beneficio?: any;
  rigor?: any;
  ponderacao_busca_externa?: number;
};

type BackgroundBuscaResponse = {
  jobId?: string;
  statusUrl?: string;
  [key: string]: any;
};

type JobResultado = {
  produtos?: any[];
  quantidade?: number;
  relatorio?: any; // Relatório gerado pelo LLM durante a busca web
};

type JobStatusPayload = {
  status?: 'pendente' | 'executando' | 'concluido' | 'erro';
  parametros?: {
    quantidade?: number;
  };
  resultado?: JobResultado;
  erro?: string;
};

type JobStatusResponse = {
  job?: JobStatusPayload;
  [key: string]: any;
};

type ResumoLocal = {
  [query: string]: any[];
};

export default class WebBuscaJobService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || '';
  }

  private sleep(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }
  async createJobsForFaltantes(faltantes: Faltante[], solicitacaoFallback: string, ponderacaoWeb_LLM: Boolean): Promise<string[]> {
    const statusUrls: string[] = [];
    
    // Aplicar ponderação LLM se solicitado
    let faltantesProcessados = faltantes;
    if (ponderacaoWeb_LLM) {
      faltantesProcessados = await PonderacaoWebService.ponderarWebLLM(faltantes);
      console.log(`🧠 [PONDERACAO-WEB] Ponderação aplicada a ${faltantesProcessados.length} faltantes`);
    }
    
    await Promise.all(
      (faltantesProcessados || []).map(async (f) => {
        const termo = f.query_sugerida || solicitacaoFallback;
        try {
          
          const resp = await fetch(`${this.apiBaseUrl}/api/busca-automatica/background`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              faltante_id: f.id, // Incluir o ID do faltante
              produto: termo,
              quantidade: f.quantidade,
              custo_beneficio: f.custo_beneficio,
              rigor: f.rigor,
              ponderacao_web_llm: f.ponderacao_busca_externa,
              salvamento: true,
              refinamento: true,

            })
          });
          const data = (await resp.json()) as BackgroundBuscaResponse;
          if (data?.statusUrl) {
            statusUrls.push(`${this.apiBaseUrl}${data.statusUrl}`);
          } else if (data?.jobId) {
            statusUrls.push(`${this.apiBaseUrl}/api/busca-automatica/job/${data.jobId}`);
          }
        } catch (e: any) {
          console.error('❌ [WEB-BUSCA] Erro ao criar job:', e?.message || e);
        }
      })
    );
    return statusUrls;
  }

  async waitJobs(statusUrls: string[], maxWaitMs: number = 30 * 60 * 1000, pollIntervalMs: number = 2000): Promise<{ resultadosCompletos: JobResultado[]; produtosWeb: any[]; }> {
    const aguardarJob = async (url: string) => {
      const inicio = Date.now();
      while (Date.now() - inicio < maxWaitMs) {
        try {
          const r = await fetch(url, { method: 'GET' });
          const j = (await r.json()) as JobStatusResponse;
          const job = j?.job;
          const status = job?.status;
          if (status === 'concluido') {
            if (job?.resultado) {
              job.resultado.quantidade = job.parametros?.quantidade;
            }
            return job?.resultado || { produtos: [] };
          }
          if (status === 'erro') {
            console.warn(`⚠️ [WEB-BUSCA] Job falhou (${url}):`, job?.erro);
            return { produtos: [] };
          }
        } catch (e: any) {
          console.error('❌ [WEB-BUSCA] Erro ao consultar job:', url, e?.message || e);
        }
        await this.sleep(pollIntervalMs);
      }
      console.warn(`⏱️ [WEB-BUSCA] Timeout aguardando job: ${url}`);
      return { produtos: [] };
    };

    const resultadosPorJob = await Promise.all(statusUrls.map(aguardarJob));
    const produtosWeb = resultadosPorJob.flatMap((r: any) => r?.produtos || []);
    const resultadosCompletos = resultadosPorJob.filter((r: any) => r && typeof r === 'object' && 'produtos' in r);
    return { resultadosCompletos, produtosWeb };
  }

  async insertJobResultsInCotacao(cotacaoId: number, resultadosCompletos: JobResultado[]): Promise<number> {
    let inseridos = 0;
    // Carregar placeholders atuais (status=false) em cotacoes_itens
    let placeholdersRestantes: any[] = [];
    try {
      const { data: placeholders, error } = await supabase
        .from('cotacoes_itens')
        .select('id, item_nome, pedido, quantidade')
        .eq('cotacao_id', Number(cotacaoId))
        .eq('status', false);
      if (!error) placeholdersRestantes = placeholders || [];
    } catch (e) {
      console.warn('⚠️ [PLACEHOLDER] Falha ao carregar placeholders:', (e as any)?.message || e);
    }

    for (const resultadoJob of resultadosCompletos) {
      try {
        // Construir mapa de nome -> produto_id salvo, se existir no job
        const produtoIdMap = new Map<string, number>();
        const salvamento: any = (resultadoJob as any).salvamento;
        if (salvamento?.detalhes && Array.isArray(salvamento.detalhes)) {
          for (const detalhe of salvamento.detalhes) {
            if (detalhe.detalhes && Array.isArray(detalhe.detalhes)) {
              for (const item of detalhe.detalhes) {
                if (item.produto && item.id) {
                  produtoIdMap.set(item.produto, item.id);
                }
              }
            }
          }
        }

        // Para cada produto retornado, tentar cumprir um placeholder correspondente (status=true + update)
        if (resultadoJob.produtos && resultadoJob.produtos.length > 0) {
          for (const produto of resultadoJob.produtos) {
            try {
              const nome = (produto.name || produto.nome || '').toString();
              const baseQuery = (produto.base_query || produto.query || '').toString();

              // Recarregar placeholders pendentes
              const { data: phs } = await supabase
                .from('cotacoes_itens')
                .select('id, item_nome, pedido, quantidade')
                .eq('cotacao_id', Number(cotacaoId))
                .eq('status', false);
              placeholdersRestantes = Array.isArray(phs) ? phs : [];

              const alvo = placeholdersRestantes.find((p: any) =>
                (p.pedido && nome && p.pedido.toLowerCase().includes(nome.toLowerCase())) ||
                (p.item_nome && nome && p.item_nome.toLowerCase().includes(nome.toLowerCase())) ||
                (baseQuery && p.pedido && p.pedido.toLowerCase().includes(baseQuery.toLowerCase()))
              );

              const quantidade = (resultadoJob as any)?.quantidade || alvo?.quantidade || 1;
              const produtoIdSalvo = produtoIdMap.get((produto.name || produto.nome || '').toString());

              if (alvo) {
                // Cumprir placeholder: atualizar registro com dados do produto web
                await CotacoesItensService.fulfillPlaceholderWithWebProduct(
                  Number(cotacaoId),
                  alvo.id,
                  produto,
                  quantidade,
                  produtoIdSalvo
                );
                inseridos++;
                if ((resultadoJob as any).relatorio) {
                  (resultadoJob as any).relatorio.id_item_cotacao = alvo.id;
                }
                console.log(`✅ [PLACEHOLDER] Cumprido placeholder ${alvo.id} com produto: ${nome}`);
              } else if (produtoIdSalvo) {
                // Fallback: sem placeholder correspondente, inserir como novo item vinculado ao produto salvo
                await CotacoesItensService.insertWebItemById(Number(cotacaoId), produtoIdSalvo, produto, quantidade);
                inseridos++;
                console.log(`➕ [COTACAO-ITEM] Inserido item web sem placeholder correspondente: ${nome}`);
              } else {
                console.log(`ℹ️ [PLACEHOLDER] Sem correspondência para produto: ${nome}`);
              }
            } catch (e) {
              console.warn('⚠️ [PLACEHOLDER] Falha ao cumprir placeholder/inserir item:', (e as any)?.message || e);
            }
          }
        }
        // Inserir ou atualizar relatório na tabela relatorios se disponível
        if (resultadoJob.relatorio) {
          // Verifica se já existe relatorio rascunho para essa cotação
          const { data: relatorioExistente, error: relatorioError } = await supabase
            .from('relatorios')
            .select('id, analise_web')
            .eq('cotacao_id', Number(cotacaoId))
            .eq('status', 'rascunho')
            .single();

          if (relatorioExistente && relatorioExistente.id) {
            // Atualiza o campo analise_web acumulando no array
            const analiseWebAtual = Array.isArray(relatorioExistente.analise_web) ? relatorioExistente.analise_web : [];
            const novoAnaliseWeb = [...analiseWebAtual, resultadoJob.relatorio];
            await supabase
              .from('relatorios')
              .update({
                analise_web: novoAnaliseWeb,
                atualizado_em: new Date().toISOString()
              })
              .eq('id', relatorioExistente.id);
            console.log(`📊 [WEB-REPORT] Relatório atualizado (analise_web ARRAY) na tabela relatorios para cotação ${cotacaoId}`);
          } else {
            // Cria novo registro com analise_web como array
            const relatorioPayload = {
              cotacao_id: Number(cotacaoId),
              versao: 1,
              status: 'rascunho',
              analise_local: null, // Se houver análise local, preencher
              analise_web: [resultadoJob.relatorio],
              criado_em: new Date().toISOString(),
              atualizado_em: new Date().toISOString(),
              criado_por: null // Se houver usuário logado, preencher
            };
            await supabase.from('relatorios').insert([relatorioPayload]);
            console.log(`📊 [WEB-REPORT] Relatório inserido (analise_web ARRAY) na tabela relatorios para cotação ${cotacaoId}`);
          }
        }

      } catch (e) {
        console.error('❌ [COTACAO-ITEM] Erro ao inserir itens do job:', (e as any)?.message || e);
      }
    }

    // Atualizar status da cotação com base em placeholders restantes
    try {
      const { data: phsFinais } = await supabase
        .from('cotacoes_itens')
        .select('id')
        .eq('cotacao_id', Number(cotacaoId))
        .eq('status', false);
      const restantes = (phsFinais || []).length;
      const novoStatus = restantes === 0 ? 'completa' : 'incompleta';
      const { error: updateError } = await supabase
        .from('cotacoes')
        .update({ status: novoStatus })
        .eq('id', Number(cotacaoId));
      if (updateError) {
        console.error('❌ [COTACAO] Erro ao atualizar status:', updateError);
      } else if (novoStatus === 'completa') {
        console.log(`🎉 [COTACAO] Cotação ${cotacaoId} marcada como completa`);
        console.log(`💰 [COTACAO] Recalculando orçamento final da cotação ${cotacaoId}`);
        await this.recalcOrcamento(Number(cotacaoId));
      }
    } catch (e) {
      console.warn('⚠️ [COTACAO] Falha ao atualizar status com base em placeholders:', (e as any)?.message || e);
    }

    return inseridos;
  }

  async recalcOrcamento(cotacaoId: number): Promise<number> {
    try {
      const { data: itens, error } = await supabase
        .from('cotacoes_itens')
        .select('item_preco, quantidade')
        .eq('cotacao_id', Number(cotacaoId));
      if (!error && Array.isArray(itens)) {
        let total = 0;
        for (const it of itens) {
          const preco = parseFloat(String(it.item_preco ?? 0));
          const qtd = parseInt(String(it.quantidade ?? 1));
          if (!isNaN(preco) && !isNaN(qtd)) total += preco * qtd;
        }
        await supabase.from('cotacoes').update({ orcamento_geral: total }).eq('id', Number(cotacaoId));
        return total;
      }
    } catch (e) {
      console.error('❌ [COTACAO] Erro ao recalcular orçamento:', (e as any)?.message || e);
    }
    return 0;
  }

}