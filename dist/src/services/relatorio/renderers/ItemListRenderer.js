"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemListRenderer = void 0;
const theme_1 = require("../theme");
const CotacoesItensService_1 = __importDefault(require("../../CotacoesItensService"));
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
    async render(data) {
        const margin = this.margin;
        const pageWidth = this.doc.page.width;
        const contentWidth = pageWidth - (margin * 2);
        // ========== BUSCAR ITENS DA COTAÇÃO ==========
        try {
            const itensData = await CotacoesItensService_1.default.list(data.cotacaoId);
            const itensEscolhidos = itensData.filter((item) => item.status === true);
            const itensNaoEscolhidos = itensData.filter((item) => item.status === false);
            const totalItens = itensEscolhidos.length + itensNaoEscolhidos.length;
            if (totalItens > 0) {
                this.doc.addPage();
                // Cabeçalho da seção organizado
                const itemsHeaderY = this.doc.y;
                this.doc
                    .fill(theme_1.theme.info.main)
                    .fontSize(14)
                    .font('Helvetica-Bold')
                    .text('ITENS INCLUÍDOS NA PROPOSTA', margin, itemsHeaderY);
                // Linha de destaque corporativa
                this.doc
                    .strokeColor(theme_1.theme.info.main)
                    .lineWidth(2)
                    .moveTo(margin, itemsHeaderY + 20)
                    .lineTo(margin + 250, itemsHeaderY + 20)
                    .stroke();
                this.doc.y = itemsHeaderY + 40;
                // Índice sequencial só para blocos exibidos
                let seqIndex = 0;
                // Renderizar itens escolhidos
                itensEscolhidos.forEach((item) => {
                    this.renderizarItemCotacao(item, seqIndex++, contentWidth, true);
                });
                // Renderizar itens não escolhidos como cards
                itensNaoEscolhidos.forEach((item) => {
                    this.renderizarCardNaoEscolhido(seqIndex++, item, contentWidth);
                });
            }
        }
        catch (error) {
            console.error('[ItemListRenderer] Erro ao buscar itens da cotação:', error);
            // Fallback para o método antigo se houver erro
            this.renderFallback(data, contentWidth);
        }
    }
    /**
     * Renderiza um item de análise como se fosse um item da proposta
     */
    renderizarItemAnalise(item, index, analise, isLocal, contentWidth) {
        const margin = this.margin;
        // Conversão segura do preço
        let preco = 0;
        if (item.preco) {
            if (typeof item.preco === 'string') {
                // Normalizar parsing de preço
                let precoLimpo = item.preco.replace(/[^\d.,]/g, '');
                if (precoLimpo.includes(',')) {
                    if (precoLimpo.includes('.')) {
                        precoLimpo = precoLimpo.replace(/\./g, '').replace(',', '.');
                    }
                    else {
                        precoLimpo = precoLimpo.replace(',', '.');
                    }
                }
                preco = parseFloat(precoLimpo) || 0;
            }
            else if (typeof item.preco === 'number') {
                preco = item.preco;
            }
            else {
                // Normalizar parsing de preço
                let precoLimpo = String(item.preco).replace(/[^\d.,]/g, '');
                if (precoLimpo.includes(',')) {
                    if (precoLimpo.includes('.')) {
                        precoLimpo = precoLimpo.replace(/\./g, '').replace(',', '.');
                    }
                    else {
                        precoLimpo = precoLimpo.replace(',', '.');
                    }
                }
                preco = parseFloat(precoLimpo) || 0;
            }
        }
        const quantidade = 1;
        const total = preco * quantidade;
        // ========== CÁLCULO DA ALTURA ==========
        let itemHeight = 10;
        // Altura do nome do produto
        this.doc.fontSize(10).font('Times-Bold');
        const nomeHeight = this.doc.heightOfString(item.nome, {
            width: contentWidth - 120,
            lineGap: 1
        });
        itemHeight += nomeHeight + 8;
        // Altura da descrição
        this.doc.fontSize(8).font('Times-Roman');
        const descricao = item.descricao || analise.escolha_principal || 'Descrição não informada';
        const descHeight = this.doc.heightOfString(descricao, {
            width: contentWidth - 20,
            lineGap: 1
        });
        itemHeight += descHeight + 5;
        // Altura da análise (se existir)
        if (analise.escolha_principal && analise.escolha_principal !== descricao) {
            this.doc.fontSize(7).font('Times-Italic');
            const analiseHeight = this.doc.heightOfString(analise.escolha_principal, { width: contentWidth - 20, lineGap: 1 });
            itemHeight += analiseHeight + 8;
        }
        itemHeight += 12; // linha de dados + espaçamento
        // Verificar espaço na página
        this.verificarEspacoPagina(itemHeight);
        const itemY = this.doc.y;
        // ========== LINHA DE ITEM ==========
        // Número e nome do produto
        this.doc
            .fill('#333333')
            .fontSize(9)
            .font('Helvetica-Bold')
            .text(`${index + 1}.`, margin, itemY);
        this.doc
            .fill('#000000')
            .fontSize(10)
            .font('Times-Bold')
            .text(item.nome, margin + 18, itemY, {
            width: contentWidth - 140,
            lineGap: 1
        });
        // Preço alinhado à direita
        this.doc
            .fill('#000000')
            .fontSize(10)
            .font('Times-Bold')
            .text(total.toLocaleString('pt-AO', {
            style: 'currency',
            currency: 'AOA'
        }), margin + contentWidth - 120, itemY, { width: 115, align: 'right' });
        // Descrição
        const descY = itemY + nomeHeight + 5;
        this.doc
            .fill('#444444')
            .fontSize(8)
            .font('Times-Roman')
            .text(descricao, margin + 18, descY, {
            width: contentWidth - 20,
            lineGap: 1
        });
        // Análise técnica (se diferente da descrição)
        let currentY = descY + descHeight + 3;
        if (analise.escolha_principal && analise.escolha_principal !== descricao) {
            this.doc
                .fill('#666666')
                .fontSize(7)
                .font('Times-Italic')
                .text(`Análise: ${analise.escolha_principal}`, margin + 18, currentY, { width: contentWidth - 20, lineGap: 1 });
            const analiseHeight = this.doc.heightOfString(`Análise: ${analise.escolha_principal}`, { width: contentWidth - 20, lineGap: 1 });
            currentY += analiseHeight + 5;
        }
        // Informações técnicas em linha compacta
        const techInfo = `Preço: ${preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} • Qtd: ${quantidade} • Fonte: ${isLocal ? 'Local' : 'Web'}`;
        this.doc
            .fill('#777777')
            .fontSize(7)
            .font('Helvetica')
            .text(techInfo, margin + 18, currentY);
        // Linha separadora sutil
        this.doc
            .strokeColor('#eeeeee')
            .lineWidth(0.3)
            .moveTo(margin, currentY + 15)
            .lineTo(margin + contentWidth, currentY + 15)
            .stroke();
        // Atualizar posição
        this.doc.y = currentY + 20;
    }
    // Seleciona o item escolhido conforme a escolha_principal
    encontrarItemEscolhido(analise) {
        const ranking = Array.isArray(analise?.top_ranking) ? analise.top_ranking : [];
        const escolha = (analise?.escolha_principal || '').toString().trim();
        if (!escolha)
            return null;
        const alvo = this.normalizarTexto(escolha);
        const encontrado = ranking.find((r) => {
            const nome = this.normalizarTexto((r?.nome || '').toString());
            return nome && (nome.includes(alvo) || alvo.includes(nome));
        });
        return encontrado || null;
    }
    normalizarTexto(t) {
        return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
    }
    // Card corporativo de aviso quando não há item selecionado/encontrado
    renderizarCardNaoEncontrado(index, analise, isLocal, contentWidth) {
        const margin = this.margin;
        const minHeight = 130;
        this.verificarEspacoPagina(minHeight);
        const itemY = this.doc.y;
        // Sombra sutil para o card
        this.doc
            .fill('#f8f9fa')
            .rect(margin + 2, itemY + 2, contentWidth, minHeight)
            .fill();
        // Card principal corporativo
        this.doc
            .fill('#ffffff')
            .rect(margin, itemY, contentWidth, minHeight)
            .fillAndStroke('#ffffff', '#e9ecef');
        // Borda lateral de aviso elegante
        this.doc
            .fill(theme_1.theme.warning.main)
            .rect(margin, itemY, 4, minHeight)
            .fill();
        // Linha de destaque superior
        this.doc
            .fill('#fff8e1')
            .rect(margin + 4, itemY, contentWidth - 4, 3)
            .fill();
        const headerY = itemY + 20;
        // Badge índice corporativo
        this.doc
            .fill('#fff3cd')
            .roundedRect(margin + 16, headerY - 8, 32, 26, 13)
            .fillAndStroke('#fff3cd', theme_1.theme.warning.stroke)
            .fill(theme_1.theme.warning.main)
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(`${index + 1}`, margin + 28, headerY + 1, { width: 20, align: 'center' });
        // Título corporativo
        this.doc
            .fill(theme_1.theme.text.primary)
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('ITEM NÃO IDENTIFICADO', margin + 70, headerY);
        // Subtítulo explicativo
        this.doc
            .fill(theme_1.theme.text.muted)
            .fontSize(8)
            .font('Helvetica')
            .text('Status da análise', margin + 70, headerY + 18);
        // Separador elegante
        this.doc
            .strokeColor('#e9ecef')
            .lineWidth(1)
            .moveTo(margin + 20, headerY + 38)
            .lineTo(margin + contentWidth - 20, headerY + 38)
            .stroke();
        // Mensagem corporativa
        const origem = isLocal ? 'análise de banco de dados interno' : 'pesquisa de mercado web';
        const mensagem = `Não foi possível identificar um produto específico selecionado nesta ${origem}. Verifique os critérios de análise ou dados de entrada.`;
        this.doc
            .fill(theme_1.theme.text.primary)
            .fontSize(9)
            .font('Helvetica')
            .text(mensagem, margin + 25, headerY + 50, { width: contentWidth - 50, lineGap: 3 });
        // Card de referência sofisticado
        if (analise?.escolha_principal) {
            this.doc
                .fill('#fef3e2')
                .roundedRect(margin + 25, headerY + 85, contentWidth - 50, 32, 6)
                .fillAndStroke('#fef3e2', theme_1.theme.warning.stroke);
            this.doc
                .fill(theme_1.theme.warning.main)
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('REFERÊNCIA DISPONÍVEL:', margin + 35, headerY + 93, { continued: true })
                .fill(theme_1.theme.text.primary)
                .font('Helvetica')
                .text(` ${analise.escolha_principal}`, { width: contentWidth - 80 });
        }
        this.doc.y = itemY + minHeight + 25;
    }
    /**
     * Renderiza um item da cotação baseado nos dados da tabela cotacoes_itens
     */
    renderizarItemCotacao(item, index, contentWidth, isEscolhido) {
        const margin = this.margin;
        // Conversão segura do preço
        let preco = 0;
        if (item.item_preco) {
            if (typeof item.item_preco === 'string') {
                // Normalizar parsing de preço
                let precoLimpo = item.item_preco.replace(/[^\d.,]/g, '');
                if (precoLimpo.includes(',')) {
                    if (precoLimpo.includes('.')) {
                        precoLimpo = precoLimpo.replace(/\./g, '').replace(',', '.');
                    }
                    else {
                        precoLimpo = precoLimpo.replace(',', '.');
                    }
                }
                preco = parseFloat(precoLimpo) || 0;
            }
            else if (typeof item.item_preco === 'number') {
                preco = item.item_preco;
            }
        }
        const quantidade = item.quantidade || 1;
        const total = preco * quantidade;
        // ========== CÁLCULO DA ALTURA ==========
        let itemHeight = 10;
        // Altura do nome do produto
        this.doc.fontSize(10).font('Times-Bold');
        const nome = item.item_nome || 'Item sem nome';
        const nomeHeight = this.doc.heightOfString(nome, {
            width: contentWidth - 120,
            lineGap: 1
        });
        itemHeight += nomeHeight + 8;
        // Altura da descrição
        this.doc.fontSize(8).font('Times-Roman');
        const descricao = item.item_descricao || item.pedido || 'Descrição não informada';
        const descHeight = this.doc.heightOfString(descricao, {
            width: contentWidth - 20,
            lineGap: 1
        });
        itemHeight += descHeight + 5;
        itemHeight += 12; // linha de dados + espaçamento
        // Verificar espaço na página
        this.verificarEspacoPagina(itemHeight);
        const itemY = this.doc.y;
        // ========== LINHA DE ITEM ==========
        // Número e nome do produto
        this.doc
            .fill('#333333')
            .fontSize(9)
            .font('Helvetica-Bold')
            .text(`${index + 1}.`, margin, itemY);
        this.doc
            .fill('#000000')
            .fontSize(10)
            .font('Times-Bold')
            .text(nome, margin + 18, itemY, {
            width: contentWidth - 140,
            lineGap: 1
        });
        // Preço alinhado à direita
        this.doc
            .fill('#000000')
            .fontSize(10)
            .font('Times-Bold')
            .text(total.toLocaleString('pt-AO', {
            style: 'currency',
            currency: 'AOA'
        }), margin + contentWidth - 120, itemY, { width: 115, align: 'right' });
        // Descrição
        const descY = itemY + nomeHeight + 5;
        this.doc
            .fill('#444444')
            .fontSize(8)
            .font('Times-Roman')
            .text(descricao, margin + 18, descY, {
            width: contentWidth - 20,
            lineGap: 1
        });
        // Informações técnicas em linha compacta
        let currentY = descY + descHeight + 3;
        const isLocal = item.origem === 'local';
        const techInfo = `Preço: ${preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} • Qtd: ${quantidade} • Origem: ${isLocal ? 'Local' : 'Web'}`;
        if (item.provider) {
            const provider = `• Fornecedor: ${item.provider}`;
            this.doc
                .fill('#777777')
                .fontSize(7)
                .font('Helvetica')
                .text(techInfo + provider, margin + 18, currentY);
        }
        else {
            this.doc
                .fill('#777777')
                .fontSize(7)
                .font('Helvetica')
                .text(techInfo, margin + 18, currentY);
        }
        // Linha separadora sutil
        this.doc
            .strokeColor('#eeeeee')
            .lineWidth(0.3)
            .moveTo(margin, currentY + 15)
            .lineTo(margin + contentWidth, currentY + 15)
            .stroke();
        // Atualizar posição
        this.doc.y = currentY + 20;
    }
    /**
     * Renderiza um card para itens não escolhidos (status = false)
     */
    renderizarCardNaoEscolhido(index, item, contentWidth) {
        const margin = this.margin;
        const minHeight = 130;
        this.verificarEspacoPagina(minHeight);
        const itemY = this.doc.y;
        // Sombra sutil para o card
        this.doc
            .fill('#f8f9fa')
            .rect(margin + 2, itemY + 2, contentWidth, minHeight)
            .fill();
        // Card principal corporativo
        this.doc
            .fill('#ffffff')
            .rect(margin, itemY, contentWidth, minHeight)
            .fillAndStroke('#ffffff', '#e9ecef');
        // Borda lateral de aviso elegante
        this.doc
            .fill(theme_1.theme.warning.main)
            .rect(margin, itemY, 4, minHeight)
            .fill();
        // Linha de destaque superior
        this.doc
            .fill('#fff8e1')
            .rect(margin + 4, itemY, contentWidth - 4, 3)
            .fill();
        const headerY = itemY + 20;
        // Badge índice corporativo
        this.doc
            .fill('#fff3cd')
            .roundedRect(margin + 16, headerY - 8, 32, 26, 13)
            .fillAndStroke('#fff3cd', theme_1.theme.warning.stroke)
            .fill(theme_1.theme.warning.main)
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(`${index + 1}`, margin + 28, headerY + 1, { width: 20, align: 'center' });
        // Título corporativo
        this.doc
            .fill(theme_1.theme.text.primary)
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('ITEM PENDENTE', margin + 70, headerY);
        // Subtítulo explicativo
        this.doc
            .fill(theme_1.theme.text.muted)
            .fontSize(8)
            .font('Helvetica')
            .text('Aguardando seleção', margin + 70, headerY + 18);
        // Separador elegante
        this.doc
            .strokeColor('#e9ecef')
            .lineWidth(1)
            .moveTo(margin + 20, headerY + 38)
            .lineTo(margin + contentWidth - 20, headerY + 38)
            .stroke();
        // Mensagem corporativa
        const pedido = item.pedido || item.item_nome || 'Item não especificado';
        const mensagem = `Este item ainda não foi selecionado para inclusão na proposta. Pedido: "${pedido}"`;
        this.doc
            .fill(theme_1.theme.text.primary)
            .fontSize(9)
            .font('Helvetica')
            .text(mensagem, margin + 25, headerY + 50, { width: contentWidth - 50, lineGap: 3 });
        // Card de descrição sofisticado
        if (item.item_descricao) {
            this.doc
                .fill('#fef3e2')
                .roundedRect(margin + 25, headerY + 85, contentWidth - 50, 32, 6)
                .fillAndStroke('#fef3e2', theme_1.theme.warning.stroke);
            this.doc
                .fill(theme_1.theme.warning.main)
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('DESCRIÇÃO:', margin + 35, headerY + 93, { continued: true })
                .fill(theme_1.theme.text.primary)
                .font('Helvetica')
                .text(` ${item.item_descricao}`, { width: contentWidth - 80 });
        }
        this.doc.y = itemY + minHeight + 25;
    }
    /**
     * Método de fallback para usar a lógica antiga em caso de erro
     */
    renderFallback(data, contentWidth) {
        const margin = this.margin;
        // ========== ITENS INCLUÍDOS NA PROPOSTA ==========
        const analisesLocal = Array.isArray(data.analiseLocal) ? data.analiseLocal : [];
        const analisesWeb = Array.isArray(data.analiseWeb) ? data.analiseWeb : [];
        const totalAnalises = analisesLocal.length + analisesWeb.length;
        if (totalAnalises > 0) {
            this.doc.addPage();
            // Cabeçalho da seção organizado
            const itemsHeaderY = this.doc.y;
            this.doc
                .fill(theme_1.theme.info.main)
                .fontSize(14)
                .font('Helvetica-Bold')
                .text('ITENS INCLUÍDOS NA PROPOSTA', margin, itemsHeaderY);
            // Linha de destaque corporativa
            this.doc
                .strokeColor(theme_1.theme.info.main)
                .lineWidth(2)
                .moveTo(margin, itemsHeaderY + 20)
                .lineTo(margin + 250, itemsHeaderY + 20)
                .stroke();
            this.doc.y = itemsHeaderY + 40;
            // Índice sequencial só para blocos exibidos (itens escolhidos ou cards de não encontrado)
            let seqIndex = 0;
            // Processar análises locais
            analisesLocal.forEach((analise) => {
                const rel = analise.llm_relatorio || analise;
                const escolhido = this.encontrarItemEscolhido(rel);
                if (escolhido) {
                    this.renderizarItemAnalise(escolhido, seqIndex++, rel, true, contentWidth);
                }
                else {
                    this.renderizarCardNaoEncontrado(seqIndex++, rel, true, contentWidth);
                }
            });
            // Processar análises web
            analisesWeb.forEach((analise) => {
                const rel = analise;
                const escolhido = this.encontrarItemEscolhido(rel);
                if (escolhido) {
                    this.renderizarItemAnalise(escolhido, seqIndex++, rel, false, contentWidth);
                }
                else {
                    this.renderizarCardNaoEncontrado(seqIndex++, rel, false, contentWidth);
                }
            });
        }
    }
}
exports.ItemListRenderer = ItemListRenderer;
//# sourceMappingURL=ItemListRenderer.js.map