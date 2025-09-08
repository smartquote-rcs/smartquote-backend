type Faltante = {
    id?: number;
    item_id?: number;
    query_sugerida?: string;
    nome?: string;
    categoria?: string;
    quantidade?: number;
    custo_beneficio?: any;
    rigor?: any;
    ponderacao_busca_externa?: number;
};
type JobResultado = {
    produtos?: any[];
    quantidade?: number;
    relatorio?: any;
};
export default class WebBuscaJobService {
    private apiBaseUrl;
    constructor();
    /**
     * Orquestra a criação de jobs e, caso não haja produtos escolhidos após a primeira rodada,
     * cria jobs de reforço usando sites sugeridos (urls_add) e retorna os resultados combinados.
     */
    createJobsForFaltantesWithReforco(faltantes: Faltante[], solicitacaoFallback: string, ponderacaoWeb_LLM: Boolean): Promise<{
        resultadosCompletos: (JobResultado & {
            tipo_busca?: 'principal' | 'reforco';
        })[];
        produtosWeb: any[];
    }>;
    private sleep;
    createJobsForFaltantes(faltantes: Faltante[], solicitacaoFallback: string, ponderacaoWeb_LLM: Boolean): Promise<string[]>;
    waitJobs(statusUrls: string[], maxWaitMs?: number, pollIntervalMs?: number): Promise<{
        resultadosCompletos: (JobResultado & {
            tipo_busca?: 'principal' | 'reforco';
        })[];
        produtosWeb: any[];
    }>;
    insertJobResultsInCotacao(cotacaoId: number, resultadosCompletos: (JobResultado & {
        tipo_busca?: 'principal' | 'reforco';
    })[]): Promise<number>;
    recalcOrcamento(cotacaoId: number): Promise<number>;
}
export {};
//# sourceMappingURL=WebBuscaJobService.d.ts.map