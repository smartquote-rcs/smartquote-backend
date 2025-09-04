import PDFKit from 'pdfkit';
import { RelatorioData } from '../types';
import { theme } from '../theme';

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
      .fill(theme.header.bg)
      .rect(margin - 20, doc.y - 10, contentWidth + 40, 45)
      .fillAndStroke(theme.header.bg, theme.header.stroke);
    
    doc
  .fill(theme.header.title)
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Análise Da Pesquisa Web', margin, doc.y + 10)
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
      // nova pagina se for diferente da primeira pagina
      if (webIndex > 0) {
        doc.addPage();
      }

  // Card do relatório web
      const webY = doc.y;
      doc
        .fill(theme.card.neutralBg)
        .rect(margin, webY, contentWidth, 80)
        .fillAndStroke(theme.card.neutralBg, theme.card.infoStroke);
      
      // Ícone da busca web
      doc
        .fill(theme.info.main)
        .circle(margin + 20, webY + 20, 12)
        .fill()
        .fill('#ffffff')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`${webIndex + 1}`, margin + 16, webY + 16);
      
      doc
  .fill(theme.text.primary)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`BUSCA WEB: ${relatorioWeb.query.query_sugerida}`, margin + 45, webY + 15);

  // Informações da busca em linha
  const timestamp = (relatorioWeb as any).timestamp || Date.now();
  // Calcular produtos analisados e selecionados com base nos dados reais
  const produtosAnalisados = Array.isArray(relatorioWeb.top_ranking) ? relatorioWeb.top_ranking.length : 0;
  const statusAnalise: string | undefined = (relatorioWeb as any).status;
  const produtosSelecionados = (statusAnalise === 'produto_adicionado' || !!relatorioWeb.escolha_principal) ? 1 : 0;
      
      doc
        .fill(theme.text.muted)
        .fontSize(9)
        .font('Helvetica')
        .text(`Data: ${new Date(timestamp).toLocaleDateString('pt-BR')} | `, margin + 45, webY + 35)
        .text(`Analisados: ${produtosAnalisados} | `, margin + 180, webY + 35)
        .text(`Selecionados: ${produtosSelecionados}`, margin + 300, webY + 35);

      // Badge de status da análise, se houver
      if (statusAnalise) {
        const statusX = margin + contentWidth - 180;
        const statusY = webY + 12;
        const statusColors: any = {
          produto_adicionado: '#22c55e',
          rejeitado_por_llm: '#ef4444',
          sem_produtos_encontrados: '#f59e0b',
          produto_sem_id: '#f97316',
          produto_duplicado: '#3b82f6',
          erro_llm: '#0ea5e9'
        };
  const color = statusColors[statusAnalise] || '#6b7280';
        doc
          .fill(color)
          .rect(statusX, statusY, 160, 22)
          .fill();
        doc
          .fill('#ffffff')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`STATUS: ${statusAnalise}`, statusX + 8, statusY + 6);
      }
      
      doc.y = webY + 95;

      // Resumo de Rastreabilidade (trilha de decisão)
      const criteriosFonteResumo: any = (relatorioWeb as any).criterios_avaliacao || (relatorioWeb as any).criterios_aplicados;
      const criteriosLabelsResumo = criteriosFonteResumo ? [
        criteriosFonteResumo.correspondencia_tipo ? 'Correspondência de Tipo' : undefined,
        criteriosFonteResumo.especificacoes ? 'Especificações' : undefined,
        criteriosFonteResumo.custo_beneficio ? 'Custo-Benefício' : undefined,
        criteriosFonteResumo.disponibilidade ? 'Disponibilidade' : undefined,
        criteriosFonteResumo.confiabilidade ? 'Confiabilidade da Fonte' : undefined,
        criteriosFonteResumo.reputacao_vendedor ? 'Reputação do Vendedor' : undefined,
      ].filter(Boolean).join(', ') : '—';
      const decisaoResumo = relatorioWeb.escolha_principal ? String(relatorioWeb.escolha_principal) : 'não encontrada';
      const evidenciasResumo = Array.isArray(relatorioWeb.top_ranking) ? `${relatorioWeb.top_ranking.length} fonte(s) analisadas` : '0 fonte(s) analisadas';

      // Calcular altura dinâmica do resumo
      doc.fontSize(10).font('Helvetica');
      const decisaoH = doc.heightOfString(decisaoResumo, { width: contentWidth - 40, lineGap: 2 });
      const criteriosH = doc.heightOfString(String(criteriosLabelsResumo), { width: contentWidth - 40, lineGap: 2 });
      const resumoAltura = 30 + decisaoH + criteriosH + 20; // header + textos + padding

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
        .text(String(criteriosLabelsResumo) || '—', margin + 160, corpoY + 12 + decisaoH + 8, { width: contentWidth - 175, lineGap: 2 });
      doc
        .font('Helvetica-Bold')
        .text('Evidências:', margin + 16, corpoY + 12 + decisaoH + 8 + criteriosH + 8);
      doc
        .font('Helvetica')
        .text(`${evidenciasResumo} • Data/hora: ${new Date(timestamp).toLocaleString('pt-BR')}`,
              margin + 95, corpoY + 12 + decisaoH + 8 + criteriosH + 8, { width: contentWidth - 110, lineGap: 2 });

      doc.y = corpoY + resumoAltura + 15;

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
            .text(relatorioWeb.justificativa_escolha, margin + 20, justY + 35, {
              width: contentWidth - 40,
              lineGap: 2
            });
        
          // Atualizar posição Y
          doc.y = justY + totalJustHeight + 15;
        }
      }

      // Se não houver produtos e o status indicar ausência, mostrar card informativo
      if ((!relatorioWeb.top_ranking || relatorioWeb.top_ranking.length === 0) && statusAnalise === 'sem_produtos_encontrados') {
        this.verificarEspacoPagina(doc, 80);
        const emptyY = doc.y;
        doc
          .fill('#fff3cd')
          .rect(margin, emptyY, contentWidth, 60)
          .fillAndStroke('#fff3cd', '#ffc107');
        doc
          .fill('#856404')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('SEM PRODUTOS ENCONTRADOS', margin + 20, emptyY + 15)
          .fontSize(10)
          .font('Helvetica')
          .text('A busca web não retornou produtos para esta consulta.', margin + 20, emptyY + 35);
        doc.y = emptyY + 75;
      }

      // Mostrar ranking completo top 5 com design aprimorado
      if (relatorioWeb.top_ranking && Array.isArray(relatorioWeb.top_ranking) && relatorioWeb.top_ranking.length > 0) {
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
          .text(`Melhores Resultados Da Pesquisa para "${relatorioWeb.query.query_sugerida}"`, margin + 20, doc.y + 10)
          .moveDown(1.2);

  const escolhaTexto: string = (relatorioWeb.escolha_principal || '').toString().toLowerCase();
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
          const medalColors = theme.medals.colors;
          const medalColor = medalColors[rankIndex] || theme.medals.fallback;
          
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
          const isEscolha = escolhaTexto && ranking?.nome && escolhaTexto.includes((ranking.nome as string).toLowerCase());
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
              .fill('#e67e22')
              .fontSize(11)
              .font('Helvetica-Bold')
              .text(`AOA$ ${ranking.preco}`, margin + contentWidth - 100, nomeY + 30);
          }

          // URL (pequena e discreta)
          let currentY = nomeY + Math.max(nomeHeight, 20) + 10;
      if (ranking.url) {
            const urlText = ranking.url;
            doc
              .fill(theme.info.alt)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('EVIDÊNCIA (LINK): ', margin + 55, currentY, { continued: true })
              .fill(theme.info.link)
        .font('Helvetica')
        .text(`${urlText}`);
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

      // Mostrar critérios de avaliação se existirem (criterios_avaliacao ou criterios_aplicados)
      const criteriosFonte: any = (relatorioWeb as any).criterios_avaliacao || (relatorioWeb as any).criterios_aplicados;
      if (criteriosFonte) {
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
          .text('CRITÉRIOS - ANÁLISE LLM', margin + 20, doc.y + 8)
          .moveDown(1.2);
        const criterios = criteriosFonte;
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

    // Observações gerais, se houver
      const observacoes: string | undefined = (relatorioWeb as any).observacoes;
      if (observacoes) {
        this.verificarEspacoPagina(doc, 80);
        const obsY = doc.y;
        doc
          .fill(theme.audit.bg)
          .rect(margin, obsY, contentWidth, 60)
          .fillAndStroke(theme.audit.bg, theme.audit.stroke);
        doc
          .fill(theme.text.auditTitle)
          .fontSize(11)
          .font('Helvetica-Bold')
      .text('OBSERVAÇÕES / NOTAS DE AUDITORIA', margin + 20, obsY + 12);
        doc
          .fill(theme.text.auditBody)
          .fontSize(10)
          .font('Helvetica')
          .text(observacoes, margin + 20, obsY + 30, { width: contentWidth - 40, lineGap: 2 });
        doc.y = obsY + 75;
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
