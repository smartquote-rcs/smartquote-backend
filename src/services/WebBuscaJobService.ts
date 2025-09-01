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
    // Buscar a cotação atual para obter os faltantes
    const { data: cotacao, error: cotacaoError } = await supabase
      .from('cotacoes')
      .select('faltantes, status')
      .eq('id', Number(cotacaoId))
      .single();

    if (cotacaoError) {
      console.error('❌ [COTACAO] Erro ao buscar cotação:', cotacaoError);
      return 0;
    }

    const faltantesAtuais = Array.isArray(cotacao.faltantes) ? cotacao.faltantes : [];
    const novosFaltantes = [...faltantesAtuais];

    for (const resultadoJob of resultadosCompletos) {
      try {
        const adicionados = await CotacoesItensService.insertJobResultItems(Number(cotacaoId), resultadoJob as any);
        inseridos += adicionados;

        // Remover os itens faltantes correspondentes aos produtos inseridos
        if (adicionados > 0 && resultadoJob.produtos) {
          for (const produto of resultadoJob.produtos) {
            // Usar o ID do faltante diretamente se disponível
            if (produto.faltante_id) {
              const indexToRemove = novosFaltantes.findIndex((faltante: any) => 
                faltante.id === produto.faltante_id
              );

              if (indexToRemove !== -1) {
                const faltanteRemovido = novosFaltantes.splice(indexToRemove, 1)[0];
                resultadoJob.relatorio.query = faltanteRemovido;
                console.log(`🗑️ [FALTANTES] Removido item faltante ID ${produto.faltante_id} para produto: ${produto.name}`);
              }
            } else {
              // Fallback: busca por nome ou query (mantido para compatibilidade)
              const indexToRemove = novosFaltantes.findIndex((faltante: any) => {
                return (faltante.nome && produto.name && 
                        faltante.nome.toLowerCase().includes(produto.name.toLowerCase())) ||
                       (faltante.query_sugerida && produto.name && 
                        produto.name.toLowerCase().includes(faltante.query_sugerida.toLowerCase()));
              });

              if (indexToRemove !== -1) {
                const faltanteRemovido = novosFaltantes.splice(indexToRemove, 1)[0];
                resultadoJob.relatorio.query = faltanteRemovido;
                console.log(`🗑️ [FALTANTES] Removido item faltante (fallback) para produto: ${produto.name}`);
              }
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

    // Atualizar os faltantes na cotação
    const precisaAtualizar = JSON.stringify(faltantesAtuais) !== JSON.stringify(novosFaltantes);

    if (precisaAtualizar) {
      const novoStatus = novosFaltantes.length === 0 ? 'completa' : 'incompleta';

      const { error: updateError } = await supabase
        .from('cotacoes')
        .update({ 
            faltantes: novosFaltantes,
            status: novoStatus
          })
          .eq('id', Number(cotacaoId));

      if (updateError) {
        console.error('❌ [COTACAO] Erro ao atualizar cotação:', updateError);
      } else {
        console.log(`✅ [COTACAO] Cotação atualizada: ${novosFaltantes.length} faltantes`);
        if (novoStatus === 'completa') {
          console.log(`🎉 [COTACAO] Cotação ${cotacaoId} marcada como completa`);

            // Se a cotação está completa, verificar se há itens para calcular orçamento
            if (novosFaltantes.length === 0) {
              console.log(`💰 [COTACAO] Recalculando orçamento final da cotação ${cotacaoId}`);
              await this.recalcOrcamento(Number(cotacaoId));
            }
        }
      }
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