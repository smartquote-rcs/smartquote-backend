import { RelatorioData } from '../types';
export declare class PropostaRenderer {
    private doc;
    private margin;
    constructor(doc: PDFKit.PDFDocument, margin?: number);
    /**
     * Verifica se há espaço suficiente na página atual
     */
    private verificarEspacoPagina;
    /**
     * Renders the commercial proposal section in a formal and executive style.
     */
    render(data: RelatorioData): Promise<void>;
}
//# sourceMappingURL=PropostaRenderer.d.ts.map