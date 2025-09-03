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
    render(data: RelatorioData): void;
    /**
     * Renderiza um item de análise como se fosse um item da proposta
     */
    private renderizarItemAnalise;
}
//# sourceMappingURL=ItemListRenderer.d.ts.map