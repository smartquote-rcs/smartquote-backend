/**
 * Serviço para gerenciar jobs de busca em background
 */
interface JobStatus {
    id: string;
    status: 'pendente' | 'executando' | 'concluido' | 'erro';
    criadoEm: Date;
    iniciadoEm?: Date;
    concluidoEm?: Date;
    parametros: {
        termo: string;
        numResultados: number;
        fornecedores: number[];
        usuarioId?: number;
        quantidade?: number;
        custo_beneficio?: any;
        rigor?: number;
        ponderacao_web_llm?: number;
        refinamento?: boolean;
        salvamento?: boolean;
        faltante_id?: string;
        urls_add?: {
            url: string;
            escala_mercado: string;
        }[];
    };
    progresso?: {
        etapa: 'busca' | 'salvamento';
        fornecedores?: number;
        produtos?: number;
        detalhes?: string;
    };
    resultado?: {
        relatorio?: any;
        produtos?: any[];
        salvamento?: {
            salvos: number;
            erros: number;
            detalhes: any[];
        };
        tempoExecucao?: number;
    };
    erro?: string;
}
declare class JobManager {
    private jobs;
    private processos;
    /**
     * Cria um novo job de busca
     */
    criarJob(termo: string, numResultados: number, fornecedores: number[], usuarioId?: number, quantidade?: number, custo_beneficio?: any, rigor?: number, refinamento?: boolean, salvamento?: boolean, faltante_id?: string, urls_add?: {
        url: string;
        escala_mercado: string;
    }[], ponderacao_web_llm?: number): string;
    /**
     * Executa um job em processo filho
     */
    private executarJob;
    /**
     * Processa mensagens do processo filho
     */
    private processarMensagemDoFilho;
    /**
     * Finaliza um job com erro
     */
    private finalizarJobComErro;
    /**
     * Obtém o status de um job
     */
    getStatusJob(jobId: string): JobStatus | null;
    /**
     * Lista todos os jobs
     */
    listarJobs(limite?: number): JobStatus[];
    /**
     * Cancela um job
     */
    cancelarJob(jobId: string): boolean;
    /**
     * Remove jobs antigos da memória (limpeza)
     */
    limparJobsAntigos(diasParaManter?: number): number;
}
export declare const jobManager: JobManager;
export {};
//# sourceMappingURL=JobManager.d.ts.map