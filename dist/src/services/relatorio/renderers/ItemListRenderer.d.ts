import { RelatorioData } from '../types';
export declare class ItemListRenderer {
    private doc;
    private margin;
    constructor(doc: PDFKit.PDFDocument, margin?: number);
    /**
     * Verifica se há espaço suficiente na página atual
     */
    private verificarEspacoPagina;
    /**
     * Renderiza a lista de itens
     */
    render(data: RelatorioData): Promise<void>;
    /**
     * Renderiza um item de análise como se fosse um item da proposta
     */
    private renderizarItemAnalise;
    private encontrarItemEscolhido;
    private normalizarTexto;
    private renderizarCardNaoEncontrado;
    /**
     * Renderiza um item da cotação baseado nos dados da tabela cotacoes_itens
     */
    private renderizarItemCotacao;
    /**
     * Renderiza um card para itens não escolhidos (status = false)
     */
    private renderizarCardNaoEscolhido;
    /**
     * Método de fallback para usar a lógica antiga em caso de erro
     */
    private renderFallback;
}
//# sourceMappingURL=ItemListRenderer.d.ts.map