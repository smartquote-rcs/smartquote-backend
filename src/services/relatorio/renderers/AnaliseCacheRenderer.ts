import PDFKit from 'pdfkit';
import { RelatorioData } from '../types';

// Renderer de "cache" baseado no AnaliseLocalRenderer, apenas com título ajustado
export class AnaliseCacheRenderer {
  private verificarEspacoPagina(doc: PDFKit.PDFDocument, altura: number) {
    if (doc.y + altura > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
  }

  public adicionarSecaoAnaliseCache(doc: PDFKit.PDFDocument, data: RelatorioData) {
    const margin = doc.page.margins.left;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - margin * 2;

    const formatPrecoAOA = (valor: any): string => {
      try {
        if (valor === null || typeof valor === 'undefined') return '';
        let s = String(valor).trim();
        s = s.replace(/AOA|KZ|KZs|\s+/gi, ' ').trim();
        s = s.replace(/[^\d.,-]/g, '');
        s = s.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
        const n = parseFloat(s);
        if (isNaN(n)) return String(valor);
        return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
      } catch {
        return String(valor);
      }
    };

    this.verificarEspacoPagina(doc, 100);

    // Cabeçalho específico de cache
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#1F2937')
      .text('Análise de Rastreabilidade — Pesquisa em cache', margin, doc.y);

    doc
      .strokeColor('#E5E7EB')
      .lineWidth(0.5)
      .moveTo(margin, doc.y + 8)
      .lineTo(margin + contentWidth, doc.y + 8)
      .stroke();

    doc.y += 20;

    const analiseCacheArr = Array.isArray((data as any).analiseCache)
      ? (data as any).analiseCache
      : (data as any).analiseCache
      ? [(data as any).analiseCache]
      : [];

    if (analiseCacheArr.length === 0) {
      doc
        .font('Helvetica-Oblique')
        .fontSize(10)
        .fillColor('#6B7280')
        .text('Nenhuma análise em cache disponível para esta cotação.', margin, doc.y);

      doc
        .strokeColor('#E5E7EB')
        .lineWidth(0.5)
        .moveTo(margin, doc.y + 6)
        .lineTo(margin + contentWidth, doc.y + 6)
        .stroke();

      doc.y += 18;
      return;
    }

    analiseCacheArr.forEach((analiseItem: any, index: number) => {
      const analise = analiseItem.llm_relatorio || analiseItem;

      if (index > 0) {
        doc.addPage();
      }

      const analiseY = doc.y;

      const pedido = (analiseItem as any)?.pedido;
      const queryRaw =
        typeof pedido !== 'undefined' && pedido !== null && String(pedido).trim().length > 0
          ? pedido
          : typeof analise.query !== 'undefined' && analise.query !== null
          ? analise.query
          : undefined;
      const hasQuery = !!queryRaw;
      const queryText = hasQuery ? String(queryRaw) : 'Item não identificado';
      
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
          .fillColor('#6B7280')
          .text(detalhes.join(' • '), margin + 10, doc.y + 4, { width: contentWidth - 20 });
      }

      doc.y = analiseY + 30;
      doc
        .strokeColor('#E5E7EB')
        .lineWidth(0.5)
        .moveTo(margin, doc.y)
        .lineTo(margin + contentWidth, doc.y)
        .stroke();
      doc.y += 10;

      const infoY = doc.y;
      const timestamp = (analiseItem as any).timestamp || (analise as any).timestamp || Date.now();
      const decisaoResumo = analise.escolha_principal ? String(analise.escolha_principal) : 'Não definida';
      const evidenciasResumo = Array.isArray(analise.top_ranking)
        ? `${analise.top_ranking.length} alternativas avaliadas`
        : 'Nenhuma alternativa avaliada';

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#4B5563').text('Decisão:', margin + 10, infoY);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#1F2937')
        .text(decisaoResumo.substring(0, 100) + (decisaoResumo.length > 100 ? '...' : ''), margin + 70, infoY, {
          width: contentWidth - 80,
          lineGap: 2,
        });

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#4B5563').text('Avaliação:', margin + 10, infoY + 20);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#6B7280')
        .text(`${evidenciasResumo} • ${new Date(timestamp).toLocaleDateString('pt-BR')}`, margin + 70, infoY + 20);

      doc.y = infoY + 40;

      if (analise.justificativa_escolha) {
        this.verificarEspacoPagina(doc, 60);
        const justY = doc.y;
        const justificativaText = String(analise.justificativa_escolha);

        doc.font('Helvetica').fontSize(10);
        const justificativaHeight = doc.heightOfString(justificativaText, { width: contentWidth - 20, lineGap: 2 });
        const totalJustHeight = justificativaHeight + 30;

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#003087').text('Justificativa', margin + 10, justY);
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#1F2937')
          .text(justificativaText, margin + 10, justY + 15, { width: contentWidth - 20, lineGap: 2 });

        doc.y = justY + totalJustHeight + 10;
      }

      if (analise.top_ranking && Array.isArray(analise.top_ranking)) {
        this.verificarEspacoPagina(doc, 30);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#4B5563').text('Alternativas Avaliadas', margin, doc.y);
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
          const isEscolhaPrincipal =
            analise.escolha_principal && ranking.nome && String(ranking.nome) === String(analise.escolha_principal);

          doc.font('Helvetica').fontSize(9).fillColor('#6B7280').text(`${rankIndex + 1}`, margin + 10, rankY + 10);

          const nomeText = ranking.nome ? String(ranking.nome) : 'Produto não identificado';
          doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .fillColor('#1F2937')
            .text(nomeText, margin + 30, rankY + 10, { width: contentWidth - 160, lineGap: 2 });

          const nomeTextHeight = doc.heightOfString(nomeText, { width: contentWidth - 160, lineGap: 2 });
          const baseLeftY = rankY + 10 + nomeTextHeight + 6;

          if (isEscolhaPrincipal) {
            const badgeWidth = 80;
            const badgeX = margin + contentWidth - badgeWidth - 10;
            doc
              .fillColor('#D1FAE5')
              .roundedRect(badgeX, rankY + 8, badgeWidth, 20, 3)
              .fill()
              .font('Helvetica-Bold')
              .fontSize(8)
              .fillColor('#059669')
              .text('SELECIONADO', badgeX, rankY + 12, { width: badgeWidth, align: 'center' });
          }

          if (ranking.preco) {
            const precoFormatado = formatPrecoAOA(ranking.preco);
            doc
              .font('Helvetica-Bold')
              .fontSize(9)
              .fillColor('#003087')
              .text(`AOA$ ${precoFormatado}`, margin + contentWidth - 90, rankY + (isEscolhaPrincipal ? 30 : 15));
          }

          if (ranking.id) {
            doc.font('Helvetica').fontSize(8).fillColor('#9CA3AF').text(`ID: ${String(ranking.id)}`, margin + 30, baseLeftY);
          }

          if (ranking.justificativa) {
            const justificativaText = String(ranking.justificativa);
            doc
              .font('Helvetica')
              .fontSize(9)
              .fillColor('#6B7280')
              .text(justificativaText, margin + 30, baseLeftY + 10, { width: contentWidth - 160, lineGap: 2 });
          }

          doc.y = rankY + itemHeight + 10;
        });
      }

      if (analise.criterios_avaliacao) {
        this.verificarEspacoPagina(doc, 50);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#4B5563').text('Critérios Aplicados', margin, doc.y);
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
              .fillColor('#1F2937')
              .text(`${index + 1}. ${criterio.label}`, margin + 10, criterioY);
            doc
              .font('Helvetica')
              .fontSize(9)
              .fillColor('#4B5563')
              .text(criterioText, margin + 10, criterioY + 15, { width: contentWidth - 20, lineGap: 2 });

            doc.y = criterioY + totalHeight + 5;
          }
        });
      }

      doc.y += 15;
    });
  }
}
