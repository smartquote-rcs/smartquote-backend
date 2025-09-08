import { Product } from '../types/BuscaTypes';
import { RelatorioData } from '../services/relatorio/types';
declare class CotacoesItensService {
    private parseNumero;
    private providerFromUrl;
    /**
     * Insere um placeholder de item de cotação representando um "faltante".
     * Campos principais:
     *  - status: false (não encontrado ainda)
     *  - pedido: texto original (ex: query_sugerida)
     */
    insertPlaceholderItem(cotacaoId: number, faltante: any): Promise<number | null>;
    /**
     * Retorna todos os placeholders (status=false) de uma cotação
     */
    listPlaceholders(cotacaoId: number): Promise<any[]>;
    /**
     * Remove placeholders por índice na lista ordenada por id asc
     */
    removePlaceholderByIndex(cotacaoId: number, index: number): Promise<any | null>;
    /**
     * Remove placeholder por pedido (query) aproximado
     */
    removePlaceholderByPedido(cotacaoId: number, query: string): Promise<any | null>;
    /**
     * Remove placeholder por nome aproximado
     */
    removePlaceholderByNome(cotacaoId: number, nome: string): Promise<any | null>;
    buildPrompt(cotacaoId: number, produto: Product): Promise<number | null>;
    /**
     * Insere item na cotação usando ID do produto já salvo na base de dados
     */
    insertWebItemById(cotacaoId: number, produtoId: number, produto: Product, quantidade: number, relatorio?: RelatorioData): Promise<number | null>;
    /**
     * Insere item local na cotação com análise local
     */
    insertLocalItemById(cotacaoId: number, produtoId: number, produto: any, quantidade: number, analiseLocal?: any): Promise<number | null>;
    /**
     * Atualiza um item existente com análise local
     */
    updateItemWithAnaliseLocal(itemId: number, analiseLocal: any): Promise<boolean>;
    /**
     * Insere item na cotação a partir do resultado de job que contém dados do produto e ID salvo
     */
    insertJobResultItem(cotacaoId: number, jobResult: any): Promise<number | null>;
    /**
     * Atualiza um placeholder (status=false) com dados de um produto web, marcando status=true
     * e preenchendo colunas (produto_id, provider, external_url, item_nome, descricao, preco, moeda, quantidade).
     */
    fulfillPlaceholderWithWebProduct(cotacaoId: number, placeholderId: number, produto: any, quantidade: number, produtoId?: number, relatorio?: RelatorioData): Promise<number | null>;
    /**
     * Insere itens de um job completo na cotação, aproveitando os IDs salvos
     */
    insertJobResultItems(cotacaoId: number, jobResult: any): Promise<number>;
    /**
     * Lista itens de cotação, podendo filtrar por cotacao_id
     */
    list(cotacao_id?: number): Promise<any[]>;
    /**
     * Busca item de cotação por id
     */
    getById(id: number): Promise<any>;
    getSugeridosWeb(id: number): Promise<any[]>;
    getSugeridosLocal(id: number): Promise<any[]>;
}
declare const _default: CotacoesItensService;
export default _default;
//# sourceMappingURL=CotacoesItensService.d.ts.map