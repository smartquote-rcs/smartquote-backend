import PDFDocument from 'pdfkit';
import { RelatorioData } from '../types';
import { theme } from '../theme';

export class TermsRenderer {
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
 * Renderiza as condições comerciais
 */
    public render(data: RelatorioData) {
    const margin = this.margin;
    const pageWidth = this.doc.page.width;
    const contentWidth = pageWidth - (margin * 2);
    
    this.verificarEspacoPagina(100);
    
    // ========== TÍTULO SEÇÃO ==========
    this.doc
        .fill('#333333')
        .fontSize(12)
        .font('Times-Bold')
        .text('CONDIÇÕES COMERCIAIS', margin, this.doc.y);

    // Linha separadora simples
    this.doc
        .strokeColor('#cccccc')
        .lineWidth(1)
        .moveTo(margin, this.doc.y + 5)
        .lineTo(margin + contentWidth, this.doc.y + 5)
        .stroke();

    this.doc.y += 15;

    // ========== CONDIÇÕES EM FORMATO LINEAR ==========
    const conditions = [
        { label: 'Prazo de Entrega:', value: '30 a 45 dias úteis' },
        { label: 'Validade da Proposta:', value: '30 dias corridos' },
        { label: 'Garantia:', value: '12 meses contra defeitos de fabricação' },
        { label: 'Condições de Pagamento:', value: '50% antecipado + 50% na entrega' }
    ];

    conditions.forEach(condition => {
        this.doc
        .fill('#000000')
        .fontSize(9)
        .font('Times-Bold')
        .text(condition.label, margin, this.doc.y)
        .fill('#333333')
        .fontSize(9)
        .font('Times-Roman')
        .text(condition.value, margin + 140, this.doc.y);
        
        this.doc.y += 12;
    });

    // ========== OBSERVAÇÕES ==========
    this.doc.y += 5;
    
    this.doc
        .fill('#000000')
        .fontSize(9)
        .font('Times-Bold')
        .text('Observações Importantes:', margin, this.doc.y);

    this.doc.y += 12;

    const observacoes = [
        'Preços válidos para pagamento à vista ou conforme condições especificadas',
        'Frete e instalação não inclusos, orçados separadamente se necessário',
        'Garantia conforme termos do fabricante e legislação vigente'
    ];

    observacoes.forEach(obs => {
        this.doc
        .fill('#444444')
        .fontSize(8)
        .font('Times-Roman')
        .text(`• ${obs}`, margin + 5, this.doc.y, {
            width: contentWidth - 10,
            lineGap: 1
        });
        
        const obsHeight = this.doc.heightOfString(`• ${obs}`, {
        width: contentWidth - 10,
        lineGap: 1
        });
        
        this.doc.y += obsHeight + 5;
    });

    this.doc.y += 10;
    }
}