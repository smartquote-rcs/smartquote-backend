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
     * Adiciona seção de proposta comercial
     */
    render(data: RelatorioData): void;
}
//# sourceMappingURL=PropostaRenderer.d.ts.map