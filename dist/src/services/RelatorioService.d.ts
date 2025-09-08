import { RelatorioData } from './relatorio/types';
export declare class RelatorioService {
    constructor();
    /**
     * Verifica se a cotação está completa e gera relatório automaticamente
     */
    verificarEgerarRelatorio(cotacaoId: number): Promise<string>;
    /**
     * Gera dados de relatorio
     */
    gerarDadosRelatorio(cotacaoId: number): Promise<RelatorioData>;
    /**
     * Gera relatório completo em PDF para download direto (retorna buffer)
     */
    gerarRelatorioParaDownload(cotacaoId: number): Promise<Buffer>;
    /**
     * Gera o arquivo PDF como buffer para download direto
     */
    private gerarPDFBuffer;
    /**
     * Gera relatório completo em PDF
     */
    gerarRelatorioCompleto(cotacaoId: number): Promise<string>;
    /**
     * Gera o arquivo PDF usando os componentes modulares
     */
    private gerarPDF;
    /**
     * Verifica se existe relatório para uma cotação
     */
    verificarExistenciaRelatorio(cotacaoId: number): Promise<boolean>;
}
declare const _default: RelatorioService;
export default _default;
//# sourceMappingURL=RelatorioService.d.ts.map