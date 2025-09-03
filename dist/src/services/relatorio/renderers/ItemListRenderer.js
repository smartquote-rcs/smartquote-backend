"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemListRenderer = void 0;
class ItemListRenderer {
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
     * Renderiza a lista de itens
     */
    render(data) {
        const margin = this.margin;
        const pageWidth = this.doc.page.width;
        const contentWidth = pageWidth - (margin * 2);
        // ========== LISTA DE ITENS ==========
        const totalItensData = data.analiseLocal.length + data.analiseWeb.length;
        if (totalItensData > 0) {
            this.doc.addPage();
            // Header da seção de itens
            const itemsHeaderY = this.doc.y;
            this.doc
                .fill('#34495e')
                .fontSize(16)
                .font('Helvetica-Bold')
                .text('ITENS INCLUÍDOS NA PROPOSTA', margin, itemsHeaderY);
            // Linha decorativa moderna
            this.doc
                .fill('#3498db')
                .rect(margin, itemsHeaderY + 25, 180, 2)
                .fill();
            this.doc.y = itemsHeaderY + 40;
            // Processar análises locais como itens
            data.analiseLocal.forEach((analise, index) => {
                if (analise.llm_relatorio?.top_ranking && analise.llm_relatorio.top_ranking.length > 0) {
                    const item = analise.llm_relatorio.top_ranking[0]; // Pegar o primeiro item do ranking
                    this.renderizarItemAnalise(item, index, analise.llm_relatorio, true, contentWidth);
                }
            });
            // Processar análises web como itens
            data.analiseWeb.forEach((analise, index) => {
                if (analise.top_ranking && analise.top_ranking.length > 0) {
                    const item = analise.top_ranking[0]; // Pegar o primeiro item do ranking
                    this.renderizarItemAnalise(item, index + data.analiseLocal.length, analise, false, contentWidth);
                }
            });
        }
    }
    /**
     * Renderiza um item de análise como se fosse um item da proposta
     */
    renderizarItemAnalise(item, index, analise, isLocal, contentWidth) {
        const margin = this.margin;
        const preco = parseFloat(item.preco?.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const quantidade = 1; // Assumir quantidade 1 para análises
        const total = preco * quantidade;
        // ========== CÁLCULO DINÂMICO DA ALTURA ==========
        let itemHeight = 30; // padding superior
        // Altura do header (incluindo nome do produto que pode ser multilinha)
        this.doc.fontSize(13).font('Helvetica-Bold');
        const nomeHeight = this.doc.heightOfString(item.nome, {
            width: contentWidth - 280,
            lineGap: 2
        });
        itemHeight += Math.max(nomeHeight, 25) + 10; // mínimo 25px para o header
        // Altura da descrição
        this.doc.fontSize(10).font('Helvetica');
        const descricao = item.descricao || analise.escolha_principal || 'Descrição não informada';
        const descHeight = this.doc.heightOfString(descricao, {
            width: contentWidth - 40,
            lineGap: 3
        });
        itemHeight += descHeight + 25; // altura + espaçamento
        // Altura dos dados técnicos
        itemHeight += 45;
        // Altura da análise IA (se existir)
        if (analise.escolha_principal) {
            this.doc.fontSize(9).font('Helvetica');
            const analiseHeight = this.doc.heightOfString(analise.escolha_principal, { width: contentWidth - 60, lineGap: 2 });
            itemHeight += analiseHeight + 40; // altura do texto + header + padding
        }
        itemHeight += 25; // padding inferior
        // Verificar se cabe na página
        this.verificarEspacoPagina(itemHeight);
        const itemY = this.doc.y;
        // ========== DESENHO DO CARD DO ITEM ==========
        // Sombra simulada
        this.doc
            .fill('#f5f5f5')
            .rect(margin + 2, itemY + 2, contentWidth - 4, itemHeight - 4)
            .fill();
        // Card principal
        this.doc
            .fill('#ffffff')
            .rect(margin, itemY, contentWidth, itemHeight)
            .fillAndStroke('#ffffff', '#e1e8ed');
        // Borda lateral colorida por posição
        const borderColors = ['#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
        const borderColor = borderColors[index % borderColors.length];
        this.doc
            .fill(borderColor)
            .rect(margin, itemY, 5, itemHeight)
            .fill();
        // ========== HEADER DO ITEM ==========
        const itemHeaderY = itemY + 20;
        // Número do item em badge
        this.doc
            .fill(borderColor)
            .roundedRect(margin + 20, itemHeaderY - 5, 32, 26, 13)
            .fill()
            .fill('#ffffff')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(`${index + 1}`, margin + 31, itemHeaderY + 3);
        // Nome do produto (usar a altura já calculada)
        this.doc
            .fill('#1a1a1a')
            .fontSize(13)
            .font('Helvetica-Bold')
            .text(item.nome, margin + 65, itemHeaderY, {
            width: contentWidth - 280,
            lineGap: 2 // Permitir múltiplas linhas sem truncar
        });
        // Preço total em destaque (ajustar posição baseada na altura do nome para centralizar verticalmente)
        const headerMinHeight = Math.max(nomeHeight, 25);
        const precoY = itemHeaderY + (headerMinHeight - 26) / 2; // Centralizar a caixa de preço verticalmente no header
        const precoBoxX = margin + contentWidth - 130;
        this.doc
            .fill('#e8f5e8')
            .roundedRect(precoBoxX, precoY, 120, 26, 13)
            .fill()
            .fill('#27ae60')
            .fontSize(13)
            .font('Helvetica-Bold')
            .text(`${total.toLocaleString('pt-AO', {
            style: 'currency',
            currency: 'AOA'
        })}`, precoBoxX + 5, precoY + 6, { width: 110, align: 'center' });
        // ========== DESCRIÇÃO ==========
        const descY = itemHeaderY + headerMinHeight + 15;
        this.doc
            .fill('#666666')
            .fontSize(8)
            .font('Helvetica-Bold')
            .text('DESCRIÇÃO', margin + 20, descY);
        this.doc
            .fill('#333333')
            .fontSize(10)
            .font('Helvetica')
            .text(descricao, margin + 20, descY + 12, {
            width: contentWidth - 40,
            lineGap: 3,
            continued: false // Não truncar o texto
        });
        // ========== DADOS TÉCNICOS EM GRID ==========
        const techY = descY + descHeight + 25;
        // Fundo sutil para a área técnica
        this.doc
            .fill('#f8f9fa')
            .rect(margin + 15, techY - 5, contentWidth - 30, 35)
            .fill();
        // Grid de informações com colunas dinâmicas
        const techColWidth = (contentWidth - 40) / 4;
        const techData = [
            { label: 'PREÇO UNIT.', value: preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }), x: margin + 20 },
            { label: 'QUANTIDADE', value: `${quantidade} un.`, x: margin + 20 + techColWidth },
            { label: 'ORIGEM', value: isLocal ? 'LOCAL' : 'WEB', x: margin + 20 + (techColWidth * 2) },
            { label: 'SUBTOTAL', value: total.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }), x: margin + 20 + (techColWidth * 3) }
        ];
        techData.forEach(tech => {
            this.doc
                .fill('#7f8c8d')
                .fontSize(7)
                .font('Helvetica-Bold')
                .text(tech.label, tech.x, techY + 2)
                .fill('#2c3e50')
                .fontSize(10)
                .font('Helvetica-Bold')
                .text(tech.value, tech.x, techY + 15);
        });
        // ========== ANÁLISE IA ==========
        if (analise.escolha_principal) {
            const analiseY = techY + 50;
            // Fundo da análise IA
            this.doc
                .fill('#f8f4ff')
                .roundedRect(margin + 15, analiseY - 8, contentWidth - 30, 30, 10)
                .fill();
            // Badge IA
            this.doc
                .fill('#8e44ad')
                .circle(margin + 35, analiseY + 7, 10)
                .fill()
                .fill('#ffffff')
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('AI', margin + 31, analiseY + 3);
            // Label da análise
            this.doc
                .fill('#8e44ad')
                .fontSize(9)
                .font('Helvetica-Bold')
                .text('ANÁLISE INTELIGENTE', margin + 55, analiseY + 3);
            // Conteúdo da análise
            this.doc
                .fill('#5d4e75')
                .fontSize(9)
                .font('Helvetica')
                .text(analise.escolha_principal, margin + 25, analiseY + 25, { width: contentWidth - 60, lineGap: 2 });
        }
        // Atualizar posição Y
        this.doc.y = itemY + itemHeight + 20;
    }
}
exports.ItemListRenderer = ItemListRenderer;
//# sourceMappingURL=ItemListRenderer.js.map