import PDFDocument from 'pdfkit';
import { RelatorioData } from '../types';

export class PropostaRenderer {
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
   * Adiciona seção de proposta comercial
   */
  public render(data: RelatorioData) {
    const margin = this.margin;
    const pageWidth = this.doc.page.width;
    const contentWidth = pageWidth - (margin * 2);
    
    // Verificar espaço inicial
    this.verificarEspacoPagina(100);
    
    // ========== CABEÇALHO DA SEÇÃO ==========
    const headerHeight = 55;
    const headerY = this.doc.y;
    
    // Fundo principal com tom azul formal
    this.doc
      .fill('#1e40af')
      .rect(margin - 15, headerY, contentWidth + 30, headerHeight)
      .fill();
    
    // Linha de destaque superior azul
    this.doc
      .fill('#2563eb')
      .rect(margin - 15, headerY, contentWidth + 30, 4)
      .fill();
    
    // Ícone principal
    this.doc
      .fill('#ffffff')
      .circle(margin + 30, headerY + 27, 18)
      .fill()
      .fill('#1e40af')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('$', margin + 25, headerY + 19);
    
    // Título principal
    this.doc
      .fill('#ffffff')
      .fontSize(19)
      .font('Helvetica-Bold')
      .text('PROPOSTA COMERCIAL', margin + 60, headerY + 12)
      .fontSize(12)
      .font('Helvetica')
      .text('E-mail de Resposta Automatizado', margin + 60, headerY + 35);
    
    this.doc.y = headerY + headerHeight + 25;
    
    // ========== CARD RESUMO EXECUTIVO ==========
    this.verificarEspacoPagina(120);
    
    const resumoY = this.doc.y;
    const resumoHeight = 110;
    
    // Fundo do card com sombra simulada azul
    this.doc
      .fill('#f1f5f9')
      .rect(margin + 3, resumoY + 3, contentWidth - 6, resumoHeight - 6)
      .fill();
    
    // Card principal
    this.doc
      .fill('#ffffff')
      .rect(margin, resumoY, contentWidth, resumoHeight)
      .fillAndStroke('#ffffff', '#cbd5e1');
    
    // Borda lateral azul
    this.doc
      .fill('#1e40af')
      .rect(margin, resumoY, 6, resumoHeight)
      .fill();
    
    // Header do card
    const cardHeaderY = resumoY + 15;
    
    // Badge do resumo com tom azul
    this.doc
      .fill('#eff6ff')
      .roundedRect(margin + 25, cardHeaderY - 3, 140, 28, 14)
      .fill()
      .fill('#1e40af')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('RESUMO EXECUTIVO', margin + 35, cardHeaderY + 5);
    
    // Grid de informações
    const infoY = cardHeaderY + 40;
    const colWidth = (contentWidth - 60) / 3;
    
    // Dados da cotação
    const totalItens = data.analiseLocal.length + data.analiseWeb.length;
    const orcamento = data.orcamentoGeral || 0;
    const status = totalItens > 0 ? 'COMPLETA' : 'PENDENTE';
    const statusColor = totalItens > 0 ? '#1e40af' : '#dc2626';
    
    // Coluna 1 - Total de Itens
    this.doc
      .fill('#64748b')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('TOTAL DE ITENS', margin + 25, infoY);
    
    this.doc
      .fill('#1e293b')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(`${totalItens}`, margin + 25, infoY + 12)
      .fontSize(9)
      .font('Helvetica')
      .text('produtos', margin + 25, infoY + 32);
    
    // Coluna 2 - Orçamento
    this.doc
      .fill('#64748b')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('ORÇAMENTO GERAL', margin + 25 + colWidth, infoY);
    
    this.doc
      .fill('#1e40af')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(
        `${orcamento.toLocaleString('pt-AO', { 
          style: 'currency', 
          currency: 'AOA',
          minimumFractionDigits: 2 
        })}`,
        margin + 25 + colWidth,
        infoY + 12
      );
    
    // Coluna 3 - Status
    this.doc
      .fill('#64748b')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('STATUS', margin + 25 + (colWidth * 2), infoY);
    
    // Badge de status
    this.doc
      .fill(statusColor === '#1e40af' ? '#eff6ff' : '#fef2f2')
      .roundedRect(margin + 25 + (colWidth * 2), infoY + 10, 70, 20, 10)
      .fill()
      .fill(statusColor)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(status, margin + 35 + (colWidth * 2), infoY + 16);
    
    this.doc.y = resumoY + resumoHeight + 25;
  }
}
