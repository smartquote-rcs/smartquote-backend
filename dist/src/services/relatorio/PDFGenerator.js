"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFGenerator = void 0;
const HeaderRenderer_1 = require("./renderers/HeaderRenderer");
const PropostaRenderer_1 = require("./renderers/PropostaRenderer");
const ItemListRenderer_1 = require("./renderers/ItemListRenderer");
const EmailRenderer_1 = require("./renderers/EmailRenderer");
const FooterRenderer_1 = require("./renderers/FooterRenderer");
const TermsRenderer_1 = require("./renderers/TermsRenderer");
class PDFGenerator {
    doc;
    margin = 50;
    headerRenderer;
    propostaRenderer;
    itemListRenderer;
    emailRenderer;
    footerRenderer;
    termsRenderer;
    constructor(doc) {
        this.doc = doc;
        this.headerRenderer = new HeaderRenderer_1.HeaderRenderer(doc, this.margin);
        this.propostaRenderer = new PropostaRenderer_1.PropostaRenderer(doc, this.margin);
        this.itemListRenderer = new ItemListRenderer_1.ItemListRenderer(doc, this.margin);
        this.emailRenderer = new EmailRenderer_1.EmailRenderer(doc, this.margin);
        this.footerRenderer = new FooterRenderer_1.FooterRenderer(doc, this.margin);
        this.termsRenderer = new TermsRenderer_1.TermsRenderer(doc, this.margin);
    }
    /**
     * Verifica se há espaço suficiente na página atual
     */
    verificarEspacoPagina(minHeight) {
        const currentY = this.doc.y;
        const pageHeight = this.doc.page.height;
        const bottomMargin = this.doc.page.margins.bottom;
        const availableSpace = pageHeight - bottomMargin - currentY;
        if (availableSpace < minHeight) {
            this.doc.addPage();
        }
    }
    /**
     * Adiciona cabeçalho ao documento
     */
    adicionarCabecalho(data) {
        this.headerRenderer.render(data);
    }
    /**
     * Adiciona seção de proposta comercial
     */
    async adicionarSecaoProposta(data) {
        await this.propostaRenderer.render(data);
        await this.itemListRenderer.render(data);
    }
    /**
     * Adiciona seção de condições comerciais
     */
    adicionarCondicoesComerciais(data) {
        this.termsRenderer.render(data);
    }
    /**
     * Adiciona template de email com design contínuo
     */
    async adicionarTemplateEmail(data) {
        try {
            await this.emailRenderer.render(data);
        }
        catch (err) {
            console.error('[PDF] Falha ao renderizar template de e-mail, seguindo sem esta seção:', err);
        }
    }
    /**
     * Adiciona rodapé ao documento
     */
    adicionarRodape() {
        this.footerRenderer.render();
    }
}
exports.PDFGenerator = PDFGenerator;
//# sourceMappingURL=PDFGenerator.js.map