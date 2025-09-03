import { Product } from '../types/BuscaTypes';
declare class CotacoesItensService {
    private parseNumero;
    private providerFromUrl;
    buildPrompt(cotacaoId: number, produto: Product): Promise<number | null>;
    /**
     * Insere item na cotação usando ID do produto já salvo na base de dados
     */
    insertWebItemById(cotacaoId: number, produtoId: number, produto: Product, quantidade: number): Promise<number | null>;
    /**
     * Insere item na cotação a partir do resultado de job que contém dados do produto e ID salvo
     */
    insertJobResultItem(cotacaoId: number, jobResult: any): Promise<number | null>;
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