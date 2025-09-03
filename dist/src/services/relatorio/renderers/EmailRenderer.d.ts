import { RelatorioData } from '../types';
export declare class EmailRenderer {
    private doc;
    private margin;
    constructor(doc: PDFKit.PDFDocument, margin?: number);
    /**
     * Verifica se há espaço suficiente na página atual
     */
    private verificarEspacoPagina;
    /**
     * Adiciona template de email com design contínuo
     */
    render(data: RelatorioData): Promise<void>;
    /**
     * Gera template de email em texto
     */
    private gerarTemplateEmailTexto;
}
//# sourceMappingURL=EmailRenderer.d.ts.map