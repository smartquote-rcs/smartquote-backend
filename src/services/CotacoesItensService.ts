import supabase from '../infra/supabase/connect';
import { Product } from '../types/BuscaTypes';

class CotacoesItensService {
  private parseNumero(precoStr?: string): number | null {
    if (!precoStr) return null;
    try {
      const numeroLimpo = precoStr.replace(/[^\d.,]/g, '');
      const normalizado = numeroLimpo.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
      const n = parseFloat(normalizado);
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

  async insertWebItem(cotacaoId: number, produto: Product): Promise<number | null> {
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
}

export default new CotacoesItensService();
