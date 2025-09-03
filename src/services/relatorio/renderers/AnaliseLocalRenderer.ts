import PDFKit from 'pdfkit';
import { RelatorioData } from '../types';

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
      .fill('#1e40af')
      .rect(margin - 20, doc.y - 10, contentWidth + 40, 45)
      .fillAndStroke('#1e40af', '#1d4ed8');
    
    doc
      .fill('#ffffff')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('ANALISE INTELIGENTE - TOP 5 PRODUTOS', margin, doc.y + 10)
      .moveDown(1.5);
    
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
        .fill('#f8f9fa')
        .rect(margin, analiseY, contentWidth, 40)
        .fillAndStroke('#f8f9fa', '#8e44ad');
      
      // Ícone da pesquisa
      doc
        .fill('#8e44ad')
        .circle(margin + 20, analiseY + 20, 12)
        .fill()
        .fill('#ffffff')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`${analiseIndex + 1}`, margin + 16, analiseY + 16);
      
      doc
        .fill('#2c3e50')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`PESQUISA: ${analiseIndex + 1}`, margin + 45, analiseY + 15)
        .moveDown(1.5);
      
      // Card da escolha principal
      if (analise.escolha_principal) {
        const choiceY = doc.y;
        
        // Calcular altura dinâmica do texto da escolha
        doc.fontSize(12).font('Helvetica-Bold');
        const escolhaHeight = doc.heightOfString(analise.escolha_principal, { 
          width: contentWidth - 40,
          lineGap: 2
        });
        const totalChoiceHeight = escolhaHeight + 60; // padding + header
        
        doc
          .fill('#eff6ff')
          .rect(margin, choiceY, contentWidth, totalChoiceHeight)
          .fillAndStroke('#eff6ff', '#3b82f6');
        
        // Indicador de escolha
        doc
          .fill('#1e40af')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('TOP', margin + 20, choiceY + 18);
        
        doc
          .fill('#2c3e50')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('PRODUTO RECOMENDADO', margin + 50, choiceY + 15);
        
        // Texto da escolha principal
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(analise.escolha_principal, margin + 20, choiceY + 40, { 
            width: contentWidth - 40,
            lineGap: 2
          });
        
        doc.y = choiceY + totalChoiceHeight + 15;
        
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
            .fill('#e0f2fe')
            .rect(margin, justY, contentWidth, totalJustHeight)
            .fillAndStroke('#e0f2fe', '#93c5fd');
          
          // Título
          doc
            .fill('#1e3a8a')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('JUSTIFICATIVA DA ESCOLHA', margin + 20, justY + 15);
          
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
          .fill('#2563eb')
          .rect(margin, doc.y, contentWidth, 35)
          .fillAndStroke('#2563eb', '#1d4ed8');
        
        doc
          .fill('#ffffff')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('RANKING COMPLETO TOP 5', margin + 20, doc.y + 10)
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

          // Score em destaque (posicionado adequadamente)
          if (ranking.score_estimado) {
            doc
              .fill('#1e40af')
              .fontSize(16)
              .font('Helvetica-Bold')
              .text(`${(ranking.score_estimado * 100).toFixed(1)}%`, margin + contentWidth - 100, nomeY + 5);
          }

          // Preço (abaixo do score)
          if (ranking.preco) {
            doc
              .fill('#0ea5e9')
              .fontSize(11)
              .font('Helvetica-Bold')
              .text(`AOA$ ${ranking.preco}`, margin + contentWidth - 100, nomeY + 30);
          }

          // ID do produto (pequeno e discreto)
          if (ranking.id) {
            doc
              .fill('#95a5a6')
              .fontSize(8)
              .font('Helvetica')
              .text(`ID: ${ranking.id}`, margin + 55, nomeY + Math.max(nomeHeight, 20) + 5);
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
                .fill('#e0f2fe')
                .rect(margin + 55, cardsY, cardWidth - 5, 35)
                .fillAndStroke('#e0f2fe', '#38bdf8');
              
              doc
                .fill('#0ea5e9')
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('PONTOS FORTES', margin + 60, cardsY + 5);
              
              const fortesText = ranking.pontos_fortes.slice(0, 2).join(', ');
              doc
                .fill('#1e293b')
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
                .fill('#f1f5f9')
                .rect(fracosX, cardsY, cardWidth - 5, 35)
                .fillAndStroke('#f1f5f9', '#94a3b8');
              
              doc
                .fill('#475569')
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('PONTOS FRACOS', fracosX + 5, cardsY + 5);
              
              const fracosText = ranking.pontos_fracos.slice(0, 2).join(', ');
              doc
                .fill('#334155')
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
