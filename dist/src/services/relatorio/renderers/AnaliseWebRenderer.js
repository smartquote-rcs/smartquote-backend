"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnaliseWebRenderer = void 0;
class AnaliseWebRenderer {
    verificarEspacoPagina(doc, altura) {
        if (doc.y + altura > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
        }
    }
    /**
   * Renders the web analysis section in a formal, executive, and legible style.
   */
    adicionarSecaoAnaliseWeb(doc, data) {
        const margin = doc.page.margins.left;
        const pageWidth = doc.page.width;
        const contentWidth = pageWidth - margin * 2;
        // Ensure sufficient page space
        this.verificarEspacoPagina(doc, 80);
        // ========== Section Header ==========
        doc
            .font('Helvetica-Bold')
            .fontSize(14)
            .fillColor('#1F2937') // Primary blue
            .text('Análise de Rastreabilidade — Pesquisa em fornecedores', margin, doc.y);
        doc
            .strokeColor('#E5E7EB') // Light gray
            .lineWidth(0.5)
            .moveTo(margin, doc.y + 8)
            .lineTo(margin + contentWidth, doc.y + 8)
            .stroke();
        doc.y += 15;
        // Handle empty analysis case
        const analiseWeb = Array.isArray(data.analiseWeb) ? data.analiseWeb : data.analiseWeb ? [data.analiseWeb] : [];
        if (analiseWeb.length === 0) {
            doc
                .font('Helvetica')
                .fontSize(10)
                .fillColor('#6B7280') // Secondary gray
                .text('Nenhum relatório de busca web disponível para esta cotação.', margin, doc.y);
            doc
                .strokeColor('#E5E7EB') // Light gray
                .lineWidth(0.5)
                .moveTo(margin, doc.y + 6)
                .lineTo(margin + contentWidth, doc.y + 6)
                .stroke();
            doc.y += 20;
            return;
        }
        // Helper: format price for Angola standard (thousands with '.' and decimals with ',')
        const formatPrecoAOA = (valor) => {
            try {
                if (valor === null || typeof valor === 'undefined')
                    return '';
                let s = String(valor).trim();
                // Remove currency labels and spaces (e.g., 'AOA', 'Kz')
                s = s.replace(/AOA|KZ|KZs|\s+/gi, ' ').trim();
                // Keep only digits, dots, and commas
                s = s.replace(/[^\d.,-]/g, '');
                // Normalize: remove thousand dots before 3-digit groups, convert comma to decimal point
                s = s.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
                const n = parseFloat(s);
                if (isNaN(n))
                    return String(valor);
                // Format with Portuguese locale (dot thousands, comma decimals)
                return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
            }
            catch {
                return String(valor);
            }
        };
        // Process each web analysis item
        analiseWeb.forEach((relatorioWeb, index) => {
            // Start new page for subsequent items
            if (index > 0) {
                doc.addPage();
            }
            const webY = doc.y;
            // ========== Analysis Header ==========
            // Analysis Metadata
            const timestamp = relatorioWeb.timestamp || Date.now();
            const produtosAnalisados = Array.isArray(relatorioWeb.top_ranking) ? relatorioWeb.top_ranking.length : 0;
            const statusAnalise = relatorioWeb.status;
            const produtosSelecionados = statusAnalise === 'produto_adicionado' || relatorioWeb.escolha_principal ? 1 : 0;
            doc
                .font('Helvetica')
                .fontSize(8)
                .fillColor('#6B7280') // Secondary gray
                .text(`Data: ${new Date(timestamp).toLocaleDateString('pt-BR')} | Analisados: ${produtosAnalisados} | Selecionados: ${produtosSelecionados}`, margin + 10, webY + 15);
            // Status Badge
            if (statusAnalise) {
                const statusX = margin + contentWidth - 100;
                const statusColors = {
                    produto_adicionado: '#D1FAE5', // Light green
                    rejeitado_por_llm: '#FEE2E2', // Light red
                    sem_produtos_encontrados: '#FEF3C7', // Light yellow
                    produto_sem_id: '#FFEDD5', // Light orange
                    produto_duplicado: '#DBEAFE', // Light blue
                    erro_llm: '#E0F2FE', // Light cyan
                };
                const textColors = {
                    produto_adicionado: '#059669', // Success green
                    rejeitado_por_llm: '#DC2626', // Error red
                    sem_produtos_encontrados: '#D97706', // Warning yellow
                    produto_sem_id: '#EA580C', // Orange
                    produto_duplicado: '#1E40AF', // Blue
                    erro_llm: '#0EA5E9', // Cyan
                };
                const badgeColor = statusColors[statusAnalise] || '#E5E7EB';
                const textColor = textColors[statusAnalise] || '#6B7280';
                doc
                    .fillColor(badgeColor)
                    .roundedRect(statusX, webY + 5, 90, 20, 3)
                    .fill()
                    .font('Helvetica-Bold')
                    .fontSize(8)
                    .fillColor(textColor)
                    .text(`STATUS: ${statusAnalise.toUpperCase()}`, statusX, webY + 9, { width: 90, align: 'center' });
            }
            doc.y = webY + 35;
            doc
                .strokeColor('#E5E7EB') // Light gray
                .lineWidth(0.5)
                .moveTo(margin, doc.y)
                .lineTo(margin + contentWidth, doc.y)
                .stroke();
            doc.y += 10;
            // ========== Traceability Summary ==========
            const resumoY = doc.y;
            // Declare criteriosFonte once for both summary and criteria sections
            const criteriosFonte = relatorioWeb.criterios_avaliacao || relatorioWeb.criterios_aplicados;
            const criteriosLabels = criteriosFonte
                ? [
                    criteriosFonte.correspondencia_tipo ? 'Correspondência de Tipo' : undefined,
                    criteriosFonte.especificacoes ? 'Especificações' : undefined,
                    criteriosFonte.custo_beneficio ? 'Custo-Benefício' : undefined,
                    criteriosFonte.disponibilidade ? 'Disponibilidade' : undefined,
                    criteriosFonte.confiabilidade ? 'Confiabilidade da Fonte' : undefined,
                    criteriosFonte.reputacao_vendedor ? 'Reputação do Vendedor' : undefined,
                ].filter(Boolean).join(', ')
                : '—';
            const decisaoResumo = relatorioWeb.escolha_principal ? String(relatorioWeb.escolha_principal) : 'Não encontrada';
            const evidenciasResumo = Array.isArray(relatorioWeb.top_ranking) ? `${relatorioWeb.top_ranking.length} fonte(s) analisada(s)` : '0 fonte(s) analisada(s)';
            doc
                .font('Helvetica-Bold')
                .fontSize(10)
                .fillColor('#4B5563') // Muted gray
                .text('Resumo de Rastreabilidade', margin + 10, resumoY);
            doc
                .font('Helvetica')
                .fontSize(8)
                .fillColor('#1F2937') // Dark gray
                .text('Decisão:', margin + 10, resumoY + 15)
                .text(decisaoResumo, margin + 60, resumoY + 15, { width: contentWidth - 70, lineGap: 2 });
            doc
                .text('Critérios:', margin + 10, resumoY + 35)
                .text(criteriosLabels, margin + 60, resumoY + 35, { width: contentWidth - 70, lineGap: 2 });
            doc
                .text('Evidências:', margin + 10, resumoY + 55)
                .text(`${evidenciasResumo} • ${new Date(timestamp).toLocaleString('pt-BR')}`, margin + 60, resumoY + 55, { width: contentWidth - 70, lineGap: 2 });
            doc.y = resumoY + 75;
            // ========== Main Choice Justification ==========
            if (relatorioWeb.escolha_principal && relatorioWeb.justificativa_escolha) {
                this.verificarEspacoPagina(doc, 80);
                const justY = doc.y;
                const justificativaText = String(relatorioWeb.justificativa_escolha);
                doc.font('Helvetica').fontSize(8);
                const justificativaHeight = doc.heightOfString(justificativaText, { width: contentWidth - 20, lineGap: 2 });
                const totalJustHeight = justificativaHeight + 30;
                doc
                    .font('Helvetica-Bold')
                    .fontSize(9)
                    .fillColor('#003087') // Primary blue
                    .text('Justificativa da Escolha', margin + 10, justY);
                doc
                    .font('Helvetica')
                    .fontSize(8)
                    .fillColor('#1F2937') // Dark gray
                    .text(justificativaText, margin + 10, justY + 15, { width: contentWidth - 20, lineGap: 2 });
                doc.y = justY + totalJustHeight + 10;
            }
            // ========== No Products Case ==========
            if ((!relatorioWeb.top_ranking || relatorioWeb.top_ranking.length === 0) && statusAnalise === 'sem_produtos_encontrados') {
                this.verificarEspacoPagina(doc, 40);
                const emptyY = doc.y;
                doc
                    .font('Helvetica-Bold')
                    .fontSize(10)
                    .fillColor('#1F2937') // Dark gray
                    .text('Sem Produtos Encontrados', margin + 10, emptyY)
                    .font('Helvetica')
                    .fontSize(8)
                    .fillColor('#6B7280') // Secondary gray
                    .text('A busca web não retornou produtos para esta consulta.', margin + 10, emptyY + 15);
                doc.y = emptyY + 35;
            }
            // ========== Ranking of Results ==========
            if (relatorioWeb.top_ranking && Array.isArray(relatorioWeb.top_ranking) && relatorioWeb.top_ranking.length > 0) {
                this.verificarEspacoPagina(doc, 40);
                doc
                    .font('Helvetica-Bold')
                    .fontSize(10)
                    .fillColor('#4B5563') // Muted gray
                    .text(`Alternativas Avaliadas`, margin + 10, doc.y);
                doc
                    .strokeColor('#E5E7EB') // Light gray
                    .lineWidth(0.5)
                    .moveTo(margin, doc.y + 6)
                    .lineTo(margin + contentWidth, doc.y + 6)
                    .stroke();
                doc.y += 15;
                const escolhaTexto = (relatorioWeb.escolha_principal || '').toString().toLowerCase();
                relatorioWeb.top_ranking.forEach((ranking, rankIndex) => {
                    let itemHeight = 30;
                    doc.font('Helvetica-Bold').fontSize(10);
                    const nomeHeight = doc.heightOfString(String(ranking.nome || 'Produto sem nome'), { width: contentWidth - 160, lineGap: 2 });
                    itemHeight += Math.max(nomeHeight, 15) + 5;
                    if (ranking.justificativa) {
                        doc.font('Helvetica').fontSize(8);
                        const justHeight = doc.heightOfString(String(ranking.justificativa), { width: contentWidth - 160, lineGap: 2 });
                        itemHeight += justHeight + 10;
                    }
                    if (ranking.url)
                        itemHeight += 15;
                    const hasFortes = ranking.pontos_fortes && Array.isArray(ranking.pontos_fortes) && ranking.pontos_fortes.length > 0;
                    const hasFracos = ranking.pontos_fracos && Array.isArray(ranking.pontos_fracos) && ranking.pontos_fracos.length > 0;
                    if (hasFortes || hasFracos)
                        itemHeight += 30;
                    this.verificarEspacoPagina(doc, itemHeight);
                    const rankY = doc.y;
                    const isEscolha = escolhaTexto && ranking?.nome && escolhaTexto.includes(ranking.nome.toLowerCase());
                    // Rank Indicator
                    doc
                        .font('Helvetica')
                        .fontSize(9)
                        .fillColor('#6B7280') // Secondary gray
                        .text(`${rankIndex + 1}`, margin + 10, rankY + 8);
                    // Product Name
                    const nomeText = String(ranking.nome || 'Produto sem nome');
                    doc
                        .font('Helvetica-Bold')
                        .fontSize(10)
                        .fillColor('#1F2937') // Dark gray
                        .text(nomeText, margin + 30, rankY + 8, { width: contentWidth - 160, lineGap: 2 });
                    const nomeTextHeight = doc.heightOfString(nomeText, { width: contentWidth - 160, lineGap: 2 });
                    let currentY = rankY + 8 + nomeTextHeight + 5;
                    // Choice Badge
                    if (isEscolha) {
                        const badgeWidth = 100;
                        const badgeX = margin + contentWidth - badgeWidth - 10;
                        doc
                            .fillColor('#D1FAE5') // Light green
                            .roundedRect(badgeX, rankY + 5, badgeWidth, 20, 3)
                            .fill()
                            .font('Helvetica-Bold')
                            .fontSize(8)
                            .fillColor('#059669') // Success green
                            .text('ESCOLHA PRINCIPAL', badgeX, rankY + 9, { width: badgeWidth, align: 'center' });
                    }
                    // Price
                    if (ranking.preco) {
                        const precoFmt = formatPrecoAOA(ranking.preco);
                        doc
                            .font('Helvetica-Bold')
                            .fontSize(9)
                            .fillColor('#003087') // Primary blue
                            .text(`AOA$ ${precoFmt}`, margin + contentWidth - 130, rankY + (isEscolha ? 30 : 15), { width: 120, align: 'right' });
                    }
                    // URL
                    if (ranking.url) {
                        const urlText = String(ranking.url);
                        doc
                            .font('Helvetica-Bold')
                            .fontSize(7)
                            .fillColor('#1F2937') // Dark gray
                            .text('Link: ', margin + 30, currentY, { continued: true })
                            .font('Helvetica')
                            .fillColor('#2563EB') // Link blue
                            .text(urlText, { width: contentWidth - 160, lineGap: 2 });
                        currentY += 15;
                    }
                    // Justification
                    if (ranking.justificativa) {
                        doc
                            .font('Helvetica')
                            .fontSize(8)
                            .fillColor('#6B7280') // Secondary gray
                            .text(String(ranking.justificativa), margin + 30, currentY, { width: contentWidth - 160, lineGap: 2 });
                        const justHeight = doc.heightOfString(String(ranking.justificativa), { width: contentWidth - 160, lineGap: 2 });
                        currentY += justHeight + 10;
                    }
                    // Strengths and Weaknesses
                    if (hasFortes || hasFracos) {
                        if (hasFortes) {
                            doc
                                .font('Helvetica-Bold')
                                .fontSize(7)
                                .fillColor('#1F2937') // Dark gray
                                .text('Pontos Fortes: ', margin + 30, currentY);
                            doc
                                .font('Helvetica')
                                .fontSize(7)
                                .fillColor('#059669') // Success green
                                .text(ranking.pontos_fortes.slice(0, 2).join(', '), margin + 80, currentY, { width: (contentWidth - 160) / 2, lineGap: 1 });
                        }
                        if (hasFracos) {
                            const fracosY = hasFortes ? currentY + 15 : currentY;
                            doc
                                .font('Helvetica-Bold')
                                .fontSize(7)
                                .fillColor('#1F2937') // Dark gray
                                .text('Pontos Fracos: ', margin + 30, fracosY);
                            doc
                                .font('Helvetica')
                                .fontSize(7)
                                .fillColor('#DC2626') // Error red
                                .text(ranking.pontos_fracos.slice(0, 2).join(', '), margin + 80, fracosY, { width: (contentWidth - 160) / 2, lineGap: 1 });
                            currentY = fracosY + 15;
                        }
                        else {
                            currentY += 15;
                        }
                    }
                    doc.y = rankY + itemHeight + 10;
                });
            }
            // ========== Evaluation Criteria ==========
            if (criteriosFonte) {
                this.verificarEspacoPagina(doc, 40);
                doc
                    .font('Helvetica-Bold')
                    .fontSize(10)
                    .fillColor('#4B5563') // Muted gray
                    .text('Critérios Aplicados', margin + 10, doc.y);
                doc
                    .strokeColor('#E5E7EB') // Light gray
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
                    if (criteriosFonte[criterio.key]) {
                        this.verificarEspacoPagina(doc, 50);
                        const criterioY = doc.y;
                        const criterioText = String(criteriosFonte[criterio.key]);
                        doc.font('Helvetica').fontSize(8);
                        const textHeight = doc.heightOfString(criterioText, { width: contentWidth - 20, lineGap: 2 });
                        doc
                            .font('Helvetica-Bold')
                            .fontSize(9)
                            .fillColor('#1F2937') // Dark gray
                            .text(`• ${criterio.label}`, margin + 10, criterioY);
                        doc
                            .font('Helvetica')
                            .fontSize(8)
                            .fillColor('#4B5563') // Muted gray
                            .text(criterioText, margin + 10, criterioY + 15, { width: contentWidth - 20, lineGap: 2 });
                        doc.y = criterioY + textHeight + 25;
                    }
                });
            }
            // ========== Observations ==========
            const observacoes = relatorioWeb.observacoes;
            if (observacoes) {
                this.verificarEspacoPagina(doc, 50);
                const obsY = doc.y;
                const obsText = String(observacoes);
                doc.font('Helvetica').fontSize(8);
                const obsHeight = doc.heightOfString(obsText, { width: contentWidth - 20, lineGap: 2 });
                doc
                    .font('Helvetica-Bold')
                    .fontSize(9)
                    .fillColor('#4B5563') // Muted gray
                    .text('Observações', margin + 10, obsY);
                doc
                    .font('Helvetica')
                    .fontSize(8)
                    .fillColor('#1F2937') // Dark gray
                    .text(obsText, margin + 10, obsY + 15, { width: contentWidth - 20, lineGap: 2 });
                doc.y = obsY + obsHeight + 25;
            }
            // ========== Error Handling ==========
            const erro = relatorioWeb.erro;
            if (erro) {
                this.verificarEspacoPagina(doc, 50);
                const erroY = doc.y;
                const erroText = String(erro);
                doc.font('Helvetica').fontSize(8);
                const erroHeight = doc.heightOfString(erroText, { width: contentWidth - 20, lineGap: 2 });
                doc
                    .font('Helvetica-Bold')
                    .fontSize(9)
                    .fillColor('#DC2626') // Error red
                    .text('Erro na Análise Web', margin + 10, erroY);
                doc
                    .font('Helvetica')
                    .fontSize(8)
                    .fillColor('#1F2937') // Dark gray
                    .text(erroText, margin + 10, erroY + 15, { width: contentWidth - 20, lineGap: 2 });
                doc.y = erroY + erroHeight + 25;
            }
            doc.y += 10;
        });
    }
}
exports.AnaliseWebRenderer = AnaliseWebRenderer;
//# sourceMappingURL=AnaliseWebRenderer.js.map