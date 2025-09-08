import PDFKit from 'pdfkit';
import { RelatorioData } from '../types';

export class AnaliseExternaRenderer {
  private verificarEspacoPagina(doc: PDFKit.PDFDocument, altura: number) {
    if (doc.y + altura > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
  }

  public adicionarSecaoAnaliseExterna(doc: PDFKit.PDFDocument, data: RelatorioData) {
    const margin = doc.page.margins.left;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - margin * 2;

    // Ensure sufficient page space
    this.verificarEspacoPagina(doc, 80);

    // Header
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#1F2937')
      .text('Análise de Rastreabilidade — Pesquisa em fontes externas', margin, doc.y);

    doc
      .strokeColor('#E5E7EB')
      .lineWidth(0.5)
      .moveTo(margin, doc.y + 8)
      .lineTo(margin + contentWidth, doc.y + 8)
      .stroke();
    doc.y += 15;

    // Orange warning badge/box
    const warnText = 'Aviso: estas são fontes externas não conhecidas (verifique confiabilidade).';
    const boxY = doc.y;
    const boxHeight = 24;
    doc
      .fillColor('#FDE68A') // light amber
      .roundedRect(margin, boxY, contentWidth, boxHeight, 4)
      .fill();
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#92400E') // dark amber text
      .text(warnText, margin + 10, boxY + 7, { width: contentWidth - 20, align: 'left' });
    doc.y = boxY + boxHeight + 10;

    // Data handling
    const analiseExterna = Array.isArray((data as any).analiseExterna)
      ? (data as any).analiseExterna
      : (data as any).analiseExterna
      ? [(data as any).analiseExterna]
      : [];

    if (analiseExterna.length === 0) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#6B7280')
        .text('Nenhum relatório de busca externa disponível para esta cotação.', margin, doc.y);

      doc
        .strokeColor('#E5E7EB')
        .lineWidth(0.5)
        .moveTo(margin, doc.y + 6)
        .lineTo(margin + contentWidth, doc.y + 6)
        .stroke();
      doc.y += 20;
      return;
    }

    // Helper: price format
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

    // Render items (adapted from AnaliseWebRenderer)
    analiseExterna.forEach((relatorio: any, index: number) => {
      if (index > 0) doc.addPage();

      const webY = doc.y;

      // Metadata row (no explicit per-item header text, consistent with updated web renderer)
      const timestamp = (relatorio as any).timestamp || Date.now();
      const produtosAnalisados = Array.isArray(relatorio.top_ranking) ? relatorio.top_ranking.length : 0;
      const statusAnalise = (relatorio as any).status;
      const produtosSelecionados = statusAnalise === 'produto_adicionado' || (relatorio as any).escolha_principal ? 1 : 0;

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#6B7280')
        .text(
          `Data: ${new Date(timestamp).toLocaleDateString('pt-BR')} | Analisados: ${produtosAnalisados} | Selecionados: ${produtosSelecionados}`,
          margin + 10,
          webY + 5
        );

      // Status badge
      if (statusAnalise) {
        const statusX = margin + contentWidth - 100;
        const statusColors: Record<string, string> = {
          produto_adicionado: '#D1FAE5',
          rejeitado_por_llm: '#FEE2E2',
          sem_produtos_encontrados: '#FEF3C7',
          produto_sem_id: '#FFEDD5',
          produto_duplicado: '#DBEAFE',
          erro_llm: '#E0F2FE',
        };
        const textColors: Record<string, string> = {
          produto_adicionado: '#059669',
          rejeitado_por_llm: '#DC2626',
          sem_produtos_encontrados: '#D97706',
          produto_sem_id: '#EA580C',
          produto_duplicado: '#1E40AF',
          erro_llm: '#0EA5E9',
        };
        const badgeColor = statusColors[statusAnalise] || '#E5E7EB';
        const textColor = textColors[statusAnalise] || '#6B7280';

        doc
          .fillColor(badgeColor)
          .roundedRect(statusX, webY + 0, 90, 20, 3)
          .fill()
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor(textColor)
          .text(`STATUS: ${statusAnalise.toUpperCase()}`, statusX, webY + 4, { width: 90, align: 'center' });
      }

      doc.y = webY + 30;
      doc
        .strokeColor('#E5E7EB')
        .lineWidth(0.5)
        .moveTo(margin, doc.y)
        .lineTo(margin + contentWidth, doc.y)
        .stroke();
      doc.y += 10;

      const criteriosFonte = (relatorio as any).criterios_avaliacao || (relatorio as any).criterios_aplicados;
      const decisaoResumo = (relatorio as any).escolha_principal ? String((relatorio as any).escolha_principal) : 'Não encontrada';
      const evidenciasResumo = Array.isArray(relatorio.top_ranking)
        ? `${relatorio.top_ranking.length} fonte(s) analisada(s)`
        : '0 fonte(s) analisada(s)';

      // Resumo
      const resumoY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#4B5563').text('Resumo de Rastreabilidade', margin + 10, resumoY);
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#1F2937')
        .text('Decisão:', margin + 10, resumoY + 15)
        .text(decisaoResumo, margin + 60, resumoY + 15, { width: contentWidth - 70, lineGap: 2 });
      doc
        .text('Evidências:', margin + 10, resumoY + 35)
        .text(`${evidenciasResumo} • ${new Date(timestamp).toLocaleString('pt-BR')}`, margin + 60, resumoY + 35, {
          width: contentWidth - 70,
          lineGap: 2,
        });
      doc.y = resumoY + 60;

      // Ranking
      if (relatorio.top_ranking && Array.isArray(relatorio.top_ranking) && relatorio.top_ranking.length > 0) {
        this.verificarEspacoPagina(doc, 40);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#4B5563').text('Alternativas Avaliadas', margin + 10, doc.y);
        doc
          .strokeColor('#E5E7EB')
          .lineWidth(0.5)
          .moveTo(margin, doc.y + 6)
          .lineTo(margin + contentWidth, doc.y + 6)
          .stroke();
        doc.y += 15;

        const escolhaTexto = ((relatorio as any).escolha_principal || '').toString().toLowerCase();
        (relatorio.top_ranking as any[]).forEach((ranking: any, rankIndex: number) => {
          let itemHeight = 30;
          doc.font('Helvetica-Bold').fontSize(10);
          const nomeHeight = doc.heightOfString(String(ranking.nome || 'Produto sem nome'), { width: contentWidth - 160, lineGap: 2 });
          itemHeight += Math.max(nomeHeight, 15) + 5;
          if (ranking.justificativa) {
            doc.font('Helvetica').fontSize(8);
            const justHeight = doc.heightOfString(String(ranking.justificativa), { width: contentWidth - 160, lineGap: 2 });
            itemHeight += justHeight + 10;
          }
          if (ranking.url) itemHeight += 15;
          const hasFortes = ranking.pontos_fortes && Array.isArray(ranking.pontos_fortes) && ranking.pontos_fortes.length > 0;
          const hasFracos = ranking.pontos_fracos && Array.isArray(ranking.pontos_fracos) && ranking.pontos_fracos.length > 0;
          if (hasFortes || hasFracos) itemHeight += 30;

          this.verificarEspacoPagina(doc, itemHeight);
          const rankY = doc.y;
          const isEscolha = escolhaTexto && ranking?.nome && escolhaTexto.includes((ranking.nome as string).toLowerCase());

          // Rank indicator
          doc.font('Helvetica').fontSize(9).fillColor('#6B7280').text(`${rankIndex + 1}`, margin + 10, rankY + 8);

          // Name
          const nomeText = String(ranking.nome || 'Produto sem nome');
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#1F2937').text(nomeText, margin + 30, rankY + 8, {
            width: contentWidth - 160,
            lineGap: 2,
          });
          const nomeTextHeight = doc.heightOfString(nomeText, { width: contentWidth - 160, lineGap: 2 });
          let currentY = rankY + 8 + nomeTextHeight + 5;

          // Escolha badge
          if (isEscolha) {
            const badgeWidth = 100;
            const badgeX = margin + contentWidth - badgeWidth - 10;
            doc
              .fillColor('#D1FAE5')
              .roundedRect(badgeX, rankY + 5, badgeWidth, 20, 3)
              .fill()
              .font('Helvetica-Bold')
              .fontSize(8)
              .fillColor('#059669')
              .text('ESCOLHA PRINCIPAL', badgeX, rankY + 9, { width: badgeWidth, align: 'center' });
          }

          if (ranking.preco) {
            const precoFmt = formatPrecoAOA(ranking.preco);
            doc
              .font('Helvetica-Bold')
              .fontSize(9)
              .fillColor('#003087')
              .text(`AOA$ ${precoFmt}`, margin + contentWidth - 130, rankY + 15, { width: 120, align: 'right' });
          }

          if (ranking.url) {
            const urlText = String(ranking.url);
            doc
              .font('Helvetica-Bold')
              .fontSize(7)
              .fillColor('#1F2937')
              .text('Link: ', margin + 30, currentY, { continued: true })
              .font('Helvetica')
              .fillColor('#2563EB')
              .text(urlText, { width: contentWidth - 160, lineGap: 2 });
            currentY += 15;
          }

          if (ranking.justificativa) {
            doc
              .font('Helvetica')
              .fontSize(8)
              .fillColor('#6B7280')
              .text(String(ranking.justificativa), margin + 30, currentY, { width: contentWidth - 160, lineGap: 2 });
            const justHeight = doc.heightOfString(String(ranking.justificativa), { width: contentWidth - 160, lineGap: 2 });
            currentY += justHeight + 10;
          }

          if (hasFortes || hasFracos) {
            if (hasFortes) {
              doc.font('Helvetica-Bold').fontSize(7).fillColor('#1F2937').text('Pontos Fortes: ', margin + 30, currentY);
              doc
                .font('Helvetica')
                .fontSize(7)
                .fillColor('#059669')
                .text(ranking.pontos_fortes.slice(0, 2).join(', '), margin + 80, currentY, {
                  width: (contentWidth - 160) / 2,
                  lineGap: 1,
                });
            }
            if (hasFracos) {
              const fracosY = hasFortes ? currentY + 15 : currentY;
              doc.font('Helvetica-Bold').fontSize(7).fillColor('#1F2937').text('Pontos Fracos: ', margin + 30, fracosY);
              doc
                .font('Helvetica')
                .fontSize(7)
                .fillColor('#DC2626')
                .text(ranking.pontos_fracos.slice(0, 2).join(', '), margin + 80, fracosY, {
                  width: (contentWidth - 160) / 2,
                  lineGap: 1,
                });
            }
          }

          doc.y = rankY + itemHeight + 10;
        });
      }

      // Critérios
      if (criteriosFonte) {
        this.verificarEspacoPagina(doc, 40);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#4B5563').text('Critérios Aplicados', margin + 10, doc.y);
        doc
          .strokeColor('#E5E7EB')
          .lineWidth(0.5)
          .moveTo(margin, doc.y + 6)
          .lineTo(margin + contentWidth, doc.y + 6)
          .stroke();
        doc.y += 15;

        const criteriosList = [
          { key: 'correspondencia_tipo', label: 'Correspondência de Tipo' },
          { key: 'especificacoes', label: 'Especificações' },
          { key: 'custo_beneficio', label: 'Custo-Benefício' },
          { key: 'disponibilidade', label: 'Disponibilidade' },
          { key: 'confiabilidade', label: 'Confiabilidade da Fonte' },
          { key: 'reputacao_vendedor', label: 'Reputação do Vendedor' },
        ];

        criteriosList.forEach((criterio) => {
          if ((criteriosFonte as any)[criterio.key]) {
            this.verificarEspacoPagina(doc, 50);
            const criterioY = doc.y;
            const criterioText = String((criteriosFonte as any)[criterio.key]);
            doc.font('Helvetica').fontSize(8);
            const textHeight = doc.heightOfString(criterioText, { width: contentWidth - 20, lineGap: 2 });

            doc.font('Helvetica-Bold').fontSize(9).fillColor('#1F2937').text(`• ${criterio.label}`, margin + 10, criterioY);
            doc
              .font('Helvetica')
              .fontSize(8)
              .fillColor('#4B5563')
              .text(criterioText, margin + 10, criterioY + 15, { width: contentWidth - 20, lineGap: 2 });

            doc.y = criterioY + textHeight + 25;
          }
        });
      }

      // Observações
      const observacoes = (relatorio as any).observacoes;
      if (observacoes) {
        this.verificarEspacoPagina(doc, 50);
        const obsY = doc.y;
        const obsText = String(observacoes);
        doc.font('Helvetica').fontSize(8);
        const obsHeight = doc.heightOfString(obsText, { width: contentWidth - 20, lineGap: 2 });

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#4B5563').text('Observações', margin + 10, obsY);
        doc.font('Helvetica').fontSize(8).fillColor('#1F2937').text(obsText, margin + 10, obsY + 15, {
          width: contentWidth - 20,
          lineGap: 2,
        });

        doc.y = obsY + obsHeight + 25;
      }

      const erro = (relatorio as any).erro;
      if (erro) {
        this.verificarEspacoPagina(doc, 50);
        const erroY = doc.y;
        const erroText = String(erro);
        doc.font('Helvetica').fontSize(8);
        const erroHeight = doc.heightOfString(erroText, { width: contentWidth - 20, lineGap: 2 });

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#DC2626').text('Erro na Análise Externa', margin + 10, erroY);
        doc.font('Helvetica').fontSize(8).fillColor('#1F2937').text(erroText, margin + 10, erroY + 15, {
          width: contentWidth - 20,
          lineGap: 2,
        });

        doc.y = erroY + erroHeight + 25;
      }

      doc.y += 10;
    });
  }
}
