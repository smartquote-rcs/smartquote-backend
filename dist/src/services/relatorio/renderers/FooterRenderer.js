"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FooterRenderer = void 0;
class FooterRenderer {
    doc;
    margin;
    constructor(doc, margin = 50) {
        this.doc = doc;
        this.margin = margin;
    }
    /**
     * Adiciona rodapé ao documento
     */
    render() {
        try {
            const pageRange = this.doc.bufferedPageRange();
            if (!pageRange || pageRange.count === 0) {
                console.log('⚠️ [RELATORIO] Nenhuma página para adicionar rodapé');
                return;
            }
            const pageCount = pageRange.count;
            const startPage = pageRange.start;
            const margin = this.margin;
            const pageWidth = this.doc.page.width;
            const contentWidth = pageWidth - (margin * 2);
            console.log(`📄 [RELATORIO] Adicionando rodapé em ${pageCount} páginas (${startPage} a ${startPage + pageCount - 1})`);
            for (let i = 0; i < pageCount; i++) {
                const pageIndex = startPage + i;
                this.doc.switchToPage(pageIndex);
                const footerY = this.doc.page.height - this.doc.page.margins.bottom - 30;
                // Linha decorativa no rodapé
                this.doc
                    .strokeColor('#3498db')
                    .lineWidth(1)
                    .moveTo(margin, footerY)
                    .lineTo(margin + contentWidth, footerY)
                    .stroke();
                // Informações do rodapé
                this.doc
                    .fill('#7f8c8d')
                    .fontSize(9)
                    .font('Helvetica')
                    .text(`SmartQuote System - Relatório Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, footerY + 10, { width: contentWidth / 2 })
                    .text(`Página ${i + 1} de ${pageCount}`, margin + contentWidth / 2, footerY + 10, { width: contentWidth / 2, align: 'right' });
            }
        }
        catch (error) {
            console.error('❌ [RELATORIO] Erro ao adicionar rodapé:', error);
            // Não falhar a geração do PDF por causa do rodapé
        }
    }
}
exports.FooterRenderer = FooterRenderer;
//# sourceMappingURL=FooterRenderer.js.map