import PDFDocument from 'pdfkit';
import { RelatorioData, RankingItem, CriteriosAvaliacao } from './types';
import { HeaderRenderer } from './renderers/HeaderRenderer';
import { PropostaRenderer } from './renderers/PropostaRenderer';
import { ItemListRenderer } from './renderers/ItemListRenderer';
import { EmailRenderer } from './renderers/EmailRenderer';
import { FooterRenderer } from './renderers/FooterRenderer';

export class PDFGenerator {
  private doc: PDFKit.PDFDocument;
  private margin: number = 50;
  private headerRenderer: HeaderRenderer;
  private propostaRenderer: PropostaRenderer;
  private itemListRenderer: ItemListRenderer;
  private emailRenderer: EmailRenderer;
  private footerRenderer: FooterRenderer;

  constructor(doc: PDFKit.PDFDocument) {
    this.doc = doc;
    this.headerRenderer = new HeaderRenderer(doc, this.margin);
    this.propostaRenderer = new PropostaRenderer(doc, this.margin);
    this.itemListRenderer = new ItemListRenderer(doc, this.margin);
    this.emailRenderer = new EmailRenderer(doc, this.margin);
    this.footerRenderer = new FooterRenderer(doc, this.margin);
  }

  /**
   * Verifica se há espaço suficiente na página atual
   */
  public verificarEspacoPagina(minHeight: number) {
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
  public adicionarCabecalho(data: RelatorioData) {
    this.headerRenderer.render(data);
  }

  /**
   * Adiciona seção de proposta comercial
   */
  public adicionarSecaoProposta(data: RelatorioData) {
    this.propostaRenderer.render(data);
    this.itemListRenderer.render(data);
  }


  /**
   * Adiciona template de email com design contínuo
   */
  public async adicionarTemplateEmail(data: RelatorioData) {
    try {
      await this.emailRenderer.render(data);
    } catch (err) {
      console.error('[PDF] Falha ao renderizar template de e-mail, seguindo sem esta seção:', err);
    }
  }


  /**
   * Adiciona rodapé ao documento
   */
  public adicionarRodape() {
    this.footerRenderer.render();
  }

}
