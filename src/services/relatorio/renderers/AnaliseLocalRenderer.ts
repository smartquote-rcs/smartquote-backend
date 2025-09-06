import PDFKit from 'pdfkit';
import { RelatorioData } from '../types';

export class AnaliseLocalRenderer {
  private verificarEspacoPagina(doc: PDFKit.PDFDocument, altura: number) {
    if (doc.y + altura > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
  }

/**
 * Renders the local analysis section in a formal, executive, and legible style.
 */
public adicionarSecaoAnaliseLocal(doc: PDFKit.PDFDocument, data: RelatorioData) {
  const margin = doc.page.margins.left;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - margin * 2;


  // Helper: format price for Angola standard (thousands with '.' and decimals with ',')
  const formatPrecoAOA = (valor: any): string => {
    try {
      if (valor === null || typeof valor === 'undefined') return '';
      let s = String(valor).trim();
      // Remove currency labels and spaces (e.g., 'AOA', 'Kz')
      s = s.replace(/AOA|KZ|KZs|\s+/gi, ' ').trim();
      // Keep only digits, dots, and commas
      s = s.replace(/[^\d.,-]/g, '');
      // Normalize: remove thousand dots before 3-digit groups, convert comma to decimal point
      s = s.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
      const n = parseFloat(s);
      if (isNaN(n)) return String(valor);
      // Format with Portuguese locale (dot thousands, comma decimals)
      return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    } catch {
      return String(valor);
    }
  };


  // Ensure sufficient page space
  this.verificarEspacoPagina(doc, 100);

  // ========== Section Header ==========
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#003087') // Primary blue
    .text('Análise de Rastreabilidade', margin, doc.y);

  doc
    .strokeColor('#E5E7EB') // Light gray
    .lineWidth(0.5)
    .moveTo(margin, doc.y + 8)
    .lineTo(margin + contentWidth, doc.y + 8)
    .stroke();

  doc.y += 20;

  // Handle empty analysis case
  const analiseLocal = Array.isArray(data.analiseLocal) ? data.analiseLocal : data.analiseLocal ? [data.analiseLocal] : [];
  if (analiseLocal.length === 0) {
    doc
      .font('Helvetica-Oblique')
      .fontSize(10)
      .fillColor('#6B7280') // Secondary gray
      .text('Nenhuma análise disponível para esta cotação.', margin, doc.y);

    doc
      .strokeColor('#E5E7EB') // Light gray
      .lineWidth(0.5)
      .moveTo(margin, doc.y + 6)
      .lineTo(margin + contentWidth, doc.y + 6)
      .stroke();

    doc.y += 18;
    return;
  }

  // Process each analysis item
  analiseLocal.forEach((analiseItem, index) => {
    const analise = analiseItem.llm_relatorio || analiseItem;
    
    if (index > 0) {
      doc.addPage();
    }

    const analiseY = doc.y;

    // ========== Analysis Item Header ==========
    const pedido = (analiseItem as any)?.pedido;
    const queryRaw = (typeof pedido !== 'undefined' && pedido !== null && String(pedido).trim().length > 0)
      ? pedido
      : (typeof analise.query !== 'undefined' && analise.query !== null ? analise.query : undefined);
    const hasQuery = !!queryRaw;
    const queryText = hasQuery ? String(queryRaw) : 'Item não identificado';
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#1F2937') // Dark gray
      .text(queryText, margin + 10, analiseY + 10);

    // When the query is unavailable, enrich the header using cotação item data for better traceability
    if (!hasQuery) {
      const detalhes = [
        `Cotação #${data.cotacaoId}`,
        `Item da cotação: ${String((analiseItem as any).item_nome || 'Sem nome')}`,
        `ID do item: ${String((analiseItem as any).id_item_cotacao || '-')}`,
      ];
      const alternativas = Array.isArray((analise as any)?.top_ranking) ? (analise as any).top_ranking.length : 0;
      if (alternativas > 0) {
        detalhes.push(`Alternativas avaliadas: ${alternativas}`);
      }
      doc
        .font('Helvetica-Oblique')
        .fontSize(9)
        .fillColor('#6B7280') // Secondary gray
        .text(detalhes.join(' • '), margin + 10, doc.y + 4, { width: contentWidth - 20 });
    }

    doc.y = analiseY + 30;
    doc
      .strokeColor('#E5E7EB') // Light gray
      .lineWidth(0.5)
      .moveTo(margin, doc.y)
      .lineTo(margin + contentWidth, doc.y)
      .stroke();
    doc.y += 10;

    // ========== Executive Summary ==========
    const infoY = doc.y;
    const timestamp = (analiseItem as any).timestamp || (analise as any).timestamp || Date.now();
    const decisaoResumo = analise.escolha_principal ? String(analise.escolha_principal) : 'Não definida';
    const evidenciasResumo = Array.isArray(analise.top_ranking) ? `${analise.top_ranking.length} alternativas avaliadas` : 'Nenhuma alternativa avaliada';

    // Decision
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#4B5563') // Muted gray
      .text('Decisão:', margin + 10, infoY);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#1F2937') // Dark gray
      .text(decisaoResumo.substring(0, 100) + (decisaoResumo.length > 100 ? '...' : ''), margin + 70, infoY, {
        width: contentWidth - 80,
        lineGap: 2,
      });

    // Evaluation
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#4B5563') // Muted gray
      .text('Avaliação:', margin + 10, infoY + 20);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#6B7280') // Secondary gray
      .text(`${evidenciasResumo} • ${new Date(timestamp).toLocaleDateString('pt-BR')}`, margin + 70, infoY + 20);

    doc.y = infoY + 40;

    // ========== Justification (if available) ==========
    if (analise.justificativa_escolha) {
      this.verificarEspacoPagina(doc, 60);
      const justY = doc.y;
      const justificativaText = String(analise.justificativa_escolha);

      doc.font('Helvetica').fontSize(10);
      const justificativaHeight = doc.heightOfString(justificativaText, { width: contentWidth - 20, lineGap: 2 });
      const totalJustHeight = justificativaHeight + 30;

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#003087') // Primary blue
        .text('Justificativa', margin + 10, justY);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#1F2937') // Dark gray
        .text(justificativaText, margin + 10, justY + 15, { width: contentWidth - 20, lineGap: 2 });

      doc.y = justY + totalJustHeight + 10;
    }

    // ========== Alternatives Ranking ==========
    if (analise.top_ranking && Array.isArray(analise.top_ranking)) {
      this.verificarEspacoPagina(doc, 30);
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#4B5563') // Muted gray
        .text('Alternativas Avaliadas', margin, doc.y);
      doc.y += 15;

      analise.top_ranking.forEach((ranking: any, rankIndex: number) => {
        let itemHeight = 40;
        if (ranking.nome) {
          doc.font('Helvetica-Bold').fontSize(10);
          const nomeHeight = doc.heightOfString(String(ranking.nome), { width: contentWidth - 160, lineGap: 2 });
          itemHeight += Math.max(nomeHeight, 15) + 5;
        }
        if (ranking.justificativa) {
          doc.font('Helvetica').fontSize(9);
          const justHeight = doc.heightOfString(String(ranking.justificativa), { width: contentWidth - 160, lineGap: 2 });
          itemHeight += justHeight + 10;
        }

        this.verificarEspacoPagina(doc, itemHeight);
        const rankY = doc.y;
        const isEscolhaPrincipal = analise.escolha_principal && ranking.nome && String(ranking.nome) === String(analise.escolha_principal);

        // Index
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#6B7280') // Secondary gray
          .text(`${rankIndex + 1}`, margin + 10, rankY + 10);

        // Product Name
        const nomeText = ranking.nome ? String(ranking.nome) : 'Produto não identificado';
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#1F2937') // Dark gray
          .text(nomeText, margin + 30, rankY + 10, { width: contentWidth - 160, lineGap: 2 });

        const nomeTextHeight = doc.heightOfString(nomeText, { width: contentWidth - 160, lineGap: 2 });
        const baseLeftY = rankY + 10 + nomeTextHeight + 6;

        // Selected Badge (Centered)
        if (isEscolhaPrincipal) {
          const badgeWidth = 80;
          const badgeX = margin + contentWidth - badgeWidth - 10;
          doc
            .fillColor('#D1FAE5') // Light green background
            .roundedRect(badgeX, rankY + 8, badgeWidth, 20, 3)
            .fill()
            .font('Helvetica-Bold')
            .fontSize(8)
            .fillColor('#059669') // Success green
            .text('SELECIONADO', badgeX, rankY + 12, { width: badgeWidth, align: 'center' });
        }

        // Price
        if (ranking.preco) {
          const precoFormatado = formatPrecoAOA(ranking.preco);
          doc
            .font('Helvetica-Bold')
            .fontSize(9)
            .fillColor('#003087') // Primary blue
            .text(`AOA$ ${precoFormatado}`, margin + contentWidth - 90, rankY + (isEscolhaPrincipal ? 30 : 15));
        }

        // ID
        if (ranking.id) {
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#9CA3AF') // Light gray
            .text(`ID: ${String(ranking.id)}`, margin + 30, baseLeftY);
        }

        // Justification
        if (ranking.justificativa) {
          const justificativaText = String(ranking.justificativa);
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#6B7280') // Secondary gray
            .text(justificativaText, margin + 30, baseLeftY + 10, { width: contentWidth - 160, lineGap: 2 });
        }

        doc.y = rankY + itemHeight + 10;
      });
    }

    // ========== Evaluation Criteria ==========
    if (analise.criterios_avaliacao) {
      this.verificarEspacoPagina(doc, 50);
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#4B5563') // Muted gray
        .text('Critérios Aplicados', margin, doc.y);
      doc.y += 15;

      const criterios = analise.criterios_avaliacao;
      const criteriosList = [
        { key: 'correspondencia_tipo', label: 'Correspondência de Tipo' },
        { key: 'especificacoes', label: 'Especificações Técnicas' },
        { key: 'custo_beneficio', label: 'Análise Custo-Benefício' },
        { key: 'disponibilidade', label: 'Disponibilidade' },
      ];

      criteriosList.forEach((criterio, index) => {
        if ((criterios as any)[criterio.key]) {
          this.verificarEspacoPagina(doc, 50);
          const criterioY = doc.y;
          const criterioText = String((criterios as any)[criterio.key]);

          doc.font('Helvetica').fontSize(9);
          const textHeight = doc.heightOfString(criterioText, { width: contentWidth - 20, lineGap: 2 });
          const totalHeight = textHeight + 25;

          doc
            .font('Helvetica-Bold')
            .fontSize(9)
            .fillColor('#1F2937') // Dark gray
            .text(`${index + 1}. ${criterio.label}`, margin + 10, criterioY);
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#4B5563') // Muted gray
            .text(criterioText, margin + 10, criterioY + 15, { width: contentWidth - 20, lineGap: 2 });

          doc.y = criterioY + totalHeight + 5;
        }
      });
    }

    doc.y += 15;
  });
}
}
