/**
 * Serviço para calcular ponderação de busca externa usando LLM
 */
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
export declare class PonderacaoWebService {
    /**
     * Adiciona ponderação de busca externa para cada faltante usando LLM
     */
    static ponderarWebLLM(faltantes: Faltante[]): Promise<Faltante[]>;
    /**
     * Ponderação padrão quando LLM não está disponível
     */
    static ponderacaoPadrao(faltantes: Faltante[]): Faltante[];
}
export default PonderacaoWebService;
//# sourceMappingURL=PonderacaoWebService.d.ts.map