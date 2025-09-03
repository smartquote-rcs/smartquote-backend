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
type JobResultado = {
    produtos?: any[];
    quantidade?: number;
    relatorio?: any;
};
export default class WebBuscaJobService {
    private apiBaseUrl;
    constructor();
    private sleep;
    createJobsForFaltantes(faltantes: Faltante[], solicitacaoFallback: string, ponderacaoWeb_LLM: Boolean): Promise<string[]>;
    waitJobs(statusUrls: string[], maxWaitMs?: number, pollIntervalMs?: number): Promise<{
        resultadosCompletos: JobResultado[];
        produtosWeb: any[];
    }>;
    insertJobResultsInCotacao(cotacaoId: number, resultadosCompletos: JobResultado[]): Promise<number>;
    recalcOrcamento(cotacaoId: number): Promise<number>;
}
export {};
//# sourceMappingURL=WebBuscaJobService.d.ts.map