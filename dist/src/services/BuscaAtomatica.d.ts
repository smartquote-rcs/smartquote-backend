import { Product, SearchParams, SearchResult, SearchFilters, BuscaResponse } from "../types/BuscaTypes";
export declare class BuscaAutomatica {
    private firecrawlApp;
    constructor();
    private getProductSchema;
    /**
     * Realiza busca automática de produtos em um website
     * @param params Parâmetros de busca
     * @returns Resultado da busca com produtos encontrados
     */
    buscarProdutos(params: SearchParams): Promise<SearchResult>;
    /**
     * Busca produtos em múltiplos websites
     * @param searchTerm Termo de busca
     * @param websites Array de websites para buscar
     * @param numResultsPerSite Número de resultados por site
     * @returns Array com resultados de cada site
     */
    buscarProdutosMultiplosSites(searchTerm: string, websites: string[], numResultsPerSite?: number): Promise<SearchResult[]>;
    /**
     * Combina resultados de múltiplos sites em um único array
     * @param results Array de resultados de busca
     * @returns Array combinado de produtos
     */
    combinarResultados(results: SearchResult[]): Product[];
    /**
     * Filtra produtos por faixa de preço
     * @param produtos Array de produtos
     * @param precoMin Preço mínimo (opcional)
     * @param precoMax Preço máximo (opcional)
     * @returns Array de produtos filtrados
     */
    filtrarPorPreco(produtos: Product[], precoMin?: number, precoMax?: number): Product[];
    /**
     * Extrai valor numérico de uma string de preço
     * @param precoString String do preço
     * @returns Valor numérico ou null se não conseguir extrair
     */
    private extrairPrecoNumerico;
    /**
     * Cria uma resposta estruturada da busca
     * @param produtos Array de produtos encontrados
     * @param sites Array de sites pesquisados
     * @param filtros Filtros aplicados (opcional)
     * @param tempoBusca Tempo de busca em milissegundos (opcional)
     * @returns Resposta estruturada
     */
    criarRespostaBusca(produtos: Product[], sites: string[], filtros?: SearchFilters, tempoBusca?: number): BuscaResponse;
}
//# sourceMappingURL=BuscaAtomatica.d.ts.map