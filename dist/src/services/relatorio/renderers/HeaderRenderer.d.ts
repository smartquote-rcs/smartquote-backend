import { RelatorioData } from '../types';
export declare class HeaderRenderer {
    private doc;
    private margin;
    constructor(doc: PDFKit.PDFDocument, margin?: number);
    /**
     * Adiciona cabeçalho ao documento
     */
    render(data: RelatorioData): void;
}
//# sourceMappingURL=HeaderRenderer.d.ts.map