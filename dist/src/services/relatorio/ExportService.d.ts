export interface RelatorioResumoData {
    cotacaoId: number;
    cotacaoStatus: string;
    orcamentoGeral: number;
    solicitacao: string;
    dataGeracao: Date;
    itens: ItemResumo[];
    dadosUsuario: {
        email?: string;
        position?: string;
        nome?: string;
    };
    faltantes?: any[];
}
export interface ItemResumo {
    nome: string;
    descricao: string;
    preco: number;
    quantidade: number;
    subtotal: number;
    origem: string;
    provider?: string;
}
export declare class ExportService {
    /**
     * Busca dados resumidos da cotação para exportação
     */
    buscarDadosResumo(cotacaoId: number): Promise<RelatorioResumoData>;
    /**
     * Gera relatório em formato CSV
     */
    gerarCSV(cotacaoId: number): Promise<string>;
    /**
     * Gera relatório em formato Excel (XLSX)
     */
    gerarXLSX(cotacaoId: number): Promise<Buffer>;
    /**
     * Aplica estilização básica à planilha (largura das colunas)
     */
    private aplicarEstilizacao;
    /**
     * Aplica estilização específica para tabelas (cabeçalho colorido)
     */
    private aplicarEstilizacaoTabela;
}
//# sourceMappingURL=ExportService.d.ts.map