import { RelatorioData } from '../types';
export declare class TermsRenderer {
    private doc;
    private margin;
    constructor(doc: PDFKit.PDFDocument, margin?: number);
    /**
     * Verifica se há espaço suficiente na página atual
     */
    private verificarEspacoPagina;
    /**
     * Renderiza as condições comerciais
     */
    render(data: RelatorioData): void;
}
//# sourceMappingURL=TermsRenderer.d.ts.map