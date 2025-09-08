"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropostaRenderer = void 0;
const CotacoesService_1 = __importDefault(require("../../CotacoesService"));
class PropostaRenderer {
    doc;
    margin;
    constructor(doc, margin = 50) {
        this.doc = doc;
        this.margin = margin;
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
     * Renders the commercial proposal section in a formal and executive style.
     */
    async render(data) {
        const margin = this.margin;
        const pageWidth = this.doc.page.width;
        const contentWidth = pageWidth - margin * 2;
        // Ensure sufficient page space
        this.verificarEspacoPagina(100);
        // ========== Consolidated Budget Header ==========
        this.doc
            .font('Helvetica-Bold')
            .fontSize(14)
            .fillColor('#003087') // Primary blue
            .text('Orçamento Consolidado', margin, this.doc.y);
        this.doc
            .strokeColor('#003087') // Primary blue
            .lineWidth(2)
            .moveTo(margin, this.doc.y + 8)
            .lineTo(margin + 200, this.doc.y + 8)
            .stroke();
        this.doc.y += 20;
        // ========== Executive Summary Card ==========
        this.verificarEspacoPagina(100);
        const cardY = this.doc.y;
        const cardHeight = 90;
        // Draw card background
        this.doc
            .fillColor('#ffffff') // White
            .strokeColor('#003087') // Primary blue
            .rect(margin, cardY, contentWidth, cardHeight)
            .fillAndStroke();
        // Card title
        this.doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .fillColor('#003087') // Primary blue
            .text('Resumo Executivo da Proposta', margin + 15, cardY + 10);
        // Grid layout for information
        const infoY = cardY + 30;
        const colWidth = contentWidth / 3;
        // Calculate selected items
        const normalizeText = (text) => text
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/\s+/g, ' ')
            .trim();
        const countSelectedItems = (items, isLocal) => items.reduce((count, item) => {
            const rel = isLocal ? item?.llm_relatorio || item : item;
            const choice = normalizeText(rel?.escolha_principal?.toString() || '');
            const ranking = Array.isArray(rel?.top_ranking) ? rel.top_ranking : [];
            if (!choice || ranking.length === 0)
                return count;
            const found = ranking.some((r) => normalizeText(r?.nome?.toString() || '').includes(choice) ||
                choice.includes(normalizeText(r?.nome?.toString() || '')));
            return count + (found ? 1 : 0);
        }, 0);
        const totalItems = countSelectedItems(Array.isArray(data.analiseLocal) ? data.analiseLocal : [], true) +
            countSelectedItems(Array.isArray(data.analiseWeb) ? data.analiseWeb : [], false);
        const budget = data.orcamentoGeral || 0;
        // Determine proposal status
        let status = 'Pendente';
        let statusColor = '#D32F2F'; // Error red
        let badgeBg = '#FFCDD2'; // Error red background
        try {
            const quote = await CotacoesService_1.default.getById(data.cotacaoId);
            if (quote?.status === 'completa') {
                status = 'Completa';
                statusColor = '#2E7D32'; // Success green
                badgeBg = '#C8E6C9'; // Success green background
            }
            else {
                status = 'Incompleta';
                statusColor = '#F57C00'; // Warning orange
                badgeBg = '#FFE0B2'; // Warning orange background
            }
        }
        catch (error) {
            if (totalItems > 0) {
                status = 'Completa';
                statusColor = '#2E7D32'; // Success green
                badgeBg = '#C8E6C9'; // Success green background
            }
        }
        // Column 1: Selected Items
        this.doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#6B7280') // Secondary gray
            .text('Produtos Selecionados', margin + 15, infoY)
            .font('Helvetica-Bold')
            .fontSize(14)
            .fillColor('#111827') // Primary text
            .text(`${totalItems}`, margin + 15, infoY + 10)
            .font('Helvetica')
            .fontSize(8)
            .text('itens', margin + 15, infoY + 25);
        // Column 2: Total Budget
        this.doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#6B7280') // Secondary gray
            .text('Valor Total', margin + 15 + colWidth, infoY)
            .font('Helvetica-Bold')
            .fontSize(12)
            .fillColor('#003087') // Primary blue
            .text(budget.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2 }), margin + 15 + colWidth, infoY + 10);
        // Column 3: Proposal Status
        this.doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#6B7280') // Secondary gray
            .text('Status da Proposta', margin + 15 + colWidth * 2, infoY);
        const badgeWidth = 70;
        const badgeX = margin + 15 + colWidth * 2;
        this.doc
            .fillColor(badgeBg)
            .roundedRect(badgeX, infoY + 8, badgeWidth, 20, 3)
            .fill()
            .font('Helvetica-Bold')
            .fontSize(8)
            .fillColor(statusColor)
            .text(status, badgeX, infoY + 12, { width: badgeWidth, align: 'center' });
        this.doc.y = cardY + cardHeight + 20;
    }
}
exports.PropostaRenderer = PropostaRenderer;
//# sourceMappingURL=PropostaRenderer.js.map