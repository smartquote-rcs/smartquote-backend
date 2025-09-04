import PDFKit from 'pdfkit';
import { RelatorioData } from '../types';
import { theme } from '../theme';

export class AnaliseLocalRenderer {
  private verificarEspacoPagina(doc: PDFKit.PDFDocument, altura: number) {
    if (doc.y + altura > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
  }

  public adicionarSecaoAnaliseLocal(doc: PDFKit.PDFDocument, data: RelatorioData) {
    const margin = doc.page.margins.left;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - (margin * 2);
    
    // Verificar espaço para a seção
    this.verificarEspacoPagina(doc, 400);
    
    // Título da seção com gradiente visual
    doc
      .fill(theme.header.bg)
      .rect(margin - 20, doc.y - 10, contentWidth + 40, 45)
      .fillAndStroke(theme.header.bg, theme.header.stroke);
    
    doc
      .fill(theme.header.title)
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Análise Da Pesquisa Local', margin, doc.y + 10)
      .moveDown(1.5);

    // Subtítulo de rastreabilidade para sinalização rápida
    this.verificarEspacoPagina(doc, 30);
    const subY = doc.y;
    doc
      .fill(theme.trace.barBg)
      .rect(margin, subY, contentWidth, 26)
      .fillAndStroke(theme.trace.barBg, theme.trace.barStroke);
    doc
      .fill(theme.trace.barText)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('RASTREABILIDADE DE DECISÕES E SUGESTÕES', margin + 12, subY + 7);
    doc.y = subY + 32;
    
    // Verificar se há análises locais
    const analiseLocal = Array.isArray(data.analiseLocal) ? data.analiseLocal : (data.analiseLocal ? [data.analiseLocal] : []);
    
    if (analiseLocal.length === 0) {
      // Card de aviso quando não há análises
      doc
        .fill('#f0f9ff')
        .rect(margin, doc.y, contentWidth, 60)
        .fillAndStroke('#f0f9ff', '#93c5fd');
      
      doc
        .fill('#0f172a')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('AVISO', margin + 20, doc.y + 20)
        .fontSize(11)
        .font('Helvetica')
        .text('Nenhuma analise LLM disponivel para esta cotacao.', margin + 20, doc.y + 35)
        .moveDown(2);
      return;
    }
    
    // Para cada análise local, mostrar top 5 com design aprimorado
    analiseLocal.forEach((analiseItem, analiseIndex) => {
      // Extrair o relatório LLM do item
      const analise = analiseItem.llm_relatorio || analiseItem;
      // Verificar espaço para cada análise
      this.verificarEspacoPagina(doc, 150);
      // Card da análise
      const analiseY = doc.y;
      doc
        .fill(theme.card.neutralBg)
        .rect(margin, analiseY, contentWidth, 40)
        .fillAndStroke(theme.card.neutralBg, theme.card.infoStroke);
      
      // Ícone da pesquisa
      doc
        .fill(theme.info.main)
        .circle(margin + 20, analiseY + 20, 12)
        .fill()
        .fill('#ffffff')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`${analiseIndex + 1}`, margin + 16, analiseY + 16);
      
      doc
        .fill(theme.text.primary)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`PESQUISA: ${analise.query}`, margin + 45, analiseY + 15)
        .moveDown(1.5);

      // Resumo de Rastreabilidade (trilha de decisão)
      const timestamp = (analiseItem as any).timestamp || (analise as any).timestamp || Date.now();
      const criterios = analise.criterios_avaliacao || {} as any;
      const criteriosLabelsResumo = [
        criterios.correspondencia_tipo ? 'Correspondência de Tipo' : undefined,
        criterios.especificacoes ? 'Especificações' : undefined,
        criterios.custo_beneficio ? 'Custo-Benefício' : undefined,
        criterios.disponibilidade ? 'Disponibilidade' : undefined,
      ].filter(Boolean).join(', ') || '—';
      const decisaoResumo = analise.escolha_principal ? String(analise.escolha_principal) : 'não encontrada';
      const evidenciasResumo = Array.isArray(analise.top_ranking) ? `${analise.top_ranking.length} evidência(s) consideradas` : '0 evidência(s) consideradas';

      // Calcular altura dinâmica do resumo
      doc.fontSize(10).font('Helvetica');
      const decisaoH = doc.heightOfString(decisaoResumo, { width: contentWidth - 40, lineGap: 2 });
      const criteriosH = doc.heightOfString(String(criteriosLabelsResumo), { width: contentWidth - 40, lineGap: 2 });
      const resumoAltura = 30 + decisaoH + criteriosH + 20;

      this.verificarEspacoPagina(doc, resumoAltura + 40);
      const resumoY = doc.y;
      // Header do resumo
      doc
        .fill(theme.trace.summaryHeaderBg)
        .rect(margin, resumoY, contentWidth, 28)
        .fillAndStroke(theme.trace.summaryHeaderBg, theme.trace.summaryHeaderStroke);
      doc
        .fill(theme.trace.summaryHeaderText)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('RESUMO DE RASTREABILIDADE', margin + 12, resumoY + 7);

      // Corpo do resumo
      const corpoY = resumoY + 33;
      doc
        .fill(theme.trace.bodyBg)
        .rect(margin, corpoY, contentWidth, resumoAltura)
        .fillAndStroke(theme.trace.bodyBg, theme.trace.bodyStroke);
      doc
        .fill(theme.trace.bodyText)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Decisão:', margin + 16, corpoY + 12);
      doc
        .font('Helvetica')
        .text(decisaoResumo, margin + 85, corpoY + 12, { width: contentWidth - 100, lineGap: 2 });
      doc
        .font('Helvetica-Bold')
        .text('Critérios considerados:', margin + 16, corpoY + 12 + decisaoH + 8);
      doc
        .font('Helvetica')
        .text(String(criteriosLabelsResumo), margin + 160, corpoY + 12 + decisaoH + 8, { width: contentWidth - 175, lineGap: 2 });
      doc
        .font('Helvetica-Bold')
        .text('Evidências:', margin + 16, corpoY + 12 + decisaoH + 8 + criteriosH + 8);
      doc
        .font('Helvetica')
        .text(`${evidenciasResumo} • Data/hora: ${new Date(timestamp).toLocaleString('pt-BR')}`,
              margin + 95, corpoY + 12 + decisaoH + 8 + criteriosH + 8, { width: contentWidth - 110, lineGap: 2 });

      doc.y = corpoY + resumoAltura + 15;

      // Card da escolha princi,pal
      if (analise.escolha_principal) {
        const choiceY = doc.y;
        
        // Calcular altura dinâmica do texto da escolha
        doc.fontSize(12).font('Helvetica-Bold');
        const escolhaHeight = doc.heightOfString(analise.escolha_principal, { 
          width: contentWidth - 40,
          lineGap: 2
        });
        const totalChoiceHeight = escolhaHeight + 60; // padding + header
        
        if (analise.justificativa_escolha) {
          // Verificar espaço mínimo antes de desenhar
          this.verificarEspacoPagina(doc, 100);
        
          const justY = doc.y;
          
          // Calcular altura dinâmica da justificativa
          doc.fontSize(10).font('Helvetica');
          const justificativaHeight = doc.heightOfString(analise.justificativa_escolha, {
            width: contentWidth - 40,
            lineGap: 2
          });
          const totalJustHeight = justificativaHeight + 50; // padding + header
          
          // Caixa amarela
          doc
            .fill(theme.warning.bg)
            .rect(margin, justY, contentWidth, totalJustHeight)
            .fillAndStroke(theme.warning.bg, theme.warning.stroke);
          
          // Título
          doc
            .fill(theme.warning.text)
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('JUSTIFICATIVA DA ESCOLHA (EVIDÊNCIA PRINCIPAL)', margin + 20, justY + 15);
          
          // Texto da justificativa
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(analise.justificativa_escolha, margin + 20, justY + 35, {
              width: contentWidth - 40,
              lineGap: 2
            });
          
          // Atualizar posição Y
          doc.y = justY + totalJustHeight + 15;
        }
      }
      
      // Mostrar ranking completo top 5 com design aprimorado
      if (analise.top_ranking && Array.isArray(analise.top_ranking)) {
        // Verificar espaço para título do ranking
        this.verificarEspacoPagina(doc, 50);
        
        // Título do ranking
        doc
          .fill(theme.info.main)
          .rect(margin, doc.y, contentWidth, 35)
          .fillAndStroke(theme.info.main, theme.info.alt);
        
        doc
          .fill(theme.header.title)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(`Melhores Resultados Da Pesquisa para "${analise.query}"`, margin + 20, doc.y + 10)
          .moveDown(1.2);
        
        analise.top_ranking.forEach((ranking: any, rankIndex: number) => {
          // Calcular altura dinâmica para cada item do ranking
          let itemHeight = 40; // padding inicial
          
          // Altura do nome do produto
          doc.fontSize(12).font('Helvetica-Bold');
          const nomeHeight = doc.heightOfString(ranking.nome || 'Produto sem nome', { 
            width: contentWidth - 220,
            lineGap: 2
          });
          itemHeight += Math.max(nomeHeight, 20) + 10;
          
          // Altura da justificativa
          if (ranking.justificativa) {
            doc.fontSize(9).font('Helvetica');
            const justHeight = doc.heightOfString(ranking.justificativa, { 
              width: contentWidth - 220,
              lineGap: 2
            });
            itemHeight += justHeight + 10;
          }
          
          // Altura dos pontos fortes/fracos
          const hasFortes = ranking.pontos_fortes && Array.isArray(ranking.pontos_fortes) && ranking.pontos_fortes.length > 0;
          const hasFracos = ranking.pontos_fracos && Array.isArray(ranking.pontos_fracos) && ranking.pontos_fracos.length > 0;
          
          if (hasFortes || hasFracos) {
            itemHeight += 45; // altura dos mini cards
          }
          
          itemHeight += 20; // padding final
          
          // Verificar espaço para cada item do ranking
          this.verificarEspacoPagina(doc, itemHeight);
          
          const rankY = doc.y;
          const medalColors = ['#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa'];
          const medalColor = medalColors[rankIndex] || '#95a5a6';
          
          // Card do ranking
          doc
            .fill('#ffffff')
            .rect(margin, rankY, contentWidth, itemHeight)
            .fillAndStroke('#ffffff', '#bdc3c7');
          
          // Medalha/posição
          doc
            .fill(medalColor)
            .circle(margin + 25, rankY + 25, 15)
            .fill()
            .fill('#ffffff')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(`${ranking.posicao || rankIndex + 1}`, margin + 20, rankY + 20);
          
          // Nome do produto (com altura calculada)
          const nomeY = rankY + 15;
          doc
            .fill('#2c3e50')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(ranking.nome || 'Produto sem nome', margin + 55, nomeY, { 
              width: contentWidth - 220,
              lineGap: 2
            });
                      // Destaque se for a escolha principal
          const isEscolha = analise.escolha_principal && ranking.nome && (ranking.nome === analise.escolha_principal);
           if (isEscolha) {
            doc
              .fill('#16a34a')
              .rect(margin + contentWidth - 100, nomeY - 2, 100, 30)
              .fill();
            doc
              .fill('#ffffff')
              .fontSize(10)
              .font('Helvetica-Bold')
              .text('ESCOLHA PRINCIPAL', margin + contentWidth - 90, nomeY + 2);
          }



          // Preço (abaixo do score)
          if (ranking.preco) {
            doc
              .fill(theme.price.main)
              .fontSize(11)
              .font('Helvetica-Bold')
              .text(`AOA$ ${ranking.preco}`, margin + contentWidth - 100, nomeY + 30);
          }

      // ID do produto como evidência
          if (ranking.id) {
            doc
        .fill('#0f172a')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('EVIDÊNCIA (ID): ', margin + 55, nomeY + Math.max(nomeHeight, 20) + 5, { continued: true })
        .fill('#334155')
        .font('Helvetica')
        .text(`${ranking.id}`);
          }

          // Justificativa (com espaçamento adequado)
          let currentY = nomeY + Math.max(nomeHeight, 20) + 25;
          if (ranking.justificativa) {
            doc
              .fill('#7f8c8d')
              .fontSize(9)
              .font('Helvetica')
              .text(ranking.justificativa, margin + 55, currentY, { 
                width: contentWidth - 220,
                lineGap: 2
              });
            
            const justHeight = doc.heightOfString(ranking.justificativa, { 
              width: contentWidth - 220,
              lineGap: 2
            });
            currentY += justHeight + 15;
          }

          // Pontos fortes e fracos em mini cards (lado a lado)
          if (hasFortes || hasFracos) {
            const cardsY = currentY;
            const cardWidth = (contentWidth - 120) / 2;
            
            if (hasFortes) {
              // Card pontos fortes
              doc
                .fill(theme.card.neutralBg)
                .rect(margin + 55, cardsY, cardWidth - 5, 35)
                .fillAndStroke(theme.card.neutralBg, theme.card.neutralStroke);
              
              doc
                .fill(theme.info.main)
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('PONTOS FORTES', margin + 60, cardsY + 5);
              
              const fortesText = ranking.pontos_fortes.slice(0, 2).join(', ');
              doc
                .fill(theme.text.labelDark)
                .fontSize(7)
                .font('Helvetica')
                .text(fortesText, margin + 60, cardsY + 18, { 
                  width: cardWidth - 15,
                  lineGap: 1
                });
            }

            if (hasFracos) {
              // Card pontos fracos
              const fracosX = hasFortes ? margin + 55 + cardWidth + 5 : margin + 55;
              
              doc
                .fill(theme.card.neutralBg)
                .rect(fracosX, cardsY, cardWidth - 5, 35)
                .fillAndStroke(theme.card.neutralBg, theme.card.neutralStroke);
              
              doc
                .fill(theme.text.primary)
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('PONTOS FRACOS', fracosX + 5, cardsY + 5);
              
              const fracosText = ranking.pontos_fracos.slice(0, 2).join(', ');
              doc
                .fill(theme.text.labelMuted)
                .fontSize(7)
                .font('Helvetica')
                .text(fracosText, fracosX + 5, cardsY + 18, { 
                  width: cardWidth - 15,
                  lineGap: 1
                });
            }
          }
          
          doc.y = rankY + itemHeight + 15;
        });
      }

  // Mostrar critérios de avaliação se existirem
      if (analise.criterios_avaliacao) {
        this.verificarEspacoPagina(doc, 100);
        
        // Header dos critérios
        doc
          .fill('#34495e')
          .rect(margin, doc.y, contentWidth, 30)
          .fillAndStroke('#34495e', '#2c3e50');
        
        doc
          .fill('#ffffff')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('CRITÉRIOS DE AVALIAÇÃO', margin + 20, doc.y + 8)
          .moveDown(1.2);

        const criterios = analise.criterios_avaliacao;
        const criteriosList = [
          { key: 'correspondencia_tipo', label: 'Correspondência de Tipo' },
          { key: 'especificacoes', label: 'Especificações' },
          { key: 'custo_beneficio', label: 'Custo-Benefício' },
          { key: 'disponibilidade', label: 'Disponibilidade' }
        ];

        criteriosList.forEach(criterio => {
          if ((criterios as any)[criterio.key]) {
            // Verificar espaço para cada critério
            this.verificarEspacoPagina(doc, 60);
            
            const criterioY = doc.y;
            
            // Calcular altura do texto do critério
            doc.fontSize(10).font('Helvetica');
            const textHeight = doc.heightOfString((criterios as any)[criterio.key], {
              width: contentWidth - 40,
              lineGap: 2
            });
            const totalHeight = textHeight + 35;
            
            // Card do critério
            doc
              .fill('#f8f9fa')
              .rect(margin, criterioY, contentWidth, totalHeight)
              .fillAndStroke('#f8f9fa', '#dee2e6');
            
            // Título do critério
            doc
              .fill('#495057')
              .fontSize(11)
              .font('Helvetica-Bold')
              .text(`• ${criterio.label}:`, margin + 20, criterioY + 10);
            
            // Conteúdo do critério
            doc
              .fontSize(10)
              .font('Helvetica')
              .text((criterios as any)[criterio.key], margin + 25, criterioY + 25, { 
                width: contentWidth - 50,
                lineGap: 2
              });
            
            doc.y = criterioY + totalHeight + 10;
          }
        });
      }

      doc.moveDown(1);
    });
  }
}
