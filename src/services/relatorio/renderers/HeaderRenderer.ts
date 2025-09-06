import PDFDocument from 'pdfkit';
import { RelatorioData } from '../types';
import { theme } from '../theme';

export class HeaderRenderer {
  private doc: PDFKit.PDFDocument;
  private margin: number;

  constructor(doc: PDFKit.PDFDocument, margin: number = 50) {
    this.doc = doc;
    this.margin = margin;
  }

  /**
   * Adiciona cabeçalho ao documento
   */
  public render(data: RelatorioData) {
    const margin = this.margin;
    const pageWidth = this.doc.page.width;
    const contentWidth = pageWidth - (margin * 2);
    
    // Cabeçalho corporativo formal
    this.doc
      .fill(theme.text.primary)
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(`RELATÓRIO INTERNO DE COTAÇÃO — ID ${data.cotacaoId}`, margin, 35, { width: contentWidth });

    this.doc
      .strokeColor(theme.info.main)
      .lineWidth(2)
      .moveTo(margin, 65)
      .lineTo(margin + contentWidth, 65)
      .stroke();

    // Linha de apoio mais sutil
    this.doc
      .strokeColor(theme.card.neutralStroke)
      .lineWidth(1)
      .moveTo(margin, 68)
      .lineTo(margin + contentWidth, 68)
      .stroke();
    
    // ========== DADOS GERAIS DA COTAÇÃO ==========
    const infoTop = 95;
    const infoHeight = 100;
    
    // Card principal com informações organizadas
    this.doc
      .fill('#ffffff')
      .rect(margin, infoTop, contentWidth, infoHeight)
      .fillAndStroke('#ffffff', theme.info.main);

    this.doc
      .fill(theme.info.main)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('DADOS GERAIS DA COTAÇÃO', margin + 16, infoTop + 16);

    // Grid organizado de informações - Coluna 1
    this.doc
      .fontSize(9)
      .font('Helvetica')
      .fill(theme.text.muted)
      .text('ID da Cotação:', margin + 16, infoTop + 40)
      .fill(theme.text.primary)
      .font('Helvetica-Bold')
      .text(`#${data.cotacaoId}`, margin + 16, infoTop + 54);

    // Grid organizado de informações - Coluna 2 (centro)
    const centerX = margin + (contentWidth / 2) - 80;
    this.doc
      .fontSize(9)
      .font('Helvetica')
      .fill(theme.text.muted)
      .text('Data de Geração:', centerX, infoTop + 40)
      .fill(theme.text.primary)
      .font('Helvetica-Bold')
      .text(
        `${new Date().toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`,
        centerX,
        infoTop + 54
      );

    // Grid organizado de informações - Coluna 3 (direita)
    const rightX = margin + contentWidth - 160;
    this.doc
      .fontSize(9)
      .font('Helvetica')
      .fill(theme.text.muted)
      .text('Valor Total da Proposta:', rightX, infoTop + 40)
      .fill(theme.info.main)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(
        `${data.orcamentoGeral.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2 })}`,
        rightX,
        infoTop + 54
      );

    // Linha separadora sutil
    this.doc
      .strokeColor(theme.card.neutralStroke)
      .lineWidth(1)
      .moveTo(margin + 16, infoTop + 78)
      .lineTo(margin + contentWidth - 16, infoTop + 78)
      .stroke();

    // Informação adicional na parte inferior
    this.doc
      .fill(theme.text.muted)
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Total de itens analisados: ${data.analiseLocal.length + data.analiseWeb.length}`,
        margin + 16,
        infoTop + 85
      );
    
    // ========== SOLICITAÇÃO DO CLIENTE ==========
    const solicitacaoTitleY = infoTop + infoHeight + 25;
    this.doc
      .fill(theme.info.main)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('SOLICITAÇÃO DO CLIENTE', margin, solicitacaoTitleY);

    this.doc
      .strokeColor(theme.info.main)
      .lineWidth(1)
      .moveTo(margin, solicitacaoTitleY + 16)
      .lineTo(margin + 180, solicitacaoTitleY + 16)
      .stroke();
    
    // Caixa para solicitação com altura dinâmica
    const solicitacaoHeight = Math.max(70, Math.min(data.solicitacao.length / 3, 140));
    const solicitacaoBoxTop = solicitacaoTitleY + 26;
    this.doc
      .fill('#ffffff')
      .rect(margin, solicitacaoBoxTop, contentWidth, solicitacaoHeight)
      .fillAndStroke('#ffffff', theme.card.neutralStroke);

    this.doc
      .fill(theme.text.primary)
      .fontSize(10)
      .font('Helvetica')
      .text(data.solicitacao, margin + 16, solicitacaoBoxTop + 16, {
        width: contentWidth - 32,
        lineGap: 4,
        align: 'justify'
      });

    this.doc.y = solicitacaoBoxTop + solicitacaoHeight + 30; // Espaçamento para próximo conteúdo
  }
}
