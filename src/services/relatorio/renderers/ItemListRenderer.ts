import PDFDocument from 'pdfkit';
import { RelatorioData } from '../types';
import { theme } from '../theme';

export class ItemListRenderer {
  private doc: PDFKit.PDFDocument;
  private margin: number;

  constructor(doc: PDFKit.PDFDocument, margin: number = 50) {
    this.doc = doc;
    this.margin = margin;
  }

  /**
   * Verifica se há espaço suficiente na página atual
   */
  private verificarEspacoPagina(minHeight: number) {
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
  public render(data: RelatorioData) {
    const margin = this.margin;
    const pageWidth = this.doc.page.width;
    const contentWidth = pageWidth - (margin * 2);
    
    // ========== LISTA DE ITENS ==========
    const analisesLocal = Array.isArray(data.analiseLocal) ? data.analiseLocal : [];
    const analisesWeb = Array.isArray(data.analiseWeb) ? data.analiseWeb : [];
    const totalAnalises = analisesLocal.length + analisesWeb.length;
    if (totalAnalises > 0) {
      this.doc.addPage();
      // Header da seção de itens
      const itemsHeaderY = this.doc.y;
      
      this.doc
        .fill(theme.text.labelDark)
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('ITENS INCLUÍDOS NA PROPOSTA', margin, itemsHeaderY);
      
      // Linha decorativa azul moderna
      this.doc
        .fill(theme.info.main)
        .rect(margin, itemsHeaderY + 25, 180, 2)
        .fill();
      
      this.doc.y = itemsHeaderY + 40;
      
      // Índice sequencial só para blocos exibidos (itens escolhidos ou cards de não encontrado)
      let seqIndex = 0;

      // Processar análises locais
      analisesLocal.forEach((analise) => {
        const rel: any = (analise as any).llm_relatorio || analise;
        const escolhido = this.encontrarItemEscolhido(rel);
        if (escolhido) {
          this.renderizarItemAnalise(escolhido, seqIndex++, rel, true, contentWidth);
        } else {
          this.renderizarCardNaoEncontrado(seqIndex++, rel, true, contentWidth);
        }
      });
      
      // Processar análises web
      analisesWeb.forEach((analise) => {
        const rel: any = analise;
        const escolhido = this.encontrarItemEscolhido(rel);
        if (escolhido) {
          this.renderizarItemAnalise(escolhido, seqIndex++, rel, false, contentWidth);
        } else {
          this.renderizarCardNaoEncontrado(seqIndex++, rel, false, contentWidth);
        }
      });
    }
  }

  /**
   * Renderiza um item de análise como se fosse um item da proposta
   */
  private renderizarItemAnalise(item: any, index: number, analise: any, isLocal: boolean, contentWidth: number) {
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
      const analiseHeight = this.doc.heightOfString(
        analise.escolha_principal, 
        { width: contentWidth - 60, lineGap: 2 }
      );
      itemHeight += analiseHeight + 40; // altura do texto + header + padding
    }
    
    itemHeight += 25; // padding inferior
    
    // Verificar se cabe na página
    this.verificarEspacoPagina(itemHeight);
    
    const itemY = this.doc.y;
    
    // ========== DESENHO DO CARD DO ITEM ==========
    // Sombra simulada em tons azuis
    this.doc
      .fill('#f1f5f9')
      .rect(margin + 2, itemY + 2, contentWidth - 4, itemHeight - 4)
      .fill();
    
    // Card principal
    this.doc
      .fill('#ffffff')
      .rect(margin, itemY, contentWidth, itemHeight)
      .fillAndStroke('#ffffff', theme.card.neutralStroke);
    
    // Borda lateral colorida em tons azuis
  const borderColors = [theme.info.main, theme.info.alt, theme.header.bg, '#3730a3', '#1e3a8a'];
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
      .fill(theme.text.labelDark)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text(item.nome, margin + 65, itemHeaderY, { 
        width: contentWidth - 280,
        lineGap: 2 // Permitir múltiplas linhas sem truncar
      });
    
    // Preço total em destaque azul (ajustar posição baseada na altura do nome para centralizar verticalmente)
    const headerMinHeight = Math.max(nomeHeight, 25);
    const precoY = itemHeaderY + (headerMinHeight - 26) / 2; // Centralizar a caixa de preço verticalmente no header
    const precoBoxX = margin + contentWidth - 130;
    this.doc
      .fill('#eff6ff')
      .roundedRect(precoBoxX, precoY, 120, 26, 13)
      .fill()
      .fill(theme.header.bg)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text(
        `${total.toLocaleString('pt-AO', { 
          style: 'currency', 
          currency: 'AOA' 
        })}`,
        precoBoxX + 5,
        precoY + 6,
        { width: 110, align: 'center' }
      );
    
    // ========== DESCRIÇÃO ==========
    const descY = itemHeaderY + headerMinHeight + 15;
    
    this.doc
      .fill('#64748b')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('DESCRIÇÃO', margin + 20, descY);
    
    this.doc
      .fill('#334155')
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
      .fill('#f8fafc')
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
        .fill('#64748b')
        .fontSize(7)
        .font('Helvetica-Bold')
        .text(tech.label, tech.x, techY + 2)
        .fill('#1e293b')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(tech.value, tech.x, techY + 15);
    });
    
    // ========== ANÁLISE IA ==========
    if (analise.escolha_principal) {
      const analiseY = techY + 50;
      
      // Fundo da análise IA em tons azuis
      this.doc
        .fill('#f0f9ff')
        .roundedRect(margin + 15, analiseY - 8, contentWidth - 30, 30, 10)
        .fill();
      
      // Badge IA
      this.doc
        .fill(theme.header.bg)
        .circle(margin + 35, analiseY + 7, 10)
        .fill()
        .fill('#ffffff')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('AI', margin + 31, analiseY + 3);
      
      // Label da análise
      this.doc
        .fill(theme.header.bg)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('ANÁLISE INTELIGENTE', margin + 55, analiseY + 3);
      
      // Conteúdo da análise
      this.doc
        .fill('#1e3a8a')
        .fontSize(9)
        .font('Helvetica')
        .text(
          analise.escolha_principal,
          margin + 25,
          analiseY + 25,
          { width: contentWidth - 60, lineGap: 2 }
        );
    }
    
    // Atualizar posição Y
    this.doc.y = itemY + itemHeight + 20;
  }

  // Seleciona o item escolhido conforme a escolha_principal
  private encontrarItemEscolhido(analise: any) {
    const ranking = Array.isArray(analise?.top_ranking) ? analise.top_ranking : [];
    const escolha = (analise?.escolha_principal || '').toString().trim();
    if (!escolha) return null;
    const alvo = this.normalizarTexto(escolha);
    const encontrado = ranking.find((r: any) => {
      const nome = this.normalizarTexto((r?.nome || '').toString());
      return nome && (nome.includes(alvo) || alvo.includes(nome));
    });
    return encontrado || null;
  }

  private normalizarTexto(t: string) {
    return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  }

  // Card de erro quando não há item selecionado/encontrado
  private renderizarCardNaoEncontrado(index: number, analise: any, isLocal: boolean, contentWidth: number) {
    const margin = this.margin;
    const minHeight = 120;
    this.verificarEspacoPagina(minHeight);
    const itemY = this.doc.y;

    // Sombra
    this.doc
      .fill('#fff1f2')
      .rect(margin + 2, itemY + 2, contentWidth - 4, minHeight - 4)
      .fill();

    // Card principal
    this.doc
      .fill('#ffffff')
      .rect(margin, itemY, contentWidth, minHeight)
      .fillAndStroke('#ffffff', theme.error.stroke);

    // Borda lateral
    this.doc
      .fill(theme.error.stroke)
      .rect(margin, itemY, 5, minHeight)
      .fill();

    const headerY = itemY + 18;

    // Badge índice
    this.doc
      .fill(theme.error.stroke)
      .roundedRect(margin + 20, headerY - 5, 32, 26, 13)
      .fill()
      .fill('#ffffff')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`${index + 1}`, margin + 31, headerY + 3);

    // Título
    this.doc
      .fill(theme.text.primary)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('ITEM NÃO ENCONTRADO', margin + 65, headerY);

    // Mensagem
    const origem = isLocal ? 'análise local' : 'busca web';
    const mensagem = `Não foi possível identificar um item selecionado nesta ${origem}.`;
    this.doc
      .fill('#6b7280')
      .fontSize(10)
      .font('Helvetica')
      .text(mensagem, margin + 20, headerY + 34, { width: contentWidth - 40, lineGap: 2 });

    if (analise?.escolha_principal) {
      this.doc
        .fill(theme.warning.bg)
        .rect(margin + 20, headerY + 60, contentWidth - 40, 28)
        .fillAndStroke(theme.warning.bg, theme.warning.stroke);
      this.doc
        .fill(theme.warning.text)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Referência informada:', margin + 28, headerY + 66, { continued: true })
        .font('Helvetica')
        .text(` ${analise.escolha_principal}`);
    }

    this.doc.y = itemY + minHeight + 20;
  }
}
