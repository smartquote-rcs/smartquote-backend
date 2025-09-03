/**
 * Serviço para filtrar e limpar links usando LLM
 */
interface SearchResultWeb {
    url: string;
    title?: string;
    description?: string;
    category?: string;
}
export declare class LinkFilterService {
    /**
     * Filtra e limpa links usando LLM para remover sites inadequados
     */
    static filtrarLinksComLLM(links: SearchResultWeb[], termoBusca: string, limite: number): Promise<any[]>;
    /**
     * Limpa URL removendo parâmetros de tracking e query strings
     */
    static limparURL(url: string | undefined): string;
    /**
     * Filtro básico para links quando LLM não está disponível
     */
    static filtroBasicoLinks(links: any[], limite: number): any[];
}
export {};
//# sourceMappingURL=LinkFilterService.d.ts.map