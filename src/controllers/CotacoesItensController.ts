import { Request, Response } from 'express';
import CotacoesItensService from '../services/CotacoesItensService';
import supabase from '../infra/supabase/connect';

class CotacoesItensController {
  async list(req: Request, res: Response) {
    try {
      const cotacao_id = req.query.cotacao_id ? Number(req.query.cotacao_id) : undefined;
      const itens = await CotacoesItensService.list(cotacao_id);
      res.json(itens);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar itens de cotação', details: error });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const item = await CotacoesItensService.getById(Number(id));
      if (!item) return res.status(404).json({ error: 'Item não encontrado' });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar item', details: error });
    }
  }

  async replaceProduct(req: Request, res: Response) {
    try {
      const { cotacaoItemId, newProductId } = req.body;

      if (!cotacaoItemId || !newProductId) {
        return res.status(400).json({ 
          error: 'cotacaoItemId e newProductId são obrigatórios' 
        });
      }

      // 1. Verificar se o item existe
      const existingItem = await CotacoesItensService.getById(cotacaoItemId);
      if (!existingItem) {
        return res.status(404).json({ error: 'Item de cotação não encontrado' });
      }

      // 2. Buscar dados do novo produto
      const { data: newProduct, error: productError } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', newProductId)
        .single();

      if (productError || !newProduct) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // 3. Atualizar o item da cotação com os dados do novo produto
      const { data: updatedItem, error: updateError } = await supabase
        .from('cotacoes_itens')
        .update({
          produto_id: newProductId,
          item_nome: newProduct.nome,
          item_descricao: newProduct.descricao || newProduct.nome,
          item_preco: newProduct.preco,
          external_url: newProduct.url || null,
          provider: newProduct.origem || null
        })
        .eq('id', cotacaoItemId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Erro ao atualizar item: ${updateError.message}`);
      }

      // 4. Atualizar análises na tabela relatorios
      const cotacaoId = existingItem.cotacao_id;
      
      // Buscar relatório existente (obrigatório)
      const { data: relatorio, error: relatorioError } = await supabase
        .from('relatorios')
        .select('*')
        .eq('cotacao_id', cotacaoId)
        .single();

      if (relatorioError) {
        throw new Error(`Relatório não encontrado para cotação ${cotacaoId}: ${relatorioError.message}`);
      }

      // Preparar dados de atualização
      const updateData: any = {};
      let analiseUpdated = false;
      
      // Atualizar análise local se existir
      if (relatorio.analise_local && Array.isArray(relatorio.analise_local)) {
        const updatedAnaliseLocal = [...relatorio.analise_local];
        
        // Encontrar elemento com escolha_principal igual ao nome do produto antigo
        const localIndex = updatedAnaliseLocal.findIndex((item: any) => 
          item.llm_relatorio?.escolha_principal === existingItem.item_nome
        );
        
        if (localIndex >= 0) {
          // Atualizar o elemento encontrado
          updatedAnaliseLocal[localIndex] = {
            ...updatedAnaliseLocal[localIndex],
            llm_relatorio: {
              ...updatedAnaliseLocal[localIndex].llm_relatorio,
              escolha_principal: newProduct.nome,
              justificativa_escolha: "Seleção natural - produto substituído por escolha do usuário",
              top_ranking: updatedAnaliseLocal[localIndex].llm_relatorio.top_ranking?.map((rank: any, idx: number) => 
                idx === 0 ? {
                  ...rank,
                  nome: newProduct.nome,
                  preco: newProduct.preco || rank.preco,
                  justificativa: "Produto selecionado manualmente pelo usuário",
                  pontos_fortes: ["Escolha do usuário", "Seleção manual"],
                  score_estimado: 10
                } : rank
              ) || []
            }
          };
          
          updateData.analise_local = updatedAnaliseLocal;
          analiseUpdated = true;
        }
      }

      // Atualizar análise web se existir
      if (relatorio.analise_web && Array.isArray(relatorio.analise_web)) {
        const updatedAnaliseWeb = [...relatorio.analise_web];
        
        // Encontrar elemento com escolha_principal igual ao nome do produto antigo
        const webIndex = updatedAnaliseWeb.findIndex((item: any) => 
          item.escolha_principal === existingItem.item_nome
        );
        
        if (webIndex >= 0) {
          // Atualizar o elemento encontrado
          updatedAnaliseWeb[webIndex] = {
            ...updatedAnaliseWeb[webIndex],
            escolha_principal: newProduct.nome,
            justificativa_escolha: "Seleção natural - produto substituído por escolha do usuário",
            top_ranking: updatedAnaliseWeb[webIndex].top_ranking?.map((rank: any, idx: number) => 
              idx === 0 ? {
                ...rank,
                nome: newProduct.nome,
                preco: newProduct.preco || rank.preco,
                url: newProduct.url || rank.url,
                justificativa: "Produto selecionado manualmente pelo usuário",
                pontos_fortes: ["Escolha do usuário", "Seleção manual"],
                score_estimado: 10
              } : rank
            ) || []
          };
          
          updateData.analise_web = updatedAnaliseWeb;
          analiseUpdated = true;
        }
      }

      // Atualizar relatório se houve mudanças
      if (analiseUpdated) {
        const { error: updateRelatorioError } = await supabase
          .from('relatorios')
          .update(updateData)
          .eq('cotacao_id', cotacaoId);

        if (updateRelatorioError) {
          throw new Error(`Erro ao atualizar relatório: ${updateRelatorioError.message}`);
        }
      }

      res.json({
        success: true,
        message: 'Produto substituído com sucesso',
        updatedItem,
        analiseUpdated
      });

    } catch (error) {
      console.error('Erro ao substituir produto:', error);
      res.status(500).json({ 
        error: 'Erro ao substituir produto', 
        details: error instanceof Error ? error.message : error 
      });
    }
  }

  private parsePrice(priceStr?: string): number | null {
    if (!priceStr) return null;
    try {
      // Remove caracteres não numéricos exceto vírgulas e pontos
      const cleanPrice = priceStr.replace(/[^\d.,]/g, '');
      // Normaliza separadores decimais
      const normalizedPrice = cleanPrice.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
      const price = parseFloat(normalizedPrice);
      return isNaN(price) ? null : price;
    } catch {
      return null;
    }
  }

  private extractProviderFromUrl(url?: string): string | null {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  }
}

export default new CotacoesItensController();
