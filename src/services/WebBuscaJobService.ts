import supabase from '../infra/supabase/connect';
import CotacoesItensService from './CotacoesItensService';
import RelatorioService from './RelatorioService';
import PonderacaoWebService from './PonderacaoWebService';


type Faltante = {
  id?: number;
  item_id?: number; // novo: id do registro em cotacoes_itens (placeholder)
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
    // Em produção (Render), usar localhost para comunicação interna.
    // Caso contrário, usar a URL definida no .env (útil para dev local).
    if (process.env.NODE_ENV === 'production') {
      const port = process.env.PORT || process.env.PORT_DEFAULT || 2000;
      this.apiBaseUrl = `http://localhost:${port}`;
    } else {
      this.apiBaseUrl = process.env.API_BASE_URL || '';
    }
    console.log(`[WebBuscaJobService] API Base URL configurada para: ${this.apiBaseUrl}`);
  }

  /**
   * Orquestra a criação de jobs e, caso não haja produtos escolhidos após a primeira rodada,
   * cria jobs de reforço usando sites sugeridos (urls_add) e retorna os resultados combinados.
   */
  async createJobsForFaltantesWithReforco(
    faltantes: Faltante[],
    solicitacaoFallback: string,
    ponderacaoWeb_LLM: Boolean
  ): Promise<{ resultadosCompletos: (JobResultado & { tipo_busca?: 'principal' | 'reforco' })[]; produtosWeb: any[]; }> {
    // 1) Primeira rodada
    const statusUrlsRound1 = await this.createJobsForFaltantes(faltantes, solicitacaoFallback, ponderacaoWeb_LLM);
    const { resultadosCompletos: r1, produtosWeb: aprovados1 } = await this.waitJobs(statusUrlsRound1);

    // Mapear faltantes que não receberam produtos
    const faltanteIdsComProdutos = new Set<number>();
    for (const res of r1) {
      const produtos = (res as any)?.produtos || [];
      for (const p of produtos) {
        if ((p as any)?.faltante_id) {
          faltanteIdsComProdutos.add(Number((p as any).faltante_id));
        }
      }
    }

    // 2) Determinar faltantes sem produtos
    const faltantesSemProdutos = (faltantes || []).filter((f: any) => {
      const fid = typeof f.item_id !== 'undefined' && f.item_id !== null ? Number(f.item_id) : (typeof f.id !== 'undefined' ? Number(f.id) : undefined);
      if (typeof fid === 'undefined') return false;
      return !faltanteIdsComProdutos.has(fid);
    });

    if (faltantesSemProdutos.length === 0) {
      return { resultadosCompletos: r1, produtosWeb: aprovados1 };
    }

    console.log(`🔁 [WEB-BUSCA] Preparando reforço para ${faltantesSemProdutos.length} faltantes sem produtos`);

    // 3) Buscar sites sugeridos e criar jobs de reforço com urls_add
    const statusUrlsRound2: string[] = [];
    for (const f of faltantesSemProdutos) {
      const termo = f.query_sugerida || solicitacaoFallback;
      try {
        const resp = await fetch(`${this.apiBaseUrl}/api/busca-automatica/procurarSites?q=${encodeURIComponent(termo)}&limit=5&location=Angola&is_mixed=true`, {
          method: 'GET'
        });
        const data: any = await resp.json();
        const sites = data?.data?.sites || [];
        if (Array.isArray(sites) && sites.length > 0) {
          const urls_add = sites.map((site: any) => ({ url: site.url, escala_mercado: site.escala_mercado || 'Nacional' }));

          const payload: any = {
            produto: termo,
            quantidade: Number.isFinite(Number(f.quantidade)) && Number(f.quantidade) > 0 ? Math.floor(Number(f.quantidade)) : 1,
            salvamento: false,
            refinamento: true,
            urls_add,
          };
          if (typeof f.custo_beneficio !== 'undefined') payload.custo_beneficio = f.custo_beneficio;
          if (typeof (f as any).rigor === 'number' && isFinite((f as any).rigor)) payload.rigor = Math.max(0, Math.min(5, Math.round((f as any).rigor)));
          if (typeof f.ponderacao_busca_externa === 'number' && isFinite(f.ponderacao_busca_externa)) payload.ponderacao_web_llm = Math.max(0, Math.min(1, f.ponderacao_busca_externa));
          const faltId = (typeof (f as any).item_id !== 'undefined' && (f as any).item_id !== null) ? (f as any).item_id : f.id;
          if (typeof faltId !== 'undefined' && faltId !== null) payload.faltante_id = String(faltId);

          const resp2 = await fetch(`${this.apiBaseUrl}/api/busca-automatica/background`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data2 = (await resp2.json()) as BackgroundBuscaResponse;
          if (data2?.statusUrl) statusUrlsRound2.push(`${this.apiBaseUrl}${data2.statusUrl}`);
          else if (data2?.jobId) statusUrlsRound2.push(`${this.apiBaseUrl}/api/busca-automatica/job/${data2.jobId}`);
        }
      } catch (e: any) {
        console.warn(`⚠️ [WEB-BUSCA] Falha ao montar reforço para termo "${termo}":`, e?.message || e);
      }
    }

    if (statusUrlsRound2.length === 0) {
      return { resultadosCompletos: r1, produtosWeb: aprovados1 };
    }

    const { resultadosCompletos: r2, produtosWeb: aprovados2 } = await this.waitJobs(statusUrlsRound2);
    // 4) Combinar resultados
    const resultadosCompletos = [...r1, ...r2];
    const produtosWeb = [...aprovados1, ...aprovados2];
    return { resultadosCompletos, produtosWeb };
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
          console.log(`🌐 [WEB-BUSCA] Criando job para: "${termo}" (ID: ${f.id})`);
          console.log(`🔗 [WEB-BUSCA] URL base: ${this.apiBaseUrl}`);
          
          // Montagem do payload respeitando o BuscaSchema (zod)
          const payload: any = {
            produto: termo,
            quantidade: Number.isFinite(Number(f.quantidade)) && Number(f.quantidade) > 0
              ? Math.floor(Number(f.quantidade))
              : 1,
            salvamento: true,
            refinamento: true,
          };

          if (typeof f.custo_beneficio !== 'undefined') {
            payload.custo_beneficio = f.custo_beneficio;
          }
          if (typeof (f as any).rigor === 'number' && isFinite((f as any).rigor)) {
            const r = Math.round((f as any).rigor);
            payload.rigor = Math.max(0, Math.min(5, r));
          }
          if (typeof f.ponderacao_busca_externa === 'number' && isFinite(f.ponderacao_busca_externa)) {
            payload.ponderacao_web_llm = Math.max(0, Math.min(1, f.ponderacao_busca_externa));
          }
          // Preferir o item_id (id do item em cotacoes_itens); fallback para id legado
          const faltId = (typeof (f as any).item_id !== 'undefined' && (f as any).item_id !== null)
            ? (f as any).item_id
            : f.id;
          if (typeof faltId !== 'undefined' && faltId !== null) {
            payload.faltante_id = String(faltId);
          }

          const resp = await fetch(`${this.apiBaseUrl}/api/busca-automatica/background`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (!resp.ok) {
            let errorBody = '';
            try {
              errorBody = await resp.text();
            } catch {}
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}${errorBody ? ` - ${errorBody}` : ''}`);
          }
          
          const data = (await resp.json()) as BackgroundBuscaResponse;
          console.log(`✅ [WEB-BUSCA] Job criado para "${termo}":`, data);
          
          if (data?.statusUrl) {
            statusUrls.push(`${this.apiBaseUrl}${data.statusUrl}`);
          } else if (data?.jobId) {
            statusUrls.push(`${this.apiBaseUrl}/api/busca-automatica/job/${data.jobId}`);
          } else {
            console.warn(`⚠️ [WEB-BUSCA] Job criado mas sem statusUrl/jobId para "${termo}":`, data);
          }
        } catch (e: any) {
          console.error(`❌ [WEB-BUSCA] Erro ao criar job para "${termo}":`, e?.message || e);
        }
      })
    );
    return statusUrls;
  }

  async waitJobs(statusUrls: string[], maxWaitMs: number = 30 * 60 * 1000, pollIntervalMs: number = 2000): Promise<{ resultadosCompletos: (JobResultado & { tipo_busca?: 'principal' | 'reforco' })[]; produtosWeb: any[]; }> {
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
              // Marcar tipo de busca com base no uso de urls_add
              const tipo: 'principal' | 'reforco' = (Array.isArray((job as any)?.parametros?.urls_add) && (job as any).parametros.urls_add.length > 0)
                ? 'reforco'
                : 'principal';
              (job.resultado as any).tipo_busca = tipo;
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
    const resultadosCompletos = resultadosPorJob.filter((r: any) => r && typeof r === 'object' && 'produtos' in r) as (JobResultado & { tipo_busca?: 'principal' | 'reforco' })[];
    return { resultadosCompletos, produtosWeb };
  }

  async insertJobResultsInCotacao(cotacaoId: number, resultadosCompletos: (JobResultado & { tipo_busca?: 'principal' | 'reforco' })[]): Promise<number> {
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
        const tipoBusca = (resultadoJob as any).tipo_busca === 'reforco' ? 'reforco' : 'principal';

        // Para cada produto retornado, tentar cumprir um placeholder correspondente (status=true + update)
        if (resultadoJob.produtos && resultadoJob.produtos.length > 0) {
          for (const produto of resultadoJob.produtos) {
            try {
              const nome = (produto.name || produto.nome || '').toString();
              const baseQuery = (produto.base_query || produto.query || '').toString();
              const faltanteIdFromProduto = (produto as any)?.faltante_id ? Number((produto as any).faltante_id) : null;

              // Recarregar placeholders pendentes
              const { data: phs } = await supabase
                .from('cotacoes_itens')
                .select('id, item_nome, pedido, quantidade')
                .eq('cotacao_id', Number(cotacaoId))
                .eq('status', false);
              placeholdersRestantes = Array.isArray(phs) ? phs : [];

              // Preferir correspondência direta por ID do faltante (item_id)
              let alvo = faltanteIdFromProduto
                ? placeholdersRestantes.find((p: any) => Number(p.id) === Number(faltanteIdFromProduto))
                : undefined;

              const quantidade = (resultadoJob as any)?.quantidade || alvo?.quantidade || 1;
              
              // Buscar ID do produto salvo no resultado do salvamento
              let produtoIdSalvo = null;
              const salvamento = (resultadoJob as any)?.salvamento;
              if (salvamento?.detalhes) {
                for (const fornecedorDetalhe of salvamento.detalhes) {
                  if (fornecedorDetalhe.detalhes && fornecedorDetalhe.detalhes.length > 0) {
                    const produtoSalvo = fornecedorDetalhe.detalhes[0];
                    if (produtoSalvo.status === 'salvo' && produtoSalvo.id) {
                      produtoIdSalvo = produtoSalvo.id;
                      break;
                    }
                  }
                }
              }

              if (alvo) {
                // Cumprir placeholder: atualizar registro com dados do produto web
                await (CotacoesItensService as any).fulfillPlaceholderWithAnalysis(
                  Number(cotacaoId),
                  alvo.id,
                  produto,
                  quantidade,
                  produtoIdSalvo,
                  resultadoJob.relatorio,
                  tipoBusca
                );
                inseridos++;
                if ((resultadoJob as any).relatorio) {
                  (resultadoJob as any).relatorio.id_item_cotacao = alvo.id;
                }
                console.log(`✅ [PLACEHOLDER] Cumprido placeholder ${alvo.id} com produto: ${nome}`);
              }
            } catch (e) {
              console.warn('⚠️ [PLACEHOLDER] Falha ao cumprir placeholder/inserir item:', (e as any)?.message || e);
            }
          }
        } else if ((resultadoJob as any)?.relatorio) {
          // Sem produtos, mas com relatório: anexar análise ao placeholder correspondente
          try {
            // Recarregar placeholders pendentes
            const { data: phs } = await supabase
              .from('cotacoes_itens')
              .select('id, item_nome, pedido, quantidade')
              .eq('cotacao_id', Number(cotacaoId))
              .eq('status', false);
            placeholdersRestantes = Array.isArray(phs) ? phs : [];

            const rel: any = (resultadoJob as any).relatorio;
            const faltanteIdFromRel = typeof rel?.faltante_id === 'number' ? Number(rel.faltante_id) : null;
            const relQueryNome = (rel?.query?.nome || rel?.query || '').toString();

            // Preferir correspondência por ID do faltante; fallback por pedido aproximado
            let alvo = faltanteIdFromRel
              ? placeholdersRestantes.find((p: any) => Number(p.id) === Number(faltanteIdFromRel))
              : undefined;
            if (!alvo && relQueryNome) {
              alvo = placeholdersRestantes.find((p: any) => p.pedido && p.pedido.toLowerCase().includes(relQueryNome.toLowerCase()));
            }

            if (alvo) {
              await (CotacoesItensService as any).fulfillPlaceholderWithAnalysis(
                Number(cotacaoId),
                alvo.id,
                null, // sem produto, apenas anexar análise
                0,
                undefined,
                rel,
                tipoBusca
              );
              console.log(`📝 [ANALISE] Análise web anexada ao placeholder ${alvo.id} (sem produto)`);
            } else {
              console.log('ℹ️ [ANALISE] Não foi possível localizar placeholder para anexar análise web (sem produto)');
            }
          } catch (e) {
            console.warn('⚠️ [ANALISE] Falha ao anexar análise web sem produto:', (e as any)?.message || e);
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