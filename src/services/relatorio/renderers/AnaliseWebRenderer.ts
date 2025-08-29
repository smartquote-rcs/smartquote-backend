import PDFKit from 'pdfkit';
import { RelatorioData } from '../types';

export class AnaliseWebRenderer {
  private verificarEspacoPagina(doc: PDFKit.PDFDocument, altura: number) {
    if (doc.y + altura > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
  }

  public adicionarSecaoAnaliseWeb(doc: PDFKit.PDFDocument, data: RelatorioData) {
    const margin = doc.page.margins.left;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - (margin * 2);
    
    // Verificar espaço para a seção
    this.verificarEspacoPagina(doc, 100);
    
    // Título da seção com gradiente visual (mesmo estilo)
    doc
      .fill('#e74c3c')
      .rect(margin - 20, doc.y - 10, contentWidth + 40, 45)
      .fillAndStroke('#e74c3c', '#c0392b');
    
    doc
      .fill('#ffffff')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('RELATÓRIO DE BUSCA WEB', margin, doc.y + 10)
      .moveDown(1.5);

    // Verificar se há análises web
    const analiseWeb = Array.isArray(data.analiseWeb) ? data.analiseWeb : (data.analiseWeb ? [data.analiseWeb] : []);

    if (analiseWeb.length === 0) {
      // Card de aviso quando não há relatórios web
      doc
        .fill('#fff3cd')
        .rect(margin, doc.y, contentWidth, 60)
        .fillAndStroke('#fff3cd', '#ffc107');
      
      doc
        .fill('#856404')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('AVISO', margin + 20, doc.y + 20)
        .fontSize(11)
        .font('Helvetica')
        .text('Nenhum relatório de busca web disponível para esta cotação.', margin + 20, doc.y + 35)
        .moveDown(2);
      return;
    }

    // Para cada relatório web, mostrar com design aprimorado
    analiseWeb.forEach((relatorioWebItem, webIndex) => {
      // A estrutura da análise web é diferente - não tem llm_relatorio aninhado
      const relatorioWeb = relatorioWebItem;
      // Verificar espaço para cada relatório web
      this.verificarEspacoPagina(doc, 150);
      
      // Card do relatório web
      const webY = doc.y;
      doc
        .fill('#f8f9fa')
        .rect(margin, webY, contentWidth, 80)
        .fillAndStroke('#f8f9fa', '#e74c3c');
      
      // Ícone da busca web
      doc
        .fill('#e74c3c')
        .circle(margin + 20, webY + 20, 12)
        .fill()
        .fill('#ffffff')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`${webIndex + 1}`, margin + 16, webY + 16);
      
      doc
        .fill('#2c3e50')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`BUSCA WEB: ${webIndex + 1}`, margin + 45, webY + 15);

      // Informações da busca em linha
      const timestamp = (relatorioWeb as any).timestamp || Date.now();
      const produtosAnalisados = (relatorioWeb as any).produtos_analisados || 0;
      const produtosSelecionados = (relatorioWeb as any).produtos_selecionados || 0;
      
      doc
        .fill('#7f8c8d')
        .fontSize(9)
        .font('Helvetica')
        .text(`Data: ${new Date(timestamp).toLocaleDateString('pt-BR')} | `, margin + 45, webY + 35)
        .text(`Analisados: ${produtosAnalisados} | `, margin + 180, webY + 35)
        .text(`Selecionados: ${produtosSelecionados}`, margin + 300, webY + 35);
      
      doc.y = webY + 95;

      // Card da escolha principal
      if (relatorioWeb.escolha_principal) {
        const choiceY = doc.y;
        
        // Calcular altura dinâmica do texto da escolha
        doc.fontSize(12).font('Helvetica-Bold');
        const escolhaHeight = doc.heightOfString(relatorioWeb.escolha_principal, { 
          width: contentWidth - 40,
          lineGap: 2
        });
        const totalChoiceHeight = escolhaHeight + 60; // padding + header
        
        doc
          .fill('#e8f5e8')
          .rect(margin, choiceY, contentWidth, totalChoiceHeight)
          .fillAndStroke('#e8f5e8', '#27ae60');
        
        // Indicador de escolha
        doc
          .fill('#27ae60')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('TOP', margin + 20, choiceY + 18);
        
        doc
          .fill('#2c3e50')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('PRODUTO RECOMENDADO WEB', margin + 50, choiceY + 15);
        
        // Texto da escolha principal
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(relatorioWeb.escolha_principal, margin + 20, choiceY + 40, { 
            width: contentWidth - 40,
            lineGap: 2
          });
        
        doc.y = choiceY + totalChoiceHeight + 15;
        
        if (relatorioWeb.justificativa_escolha) {
          // Verificar espaço mínimo antes de desenhar
          this.verificarEspacoPagina(doc, 100);
        
          const justY = doc.y;
          
          // Calcular altura dinâmica da justificativa
          doc.fontSize(10).font('Helvetica');
          const justificativaHeight = doc.heightOfString(relatorioWeb.justificativa_escolha, {
            width: contentWidth - 40,
            lineGap: 2
          });
          const totalJustHeight = justificativaHeight + 50; // padding + header
        
          // Caixa amarela
          doc
            .fill('#fff3cd')
            .rect(margin, justY, contentWidth, totalJustHeight)
            .fillAndStroke('#fff3cd', '#ffc107');
        
          // Título
          doc
            .fill('#856404')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('JUSTIFICATIVA DA ESCOLHA', margin + 20, justY + 15);
        
          // Texto da justificativa
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(relatorioWeb.justificativa_escolha, margin + 20, justY + 35, {
              width: contentWidth - 40,
              lineGap: 2
            });
        
          // Atualizar posição Y
          doc.y = justY + totalJustHeight + 15;
        }
      }

      // Mostrar ranking completo top 5 com design aprimorado
      if (relatorioWeb.top_ranking && Array.isArray(relatorioWeb.top_ranking)) {
        // Verificar espaço para título do ranking
        this.verificarEspacoPagina(doc, 50);
        
        // Título do ranking
        doc
          .fill('#3498db')
          .rect(margin, doc.y, contentWidth, 35)
          .fillAndStroke('#3498db', '#2980b9');
        
        doc
          .fill('#ffffff')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('RANKING WEB COMPLETO TOP 5', margin + 20, doc.y + 10)
          .moveDown(1.2);

        relatorioWeb.top_ranking.forEach((ranking: any, rankIndex: number) => {
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

          // Altura da URL
          if (ranking.url) {
            itemHeight += 15;
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
          const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#4a90e2', '#9b59b6'];
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
              .fill('#27ae60')
              .fontSize(16)
              .font('Helvetica-Bold')
              .text(`${(ranking.score_estimado * 100).toFixed(1)}%`, margin + contentWidth - 100, nomeY + 5);
          }

          // Preço (abaixo do score)
          if (ranking.preco) {
            doc
              .fill('#e67e22')
              .fontSize(11)
              .font('Helvetica-Bold')
              .text(`AOA$ ${ranking.preco}`, margin + contentWidth - 100, nomeY + 30);
          }

          // URL (pequena e discreta)
          let currentY = nomeY + Math.max(nomeHeight, 20) + 10;
          if (ranking.url) {
            const urlText = ranking.url.length > 60 ? ranking.url.substring(0, 60) + '...' : ranking.url;
            doc
              .fill('#3498db')
              .fontSize(8)
              .font('Helvetica')
              .text(` ${urlText}`, margin + 55, currentY);
            currentY += 15;
          }

          // Justificativa (com espaçamento adequado)
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
                .fill('#d5f4e6')
                .rect(margin + 55, cardsY, cardWidth - 5, 35)
                .fillAndStroke('#d5f4e6', '#27ae60');
              
              doc
                .fill('#27ae60')
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('PONTOS FORTES', margin + 60, cardsY + 5);
              
              const fortesText = ranking.pontos_fortes.slice(0, 2).join(', ');
              doc
                .fill('#2c3e50')
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
                .fill('#fdeaea')
                .rect(fracosX, cardsY, cardWidth - 5, 35)
                .fillAndStroke('#fdeaea', '#e74c3c');
              
              doc
                .fill('#e74c3c')
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('PONTOS FRACOS', fracosX + 5, cardsY + 5);
              
              const fracosText = ranking.pontos_fracos.slice(0, 2).join(', ');
              doc
                .fill('#2c3e50')
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
      if (relatorioWeb.criterios_avaliacao) {
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
          .text('CRITÉRIOS DE AVALIAÇÃO WEB', margin + 20, doc.y + 8)
          .moveDown(1.2);

        const criterios = relatorioWeb.criterios_avaliacao;
        const criteriosList = [
          { key: 'correspondencia_tipo', label: 'Correspondência de Tipo' },
          { key: 'especificacoes', label: 'Especificações' },
          { key: 'custo_beneficio', label: 'Custo-Benefício' },
          { key: 'disponibilidade', label: 'Disponibilidade' },
          { key: 'confiabilidade', label: 'Confiabilidade da Fonte' },
          { key: 'reputacao_vendedor', label: 'Reputação do Vendedor' }
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

      // Mostrar erro se houver
      const erro = (relatorioWeb as any).erro;
      if (erro) {
        this.verificarEspacoPagina(doc, 80);
        
        const erroY = doc.y;
        
        // Calcular altura do erro
        doc.fontSize(10).font('Helvetica');
        const erroHeight = doc.heightOfString(erro, {
          width: contentWidth - 40,
          lineGap: 2
        });
        const totalErroHeight = erroHeight + 50;
        
        // Card de erro
        doc
          .fill('#fdeaea')
          .rect(margin, erroY, contentWidth, totalErroHeight)
          .fillAndStroke('#fdeaea', '#e74c3c');
        
        doc
          .fill('#e74c3c')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('ERRO NA ANÁLISE WEB', margin + 20, erroY + 15);
        
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(erro, margin + 20, erroY + 35, {
            width: contentWidth - 40,
            lineGap: 2
          });
        
        doc.y = erroY + totalErroHeight + 15;
      }

      doc.moveDown(1);
    });
  }
}
