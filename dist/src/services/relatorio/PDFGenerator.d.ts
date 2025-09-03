import { RelatorioData } from './types';
export declare class PDFGenerator {
    private doc;
    private margin;
    private headerRenderer;
    private propostaRenderer;
    private itemListRenderer;
    private emailRenderer;
    private footerRenderer;
    constructor(doc: PDFKit.PDFDocument);
    /**
     * Verifica se há espaço suficiente na página atual
     */
    verificarEspacoPagina(minHeight: number): void;
    /**
     * Adiciona cabeçalho ao documento
     */
    adicionarCabecalho(data: RelatorioData): void;
    /**
     * Adiciona seção de proposta comercial
     */
    adicionarSecaoProposta(data: RelatorioData): void;
    /**
     * Adiciona template de email com design contínuo
     */
    adicionarTemplateEmail(data: RelatorioData): void;
    /**
     * Adiciona rodapé ao documento
     */
    adicionarRodape(): void;
}
//# sourceMappingURL=PDFGenerator.d.ts.map