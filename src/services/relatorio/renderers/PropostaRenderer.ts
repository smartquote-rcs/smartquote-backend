import PDFDocument from 'pdfkit';
import CotacoesService from '../../CotacoesService';
import { RelatorioData } from '../types';
import { theme } from '../theme';

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
  public async render(data: RelatorioData) {
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
      .fill(theme.header.bg)
      .rect(margin - 15, headerY, contentWidth + 30, headerHeight)
      .fill();
    
    // Linha de destaque superior azul
    this.doc
      .fill(theme.info.main)
      .rect(margin - 15, headerY, contentWidth + 30, 4)
      .fill();
    
    // Ícone principal
    this.doc
  .fill('#ffffff')
      .circle(margin + 30, headerY + 27, 18)
      .fill()
  .fill(theme.header.bg)
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
    const normalizarTexto = (s: string) => s
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    const countEscolhidos = (arr: any[], local: boolean) => arr.reduce((acc, a) => {
      const rel: any = (local ? (a?.llm_relatorio || a) : a);
      const escolha = (rel?.escolha_principal || '').toString().trim();
      const ranking = Array.isArray(rel?.top_ranking) ? rel.top_ranking : [];
      if (!escolha || ranking.length === 0) return acc;
      const alvo = normalizarTexto(escolha);
      const found = ranking.some((r: any) => {
        const nome = normalizarTexto((r?.nome || '').toString());
        return nome.includes(alvo) || alvo.includes(nome);
      });
      return acc + (found ? 1 : 0);
    }, 0);
    const totalItens = countEscolhidos(Array.isArray(data.analiseLocal) ? data.analiseLocal : [], true)
                     + countEscolhidos(Array.isArray(data.analiseWeb) ? data.analiseWeb : [], false);
    const orcamento = data.orcamentoGeral || 0;
    let status = 'PENDENTE';
    let statusColor = theme.error.main;
    let badgeBg = theme.error.bg;
    try {
      const cotacao = await CotacoesService.getById(data.cotacaoId);
      if (cotacao?.status === 'completa') {
          status = 'COMPLETA';
          statusColor = theme.success.stroke;
          badgeBg = theme.success.bg;
      }
      else{
        status = 'INCOMPLETA';
        statusColor = theme.error.main;
        badgeBg = theme.error.bg;
      }
    } catch (e) {
      // fallback para lógica antiga se erro
      if (totalItens > 0) {
        status = 'COMPLETA';
        statusColor = theme.success.stroke;
        badgeBg = theme.success.bg;
      }
    }
    
    // Coluna 1 - Itens Selecionados
    this.doc
      .fill('#64748b')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('ITENS SELECIONADOS', margin + 25, infoY);
    
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
      .fill(theme.header.bg)
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
      .fill(badgeBg)
      .roundedRect(margin + 25 + (colWidth * 2), infoY + 10, 70, 20, 10)
      .fill()
      .fill(statusColor)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(status, margin + 35 + (colWidth * 2), infoY + 16);
    
    this.doc.y = resumoY + resumoHeight + 25;
  }
}
