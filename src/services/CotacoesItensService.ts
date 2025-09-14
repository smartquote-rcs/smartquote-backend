import supabase from '../infra/supabase/connect';
import { Product } from '../types/BuscaTypes';
import RelatorioService from './RelatorioService';
import { RelatorioData } from '../services/relatorio/types';
import { url } from 'inspector';

class CotacoesItensService {
  private parseNumero(precoStr?: string): number | null {
    if (!precoStr) return null;
    try {
      // Remove tudo que não seja dígito, ponto ou vírgula
      let numeroLimpo = precoStr.replace(/[^\d.,]/g, '');
      
      // Normalizar separadores decimais
      // Se tem vírgula, assumir que é separador decimal
      if (numeroLimpo.includes(',')) {
        // Se tem ponto E vírgula, ponto é separador de milhar
        if (numeroLimpo.includes('.')) {
          numeroLimpo = numeroLimpo.replace(/\./g, '').replace(',', '.');
        } else {
          // Só vírgula, converter para ponto decimal
          numeroLimpo = numeroLimpo.replace(',', '.');
        }
      }
      // Se só tem pontos, verificar se é separador de milhar ou decimal
      else if (numeroLimpo.includes('.')) {
        const partes = numeroLimpo.split('.');
        if (partes.length > 2 || (partes.length === 2 && partes[1] && partes[1].length === 3)) {
          // Múltiplos pontos ou último tem 3 dígitos = separador de milhar
          numeroLimpo = numeroLimpo.replace(/\./g, '');
        }
        // Senão, assumir que é separador decimal
      }
      
      const n = parseFloat(numeroLimpo);
      return isNaN(n) ? null : n;
    } catch {
      return null;
    }
  }

  private providerFromUrl(url?: string): string | null {
    if (!url) return null;
    try {
      const u = new URL(url);
      return u.hostname;
    } catch {
      return null;
    }
  }

  /**
   * Insere um placeholder de item de cotação representando um "faltante".
   * Campos principais:
   *  - status: false (não encontrado ainda)
   *  - pedido: texto original (ex: query_sugerida)
   */
  async insertPlaceholderItem(cotacaoId: number, faltante: any): Promise<number | null> {
    const payload: any = {
      cotacao_id: cotacaoId,
  // origem precisa respeitar o CHECK CONSTRAINT da tabela (ex.: 'local' | 'externa').
  // Para placeholders, usamos 'externa' como padrão, indicando que será buscado externamente.
  origem: 'externa',
      provider: undefined,
      external_url: undefined,
      item_nome: faltante?.nome || 'Item não encontrado',
      item_descricao: faltante?.categoria
        ? `Pedido de categoria: ${faltante.categoria}`
        : 'Item solicitado não encontrado na base local',
      item_preco: undefined,
      item_moeda: 'AOA',
      quantidade: Number(faltante?.quantidade || 1),
      status: false,
      pedido: faltante?.query_sugerida || faltante?.nome || '',
    };

    const { data, error } = await supabase
      .from('cotacoes_itens')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Falha ao inserir placeholder na cotação ${cotacaoId}: ${error.message}`);
    }

    return data?.id ?? null;
  }

  /**
   * Atualiza um placeholder com análise diferenciando o tipo de busca.
   * tipoBusca:
   *  - 'principal' -> salva em analise_web
   *  - 'reforco'   -> salva em analise_web_externa
   * Se produto for null, apenas anexa a análise e mantém status inalterado.
   */
  async fulfillPlaceholderWithAnalysis(
    cotacaoId: number,
    placeholderId: number,
    produto: any | null,
    quantidade: number,
    produtoId?: number,
    relatorio?: any,
    tipoBusca: 'principal' | 'reforco' = 'principal'
  ): Promise<number | null> {
    const campoAnalise = tipoBusca === 'reforco' ? 'analise_web_externa' : 'analise_web';

    // Buscar análises existentes no campo adequado
    const { data: existing, error: fetchError } = await supabase
      .from('cotacoes_itens')
      .select(campoAnalise)
      .eq('id', placeholderId)
      .single();

    if (fetchError) {
      throw new Error(`Falha ao buscar placeholder ${placeholderId}: ${fetchError.message}`);
    }

    const existentes = Array.isArray((existing as any)?.[campoAnalise])
      ? (existing as any)[campoAnalise]
      : ((existing as any)?.[campoAnalise] ? [(existing as any)[campoAnalise]] : []);

    const analiseAtualizada = typeof relatorio !== 'undefined' && relatorio !== null
      ? [...existentes, relatorio]
      : existentes;

    if (!produto) {
      // Apenas anexar análise sem mexer em status ou outros campos
      const { data, error } = await supabase
        .from('cotacoes_itens')
        .update({ [campoAnalise]: analiseAtualizada })
        .eq('id', placeholderId)
        .select('id')
        .single();

      if (error) {
        throw new Error(`Falha ao anexar análise (${campoAnalise}) ao placeholder ${placeholderId} na cotação ${cotacaoId}: ${error.message}`);
      }

      return data?.id ?? null;
    }

    const item_preco = this.parseNumero(produto?.price);
    const provider = this.providerFromUrl(produto?.product_url || produto?.url);

    const updatePayload: any = {
      cotacao_id: cotacaoId,
      produto_id: produtoId || null,
      origem: 'externo',
      provider: provider || undefined,
      external_url: produto?.product_url || produto?.url || undefined,
      item_nome: produto?.name || produto?.nome || 'Produto web',
      item_descricao: produto?.description || produto?.descricao || null,
      item_preco: item_preco ?? null,
      item_moeda: 'AOA',
      quantidade: Number(quantidade || 1),
      status: true,
      [campoAnalise]: analiseAtualizada,
    };

    const { data, error } = await supabase
      .from('cotacoes_itens')
      .update(updatePayload)
      .eq('id', placeholderId)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Falha ao atualizar placeholder ${placeholderId} na cotação ${cotacaoId}: ${error.message}`);
    }

    return data?.id ?? null;
  }

  /**
   * Retorna todos os placeholders (status=false) de uma cotação
   */
  async listPlaceholders(cotacaoId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('cotacoes_itens')
      .select('*')
      .eq('cotacao_id', cotacaoId)
      .eq('status', false);
    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Remove placeholders por índice na lista ordenada por id asc
   */
  async removePlaceholderByIndex(cotacaoId: number, index: number): Promise<any | null> {
    const placeholders = await this.listPlaceholders(cotacaoId);
    if (index < 0 || index >= placeholders.length) return null;
    const alvo = placeholders.sort((a, b) => a.id - b.id)[index];
    const { data, error } = await supabase
      .from('cotacoes_itens')
      .delete()
      .eq('id', alvo.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data || null;
  }

  /**
   * Remove placeholder por pedido (query) aproximado
   */
  async removePlaceholderByPedido(cotacaoId: number, query: string): Promise<any | null> {
    // Buscar um placeholder cujo pedido contenha a query
    const { data: candidatos, error } = await supabase
      .from('cotacoes_itens')
      .select('*')
      .eq('cotacao_id', cotacaoId)
      .eq('status', false)
      .ilike('pedido', `%${query}%`)
      .limit(1);
    if (error) throw new Error(error.message);
    const alvo = (candidatos || [])[0];
    if (!alvo) return null;
    const { data, error: delErr } = await supabase
      .from('cotacoes_itens')
      .delete()
      .eq('id', alvo.id)
      .select('*')
      .single();
    if (delErr) throw new Error(delErr.message);
    return data || null;
  }

  /**
   * Remove placeholder por nome aproximado
   */
  async removePlaceholderByNome(cotacaoId: number, nome: string): Promise<any | null> {
    const { data: candidatos, error } = await supabase
      .from('cotacoes_itens')
      .select('*')
      .eq('cotacao_id', cotacaoId)
      .eq('status', false)
      .ilike('item_nome', `%${nome}%`)
      .limit(1);
    if (error) throw new Error(error.message);
    const alvo = (candidatos || [])[0];
    if (!alvo) return null;
    const { data, error: delErr } = await supabase
      .from('cotacoes_itens')
      .delete()
      .eq('id', alvo.id)
      .select('*')
      .single();
    if (delErr) throw new Error(delErr.message);
    return data || null;
  }

  async buildPrompt(cotacaoId: number, produto: Product): Promise<number | null> {
    const item_preco = this.parseNumero(produto.price);
    const provider = this.providerFromUrl(produto.product_url);

    const payload: any = {
      cotacao_id: cotacaoId,
      origem: 'web',
      provider: provider || undefined,
      external_url: produto.product_url,
      item_nome: produto.name,
      item_descricao: produto.description,
      item_preco: item_preco ?? undefined,
      item_moeda: 'AOA',
      quantidade: 1,
    };

    const { data, error } = await supabase
      .from('cotacoes_itens')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Falha ao inserir item web na cotação ${cotacaoId}: ${error.message}`);
    }

    return data?.id ?? null;
  }

  /**
   * Insere item na cotação usando ID do produto já salvo na base de dados
   */
  async insertWebItemById(cotacaoId: number, produtoId: number, produto: Product, quantidade: number, relatorio?: RelatorioData): Promise<number | null> {
    const item_preco = this.parseNumero(produto.price);
    const provider = this.providerFromUrl(produto.product_url);

    const payload: any = {
      cotacao_id: cotacaoId,
      produto_id: produtoId, // ID do produto na tabela produtos
      origem: 'web',
      provider: provider || undefined,
      external_url: produto.product_url,
      item_nome: produto.name,
      item_descricao: produto.description,
      item_preco: item_preco ?? undefined,
      item_moeda: 'AOA',
      quantidade: quantidade,
      analise_web: relatorio,
    };

    const { data, error } = await supabase
      .from('cotacoes_itens')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Falha ao inserir item web com ID ${produtoId} na cotação ${cotacaoId}: ${error.message}`);
    }

    return data?.id ?? null;
  }

  /**
   * Insere item local na cotação com análise local
   */
  async insertLocalItemById(cotacaoId: number, produtoId: number, produto: any, quantidade: number, analiseLocal?: any): Promise<number | null> {
    const item_preco = this.parseNumero(produto.preco || produto.price);

    const payload: any = {
      cotacao_id: cotacaoId,
      produto_id: produtoId,
      origem: 'local',
      item_nome: produto.nome || produto.name,
      item_descricao: produto.descricao || produto.description,
      item_preco: item_preco ?? undefined,
      item_moeda: 'AOA',
      quantidade: quantidade,
      analise_local: analiseLocal,
    };

    const { data, error } = await supabase
      .from('cotacoes_itens')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Falha ao inserir item local com ID ${produtoId} na cotação ${cotacaoId}: ${error.message}`);
    }

    return data?.id ?? null;
  }

  /**
   * Atualiza um item existente com análise local
   */
  async updateItemWithAnaliseLocal(itemId: number, analiseLocal: any): Promise<boolean> {
    const { data, error } = await supabase
      .from('cotacoes_itens')
      .update({ analise_local: analiseLocal })
      .eq('id', itemId)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Falha ao atualizar item ${itemId} com análise local: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Insere item na cotação a partir do resultado de job que contém dados do produto e ID salvo
   */
  async insertJobResultItem(cotacaoId: number, jobResult: any): Promise<number | null> {
    // jobResult é o produto individual do array produtos do job
    const produto = jobResult;
    
    // Buscar o ID do produto salvo nos detalhes do salvamento do job
    // Como não temos acesso direto ao salvamento aqui, vamos usar o método original
    // O salvamento está disponível no resultado completo do job, não no produto individual
    return await this.insertWebItemById(cotacaoId, produto.id, produto, produto.quantidade);
  }

  /**
   * Atualiza um placeholder (status=false) com dados de um produto web, marcando status=true
   * e preenchendo colunas (produto_id, provider, external_url, item_nome, descricao, preco, moeda, quantidade).
   */
  async fulfillPlaceholderWithWebProduct(
    cotacaoId: number,
    placeholderId: number,
    produto: any,
    quantidade: number,
    produtoId?: number,
    relatorio?: RelatorioData
  ): Promise<number | null> {
    // Primeiro, buscar o placeholder existente para verificar se já tem relatório
    const { data: existingPlaceholder, error: fetchError } = await supabase
      .from('cotacoes_itens')
      .select('analise_web')
      .eq('id', placeholderId)
      .single();

    if (fetchError) {
      throw new Error(`Falha ao buscar placeholder ${placeholderId}: ${fetchError.message}`);
    }

        // Normalizar analise_web existente para array
        const existingAnalise = Array.isArray((existingPlaceholder as any)?.analise_web)
        ? (existingPlaceholder as any).analise_web
        : ((existingPlaceholder as any)?.analise_web ? [(existingPlaceholder as any).analise_web] : []);
  
      const analiseAtualizada = typeof relatorio !== 'undefined' && relatorio !== null
        ? [...existingAnalise, relatorio]
        : existingAnalise;
  
      // Se não há produto (nenhuma correspondência), apenas anexar análise e manter status inalterado
      if (!produto) {
        const { data, error } = await supabase
          .from('cotacoes_itens')
          .update({ analise_web: analiseAtualizada })
          .eq('id', placeholderId)
          .select('id')
          .single();
  
        if (error) {
          throw new Error(`Falha ao anexar análise web ao placeholder ${placeholderId} na cotação ${cotacaoId}: ${error.message}`);
        }
  
        return data?.id ?? null;
      }
  

    const item_preco = this.parseNumero(produto?.price);
    const provider = this.providerFromUrl(produto?.product_url || produto?.url);

    const updatePayload: any = {
      cotacao_id: cotacaoId,
      produto_id: produtoId || null,
      origem: 'externo',
      provider: provider || undefined,
      external_url: produto?.product_url || produto?.url || undefined,
      item_nome: produto?.name || produto?.nome || 'Produto web',
      item_descricao: produto?.description || produto?.descricao || null,
      item_preco: item_preco ?? null,
      item_moeda: 'AOA',
      quantidade: Number(quantidade || 1),
      status: true,
      analise_web: analiseAtualizada,
    };

    const { data, error } = await supabase
      .from('cotacoes_itens')
      .update(updatePayload)
      .eq('id', placeholderId)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Falha ao atualizar placeholder ${placeholderId} na cotação ${cotacaoId}: ${error.message}`);
    }

    return data?.id ?? null;
  }
  /**
   * Insere itens de um job completo na cotação, aproveitando os IDs salvos
   */
  async insertJobResultItems(cotacaoId: number, jobResult: any): Promise<number> {
    const produtos = jobResult.produtos || [];
    const salvamento = jobResult.salvamento;
    const quantidade = jobResult.quantidade || 1;
    let inseridos = 0;

    // Criar um mapa de nome do produto para ID salvo
    const produtoIdMap = new Map<string, number>();
    
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

    // Inserir cada produto
    for (const produto of produtos) {
      try {
        const produtoId = produtoIdMap.get(produto.name);
        
        if (produtoId) {
          // Usar o ID do produto salvo
          const idItem = await this.insertWebItemById(cotacaoId, produtoId, produto, quantidade);
          if (idItem){ 
            jobResult.relatorio.id_item_cotacao = idItem; // Adiciona o ID do item de cotação ao relatório
            inseridos++;
          }
        }
      } catch (e) {
        console.error('❌ [COTACAO-ITEM] Erro ao inserir item do job:', (e as any)?.message || e);
      }
    }

    return inseridos;
  }

  /**
   * Lista itens de cotação, podendo filtrar por cotacao_id
   */
  async list(cotacao_id?: number) {
    let query = supabase.from('cotacoes_itens').select('*');
    if (cotacao_id) {
      query = query.eq('cotacao_id', cotacao_id);
    }
    console.log('[CotacoesItensService.list] Query:', query);
    const { data, error } = await query;
    console.log('[CotacoesItensService.list] Data:', data);
    console.log('[CotacoesItensService.list] Error:', error);
    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Busca item de cotação por id
   */
  async getById(id: number) {
    const { data, error } = await supabase.from('cotacoes_itens').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
  }async getSugeridosWeb(id: number): Promise<any[]> {
    try {
      const { data: cotacaoItem, error } = await supabase
        .from('cotacoes_itens')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !cotacaoItem) {
        console.error('[getSugeridosWeb] Erro ao buscar cotacaoItem:', error);
        throw new Error('Item de cotação não encontrado');
      }
      // Normaliza analise_web para array
      const analiseWebArr = Array.isArray(cotacaoItem.analise_web)
        ? cotacaoItem.analise_web
        : (cotacaoItem.analise_web ? [cotacaoItem.analise_web] : []);
      let relatorio = {
        analiseWeb: analiseWebArr
      };
      console.log('[getSugeridosWeb] cotacaoItem:', cotacaoItem);
      console.log('[getSugeridosWeb] relatorio:', relatorio);
      if (relatorio && relatorio.analiseWeb && Array.isArray(relatorio.analiseWeb)) {
        const allSugs = relatorio.analiseWeb.flatMap((item: any) => item.top_ranking || []);
        const sugestoes = allSugs.map((item: any) => ({
          nome: item.nome,
          url: item.url,
          preco: item.preco,
          posicao: item.posicao,
          justificativa: item.justificativa,
          pontos_fortes: item.pontos_fortes,
          pontos_fracos: item.pontos_fracos,
          score_estimado: item.score_estimado,
        })) || [];
        console.log('[getSugeridosWeb] sugestões (todos):', sugestoes);
        return sugestoes;
      } else {
        console.warn('[getSugeridosWeb] Relatório não possui analiseWeb ou está vazio:', relatorio);
        return [];
      }
    } catch (err) {
      console.error('[getSugeridosWeb] Erro geral:', err);
      throw err;
    }
  }
  async getSugeridosLocal(id: number): Promise<any[]> {
    try {
      const { data: cotacaoItem, error } = await supabase
        .from('cotacoes_itens')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !cotacaoItem) {
        console.error('[getSugeridosLocal] Erro ao buscar cotacaoItem:', error);
        throw new Error('Item de cotação não encontrado');
      }
      // Normaliza analise_local e analise_cache para array
      const analiseLocalArr = Array.isArray(cotacaoItem.analise_local)
        ? cotacaoItem.analise_local
        : (cotacaoItem.analise_local ? [cotacaoItem.analise_local] : []);
      const analiseCacheArr = Array.isArray(cotacaoItem.analise_cache)
        ? cotacaoItem.analise_cache
        : (cotacaoItem.analise_cache ? [cotacaoItem.analise_cache] : []);
      let relatorio = {
        analiseLocal: analiseLocalArr,
        analiseCache: analiseCacheArr
      };
      console.log('[getSugeridosLocal] cotacaoItem:', cotacaoItem);
      console.log('[getSugeridosLocal] relatorio:', relatorio);
      if (relatorio) {
        const locaisArr = Array.isArray((relatorio as any).analiseLocal)
          ? (relatorio as any).analiseLocal
          : [];

        const cacheArr = Array.isArray((relatorio as any).analiseCache)
          ? (relatorio as any).analiseCache
          : [];

        const localSugs = locaisArr.flatMap((item: any) => item?.llm_relatorio?.top_ranking || []);
        const cacheSugs = cacheArr.flatMap((item: any) => (item?.llm_relatorio?.top_ranking || item?.top_ranking || []));

        const allSugs = [...localSugs, ...cacheSugs];

        if (allSugs.length > 0) {
          const sugestoes = allSugs.map((item: any) => ({
            nome: item.nome,
            id: item.id,
            preco: item.preco,
            posicao: item.posicao,
            justificativa: item.justificativa,
            pontos_fortes: item.pontos_fortes,
            pontos_fracos: item.pontos_fracos,
            score_estimado: item.score_estimado,
          })) || [];
          console.log('[getSugeridosLocal] sugestões (locais + cache):', sugestoes);
          return sugestoes;
        } else {
          console.warn('[getSugeridosLocal] Relatório não possui sugestões em analiseLocal/analiseCache:', relatorio);
          return [];
        }
      } else {
        console.warn('[getSugeridosLocal] Relatório não encontrado para cotação:', cotacaoItem?.cotacao_id);
        return [];
      }
    } catch (err) {
      console.error('[getSugeridosLocal] Erro geral:', err);
      throw err;
    }
  }
}
export default new CotacoesItensService();
