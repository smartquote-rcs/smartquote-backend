"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderRenderer = void 0;
class HeaderRenderer {
    doc;
    margin;
    constructor(doc, margin = 50) {
        this.doc = doc;
        this.margin = margin;
    }
    /**
     * Adiciona cabeçalho ao documento
     */
    render(data) {
        const margin = this.margin;
        const pageWidth = this.doc.page.width;
        const contentWidth = pageWidth - (margin * 2);
        // Cabeçalho com fundo colorido
        this.doc
            .rect(margin - 20, 20, contentWidth + 40, 120)
            .fillAndStroke('#2c3e50', '#34495e')
            .fill('#ffffff');
        // Logo placeholder (círculo com iniciais)
        this.doc
            .circle(margin + 40, 60, 25)
            .fillAndStroke('#3498db', '#2980b9')
            .fill('#ffffff')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('SQ', margin + 30, 52, { width: 20, align: 'center' });
        // Título principal
        this.doc
            .fill('#ffffff')
            .fontSize(28)
            .font('Helvetica-Bold')
            .text('RELATÓRIO DE COTAÇÃO', margin + 100, 40, { width: contentWidth - 120 });
        // Subtítulo
        this.doc
            .fontSize(14)
            .font('Helvetica')
            .text('Analise Tecnica e Proposta Comercial', margin + 100, 75, { width: contentWidth - 120 });
        // Informações da cotação em caixa
        this.doc
            .fill('#ecf0f1')
            .rect(margin, 160, contentWidth, 80)
            .fillAndStroke('#ecf0f1', '#bdc3c7');
        this.doc
            .fill('#2c3e50')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('INFORMAÇÕES DA COTAÇÃO', margin + 20, 175);
        this.doc
            .fontSize(11)
            .font('Helvetica')
            .text(`Cotação ID: #${data.cotacaoId}`, margin + 20, 195)
            .text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`, margin + 20, 210)
            .text(`Orçamento Total: AOA$ ${data.orcamentoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, -margin - 20, // joga para o lado direito
        195, { align: 'right' })
            .text(`Total de Análises: ${data.analiseLocal.length + data.analiseWeb.length}`, -margin - 20, 210, { align: 'right' });
        // Seção de solicitação com estilo aprimorado
        this.doc
            .fill('#34495e')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('SOLICITAÇÃO DO CLIENTE', margin, 270)
            .moveDown(0.3);
        // Linha decorativa
        this.doc
            .strokeColor('#3498db')
            .lineWidth(3)
            .moveTo(margin, 290)
            .lineTo(margin + 150, 290)
            .stroke();
        // Caixa para solicitação com altura dinâmica
        const solicitacaoHeight = Math.max(60, Math.min(data.solicitacao.length / 3, 120));
        this.doc
            .fill('#f8f9fa')
            .rect(margin, 305, contentWidth, solicitacaoHeight)
            .fillAndStroke('#f8f9fa', '#dee2e6');
        this.doc
            .fill('#2c3e50')
            .fontSize(11)
            .font('Helvetica')
            .text(data.solicitacao, margin + 15, 320, {
            width: contentWidth - 30,
            lineGap: 3
        });
        this.doc.y = 305 + solicitacaoHeight + 20; // Posicionar dinamicamente para próximo conteúdo
    }
}
exports.HeaderRenderer = HeaderRenderer;
//# sourceMappingURL=HeaderRenderer.js.map