import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import CotacoesService from './CotacoesService';
import PromptsService from './PromptsService';
import supabase from '../infra/supabase/connect';

interface RelatorioData {
  cotacaoId: number;
  promptId: number;
  solicitacao: string;
  orcamentoGeral: number;
  itens: Array<{
    nome: string;
    descricao?: string;
    preco: number;
    quantidade: number;
    origem: string;
    llm_relatorio?: any;
  }>;
  queries: Array<{
    queryId: string;
    produtos: Array<{
      nome: string;
      score: number;
      llm_relatorio?: any;
    }>;
  }>;
  relatoriosWeb: Array<{
    timestamp: string;
    produtos_analisados: number;
    produtos_selecionados: number;
    relatorio: any;
  }>;
}

export class RelatorioService {
  /**
   * Verifica se a cotação está completa e gera relatório automaticamente
   */
  public async verificarEgerarRelatorio(cotacaoId: number) {
    try {
      // Buscar status atual da cotação
      const { data: cotacao, error } = await supabase
        .from('cotacoes')
        .select('status, orcamento_geral')
        .eq('id', cotacaoId)
        .single();

      if (error || !cotacao) {
        console.error('❌ [RELATORIO] Erro ao buscar status da cotação:', error);
        return;
      }

      // Verificar se está completa
      if (cotacao.status === 'completa' && cotacao.orcamento_geral > 0) {
        console.log(`📊 [RELATORIO] Cotação ${cotacaoId} está completa. Gerando relatório automaticamente...`);
        
        try {
          const pdfPath = await this.gerarRelatorioCompleto(cotacaoId);
          console.log(`✅ [RELATORIO] Relatório gerado automaticamente: ${pdfPath}`);
          
          // Atualizar a cotação com o caminho do relatório
          await supabase
            .from('cotacoes')
            .update({ 
              relatorio_path: pdfPath,
              relatorio_gerado_em: new Date().toISOString()
            })
            .eq('id', cotacaoId);
            
          console.log(`📋 [RELATORIO] Caminho do relatório salvo na cotação ${cotacaoId}`);
          
        } catch (relatorioError) {
          console.error('❌ [RELATORIO] Erro ao gerar relatório automático:', relatorioError);
        }
      } else {
        console.log(`ℹ️ [RELATORIO] Cotação ${cotacaoId} não está pronta para relatório (status: ${cotacao.status}, orçamento: ${cotacao.orcamento_geral})`);
      }
      
    } catch (error) {
      console.error('❌ [RELATORIO] Erro ao verificar status para relatório:', error);
    }
  }




  /**
   * Gera relatório completo em PDF para uma cotação
   */
  async gerarRelatorioCompleto(cotacaoId: number): Promise<string> {
    try {
      console.log(`📊 [RELATORIO] Iniciando geração de relatório para cotação ${cotacaoId}`);
      
      // Buscar dados da cotação
      console.log(`📊 [RELATORIO] Buscando dados da cotação...`);
      const cotacao = await CotacoesService.getById(cotacaoId);
      if (!cotacao) {
        throw new Error(`Cotação ${cotacaoId} não encontrada`);
      }
      console.log(`✅ [RELATORIO] Cotação encontrada: ID ${cotacao.id}, status ${cotacao.status}`);
      
      // Buscar relatórios web se disponíveis
      const relatoriosWeb = Array.isArray(cotacao.relatorios_web) ? cotacao.relatorios_web : [];
      console.log(`📊 [RELATORIO] ${relatoriosWeb.length} relatórios de busca web encontrados`);

      // Buscar prompt
      console.log(`📊 [RELATORIO] Buscando prompt relacionado...`);
      const prompt = await PromptsService.getById(cotacao.prompt_id);
      if (!prompt) {
        throw new Error(`Prompt ${cotacao.prompt_id} não encontrado`);
      }
      console.log(`✅ [RELATORIO] Prompt encontrado: "${prompt.texto_original.substring(0, 50)}..."`);

      // Buscar itens da cotação
      console.log(`📊 [RELATORIO] Buscando itens da cotação...`);
      const { data: itens, error } = await supabase
        .from('cotacoes_itens')
        .select('*')
        .eq('cotacao_id', cotacaoId);

      if (error) {
        throw new Error(`Erro ao buscar itens: ${error.message}`);
      }
      console.log(`✅ [RELATORIO] ${itens?.length || 0} itens encontrados`);

      // Mapear corretamente os campos dos itens
      const itensMapeados = (itens || []).map(item => {
        // Debug: mostrar o item completo
        console.log(`🔍 [RELATORIO] Item bruto:`, {
          id: item.id,
          item_nome: item.item_nome,
          item_preco: item.item_preco,
          payload: item.payload,
          payload_type: typeof item.payload,
          payload_keys: item.payload ? Object.keys(item.payload) : null
        });

        // Tentar parse do payload se for string
        let parsedPayload = item.payload;
        if (typeof item.payload === 'string') {
          try {
            parsedPayload = JSON.parse(item.payload);
            console.log(`🔍 [RELATORIO] Payload parseado de string:`, parsedPayload);
          } catch (e) {
            console.log(`⚠️ [RELATORIO] Erro ao fazer parse do payload string:`, e);
            parsedPayload = null;
          }
        }

        const mapped = {
          nome: item.item_nome || item.nome || 'Nome não informado',
          descricao: item.item_descricao || item.descricao || 'Descrição não informada',
          preco: parseFloat(item.item_preco || item.preco || '0') || 0,
          quantidade: parseInt(item.quantidade || '1') || 1,
          origem: item.origem || 'local',
          llm_relatorio: parsedPayload?.llm_relatorio || null
        };

        // Debug: mostrar o item mapeado
        console.log(`🔍 [RELATORIO] Item mapeado:`, {
          nome: mapped.nome,
          preco: mapped.preco,
          quantidade: mapped.quantidade,
          llm_relatorio: mapped.llm_relatorio,
          llm_relatorio_type: typeof mapped.llm_relatorio
        });

        return mapped;
      });

      console.log(`📊 [RELATORIO] Itens mapeados:`, itensMapeados.map(i => ({ nome: i.nome, preco: i.preco, quantidade: i.quantidade })));

      // Buscar dados das queries (se houver)
      console.log(`📊 [RELATORIO] Buscando dados das queries...`);
      const queries = await this.buscarDadosQueries(cotacaoId);
      console.log(`✅ [RELATORIO] ${queries.length} queries encontradas`);

      const relatorioData: RelatorioData = {
        cotacaoId,
        promptId: cotacao.prompt_id,
        solicitacao: prompt.texto_original,
        orcamentoGeral: cotacao.orcamento_geral || 0,
        itens: itensMapeados,
        queries,
        relatoriosWeb
      };

      console.log(`📊 [RELATORIO] Dados preparados:`);
      console.log(`   - Cotação ID: ${relatorioData.cotacaoId}`);
      console.log(`   - Prompt ID: ${relatorioData.promptId}`);
      console.log(`   - Solicitação: ${relatorioData.solicitacao.substring(0, 100)}...`);
      console.log(`   - Orçamento:AOA$ ${relatorioData.orcamentoGeral}`);
      console.log(`   - Itens: ${relatorioData.itens.length}`);
      console.log(`   - Queries: ${relatorioData.queries.length}`);
      console.log(`   - Relatórios Web: ${relatorioData.relatoriosWeb.length}`);
      console.log(`📊 [RELATORIO] Iniciando geração do PDF...`);
      
      // Gerar PDF
      const pdfPath = await this.gerarPDF(relatorioData);
      console.log(`🎉 [RELATORIO] Relatório gerado com sucesso: ${pdfPath}`);
      
      return pdfPath;

    } catch (error) {
      console.error('❌ [RELATORIO] Erro ao gerar relatório:', error);
      
      // Log mais detalhado para debugging
      if (error instanceof Error) {
        console.error('❌ [RELATORIO] Stack trace:', error.stack);
      }
      
      throw error;
    }
  }

  /**
   * Busca dados das queries relacionadas à cotação
   */
  private async buscarDadosQueries(cotacaoId: number): Promise<any[]> {
    try {
      // Buscar itens locais que tenham payload com query_id
      const { data: itensLocais, error } = await supabase
        .from('cotacoes_itens')
        .select('*')
        .eq('cotacao_id', cotacaoId)
        .eq('origem', 'local')
        .not('payload', 'is', null);

      if (error || !itensLocais) {
        return [];
      }

      // Agrupar por query_id
      const queriesMap = new Map<string, any[]>();
      
      for (const item of itensLocais) {
        let payload = item.payload as any;
        
        // Tentar parse do payload se for string
        if (typeof item.payload === 'string') {
          try {
            payload = JSON.parse(item.payload);
            console.log(`🔍 [RELATORIO] Query payload parseado de string:`, payload);
          } catch (e) {
            console.log(`⚠️ [RELATORIO] Erro ao fazer parse do query payload string:`, e);
            payload = null;
          }
        }
        
        const queryId = payload?.query_id;
        
        // Debug: mostrar o payload de cada item
        console.log(`🔍 [RELATORIO] Query item payload:`, {
          item_id: item.id,
          item_nome: item.item_nome,
          payload: payload,
          query_id: queryId,
          score: payload?.score,
          llm_relatorio: payload?.llm_relatorio,
          llm_relatorio_type: typeof payload?.llm_relatorio
        });
        
        if (queryId) {
          if (!queriesMap.has(queryId)) {
            queriesMap.set(queryId, []);
          }
          
          queriesMap.get(queryId)!.push({
            nome: item.item_nome || item.nome || 'Nome não informado',
            score: payload.score || 0,
            llm_relatorio: payload.llm_relatorio
          });
        }
      }

      // Converter para array
      const queries: any[] = [];
      for (const [queryId, produtos] of queriesMap) {
        queries.push({
          queryId,
          produtos: produtos.sort((a, b) => b.score - a.score)
        });
      }

      console.log(`📊 [RELATORIO] Queries encontradas:`, queries.map(q => ({ queryId: q.queryId, produtos: q.produtos.length })));

      return queries;

    } catch (error) {
      console.error('Erro ao buscar dados das queries:', error);
      return [];
    }
  }

  /**
   * Gera o PDF com as duas seções solicitadas
   */
  private async gerarPDF(data: RelatorioData): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`📄 [RELATORIO] Iniciando geração do PDF para cotação ${data.cotacaoId}`);
        
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        const filename = `relatorio_cotacao_${data.cotacaoId}_${Date.now()}.pdf`;
        const outputPath = path.join(process.cwd(), 'temp', filename);
        
        // Criar diretório temp se não existir
        const tempDir = path.dirname(outputPath);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
          console.log(`📁 [RELATORIO] Diretório temp criado: ${tempDir}`);
        }

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        try {
          // Cabeçalho
          console.log(`📄 [RELATORIO] Adicionando cabeçalho...`);
          this.adicionarCabecalho(doc, data);
        ;
          // Seção 1: Proposta Comercial e Email
          console.log(`📄 [RELATORIO] Adicionando seção de proposta...`);
          this.adicionarSecaoProposta(doc, data);

          // Quebra de página
          console.log(`📄 [RELATORIO] Adicionando nova página...`);
          doc.addPage();

          // Seção 2: Análise LLM e Top 5
          console.log(`📄 [RELATORIO] Adicionando seção de análise LLM...`);
          this.adicionarSecaoAnaliseLLM(doc, data);

          // Seção 3: Relatórios de Busca Web (se houver)
          if (data.relatoriosWeb.length > 0) {
            console.log(`📄 [RELATORIO] Adicionando seção de relatórios web...`);
            doc.addPage();
            this.adicionarSecaoRelatoriosWeb(doc, data);
          }

          // Rodapé
          console.log(`📄 [RELATORIO] Adicionando rodapé...`);
          this.adicionarRodape(doc);

          console.log(`📄 [RELATORIO] Finalizando PDF...`);
          doc.end();

        } catch (contentError) {
          console.error('❌ [RELATORIO] Erro ao adicionar conteúdo ao PDF:', contentError);
          // Tentar finalizar o PDF mesmo com erro de conteúdo
          try {
            doc.end();
          } catch (finalizeError) {
            console.error('❌ [RELATORIO] Erro ao finalizar PDF:', finalizeError);
          }
          reject(contentError);
          return;
        }

        stream.on('finish', () => {
          console.log(`✅ [RELATORIO] PDF gerado com sucesso: ${outputPath}`);
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          console.error('❌ [RELATORIO] Erro no stream do PDF:', error);
          reject(error);
        });

      } catch (error) {
        console.error('❌ [RELATORIO] Erro geral na geração do PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Adiciona cabeçalho ao documento
   */
  private adicionarCabecalho(doc: PDFKit.PDFDocument, data: RelatorioData) {
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('RELATÓRIO DE COTAÇÃO', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(14)
      .font('Helvetica')
      .text(`Cotação ID: ${data.cotacaoId}`, { align: 'center' })
      .text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' })
      .moveDown(1);

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Solicitação:', { underline: true })
      .moveDown(0.3);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(data.solicitacao, { width: 500 })
      .moveDown(1);
  }

  /**
   * Adiciona seção de proposta comercial e email
   */
  private adicionarSecaoProposta(doc: PDFKit.PDFDocument, data: RelatorioData) {
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('PROPOSTA COMERCIAL E EMAIL DE RESPOSTA', { underline: true })
      .moveDown(1);

    // Resumo da cotação
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Resumo da Cotação:')
      .moveDown(0.5);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`• Total de itens: ${data.itens.length}`)
      .text(`• Orçamento geral:AOA$ ${data.orcamentoGeral.toFixed(2)}`)
      .text(`• Status: ${data.itens.length > 0 ? 'Completa' : 'Incompleta'}`)
      .moveDown(1);

    // Lista de itens principais
    if (data.itens.length > 0) {
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Itens Incluídos:')
        .moveDown(0.5);

      data.itens.forEach((item, index) => {
        const preco = item.preco || 0;
        const total = preco * item.quantidade;
        
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(`${index + 1}. ${item.nome}`)
          .moveDown(0.2);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`   Descrição: ${item.descricao || 'Não informada'}`)
          .text(`   Preço unitário:AOA$ ${preco.toFixed(2)}`)
          .text(`   Quantidade: ${item.quantidade}`)
          .text(`   Total:AOA$ ${total.toFixed(2)}`)
          .text(`   Origem: ${item.origem}`)
          .moveDown(0.5);

        // Se houver relatório LLM, mostrar resumo
        if (item.llm_relatorio) {
          const rel = item.llm_relatorio;
          if (rel.escolha_principal && rel.justificativa_escolha) {
            doc
              .fontSize(9)
              .font('Helvetica-Bold')
              .text(`    Análise LLM: ${rel.escolha_principal}`)
              .moveDown(0.1);
            
            doc
              .fontSize(8)
              .font('Helvetica')
              .text(`      Justificativa: ${rel.justificativa_escolha}`, { width: 400 })
              .moveDown(0.2);
          }
        }
      });
    }

    // Template de email
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Template de Email de Resposta:')
      .moveDown(0.5);

    const emailTemplate = this.gerarTemplateEmail(data);
    
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(emailTemplate, { width: 500 })
      .moveDown(1);
  }

  /**
   * Adiciona seção de análise LLM e top 5
   */
  private adicionarSecaoAnaliseLLM(doc: PDFKit.PDFDocument, data: RelatorioData) {
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('ANÁLISE LLM - TOP 5 PRODUTOS POR PESQUISA', { underline: true })
      .moveDown(1);

    if (data.queries.length === 0) {
      doc
        .fontSize(12)
        .font('Helvetica')
        .text('Nenhuma análise LLM disponível para esta cotação.')
        .moveDown(1);
      return;
    }

    // Para cada query, mostrar top 5
    data.queries.forEach((query, queryIndex) => {
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`Pesquisa ${queryIndex + 1}: ${query.queryId}`, { underline: true })
        .moveDown(0.5);

              // Relatório LLM se disponível
        if (query.produtos.length > 0 && query.produtos[0]?.llm_relatorio) {
          const rel = query.produtos[0]!.llm_relatorio;
        
        // Mostrar escolha principal
        if (rel.escolha_principal) {
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('ESCOLHA PRINCIPAL:', { underline: true })
            .moveDown(0.3);

          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(rel.escolha_principal)
            .moveDown(0.2);

          if (rel.justificativa_escolha) {
            doc
              .fontSize(11)
              .font('Helvetica-Bold')
              .text('Justificativa da Escolha:')
              .moveDown(0.2);

            doc
              .fontSize(10)
              .font('Helvetica')
              .text(rel.justificativa_escolha, { width: 450 })
              .moveDown(0.3);
          }
        }

        // Mostrar ranking completo top 5
        if (rel.top5_ranking && Array.isArray(rel.top5_ranking)) {
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('RANKING COMPLETO TOP 5:', { underline: true })
            .moveDown(0.5);

          rel.top5_ranking.forEach((ranking: any, rankIndex: number) => {
            doc
              .fontSize(12)
              .font('Helvetica-Bold')
              .text(`${ranking.posicao}º LUGAR: ${ranking.nome}`)
              .moveDown(0.2);

            doc
              .fontSize(11)
              .font('Helvetica')
              .text(`Score Estimado: ${(ranking.score_estimado * 100).toFixed(1)}%`)
              .moveDown(0.2);

            if (ranking.justificativa) {
              doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('Justificativa:')
                .moveDown(0.1);

              doc
                .fontSize(9)
                .font('Helvetica')
                .text(ranking.justificativa, { width: 430 })
                .moveDown(0.2);
            }
            if (ranking.id) {
              doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text(`ID: ${ranking.id}`)
                .moveDown(0.2);
            }

            if (ranking.pontos_fortes && Array.isArray(ranking.pontos_fortes)) {
              doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('Pontos Fortes:')
                .moveDown(0.1);

              ranking.pontos_fortes.forEach((ponto: string) => {
                doc
                  .fontSize(9)
                  .font('Helvetica')
                  .text(`• ${ponto}`, { width: 430 });
              });
              doc.moveDown(0.2);
            }

            if (ranking.pontos_fracos && Array.isArray(ranking.pontos_fracos)) {
              doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('Pontos Fracos:')
                .moveDown(0.1);

              ranking.pontos_fracos.forEach((ponto: string) => {
                doc
                  .fontSize(9)
                  .font('Helvetica')
                  .text(`• ${ponto}`, { width: 430 });
              });
              doc.moveDown(0.2);
            }
            if (ranking.preco) {
              doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('Preço: AOA$ ' + ranking.preco)
                .moveDown(0.1);
            }
            doc.moveDown(0.3);
          });
        }

        // Mostrar critérios de avaliação
        if (rel.criterios_avaliacao) {
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text(' CRITÉRIOS DE AVALIAÇÃO:', { underline: true })
            .moveDown(0.5);

          const criterios = rel.criterios_avaliacao;
          if (criterios.correspondencia_tipo) {
            doc
              .fontSize(11)
              .font('Helvetica-Bold')
              .text('• Correspondência de Tipo:')
              .moveDown(0.1);
            doc
              .fontSize(10)
              .font('Helvetica')
              .text(`  ${criterios.correspondencia_tipo}`, { width: 430 })
              .moveDown(0.2);
          }
          if (criterios.especificacoes) {
            doc
              .fontSize(11)
              .font('Helvetica-Bold')
              .text('• Especificações:')
              .moveDown(0.1);
            doc
              .fontSize(10)
              .font('Helvetica')
              .text(`  ${criterios.especificacoes}`, { width: 430 })
              .moveDown(0.2);
          }
          if (criterios.custo_beneficio) {
            doc
              .fontSize(11)
              .font('Helvetica-Bold')
              .text('• Custo-Benefício:')
              .moveDown(0.1);
            doc
              .fontSize(10)
              .font('Helvetica')
              .text(`  ${criterios.custo_beneficio}`, { width: 430 })
              .moveDown(0.2);
          }
          if (criterios.disponibilidade) {
            doc
              .fontSize(11)
              .font('Helvetica-Bold')
              .text('• Disponibilidade:')
              .moveDown(0.1);
            doc
              .fontSize(10)
              .font('Helvetica')
              .text(`  ${criterios.disponibilidade}`, { width: 430 })
              .moveDown(0.2);
          }
        }
      } else {
        // Fallback: mostrar produtos da query sem relatório LLM
        doc
          .fontSize(12)
          .font('Helvetica')
          .text('Relatório LLM não disponível para esta query.')
          .moveDown(0.5);

        // Top 5 produtos
        query.produtos.slice(0, 5).forEach((produto, posicao) => {
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(`${posicao + 1}º: ${produto.nome}`)
            .moveDown(0.2);

          doc
            .fontSize(10)
            .font('Helvetica')
            .text(`Score: ${(produto.score * 100).toFixed(1)}%`)
            .moveDown(0.3);
        });
      }

      doc.moveDown(1);
    });
  }

  /**
   * Adiciona seção de relatórios de busca web
   */
  private adicionarSecaoRelatoriosWeb(doc: PDFKit.PDFDocument, data: RelatorioData) {
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('RELATÓRIOS DE BUSCA WEB', { underline: true })
      .moveDown(1);

    if (data.relatoriosWeb.length === 0) {
      doc
        .fontSize(12)
        .font('Helvetica')
        .text('Nenhum relatório de busca web disponível para esta cotação.')
        .moveDown(1);
      return;
    }

    data.relatoriosWeb.forEach((relatorioWeb, index) => {
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`Busca Web ${index + 1}`, { underline: true })
        .moveDown(0.5);

      // Informações básicas da busca
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Data: ${new Date(relatorioWeb.timestamp).toLocaleString('pt-BR')}`)
        .text(`Produtos analisados: ${relatorioWeb.produtos_analisados}`)
        .text(`Produtos selecionados: ${relatorioWeb.produtos_selecionados}`)
        .moveDown(0.5);

      // Relatório LLM da busca web
      if (relatorioWeb.relatorio) {
        const rel = relatorioWeb.relatorio;

        // Escolha principal
        if (rel.escolha_principal) {
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('PRODUTO ESCOLHIDO:', { underline: true })
            .moveDown(0.3);

          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(rel.escolha_principal)
            .moveDown(0.2);

          if (rel.justificativa_escolha) {
            doc
              .fontSize(11)
              .font('Helvetica-Bold')
              .text('Justificativa:')
              .moveDown(0.2);

            doc
              .fontSize(10)
              .font('Helvetica')
              .text(rel.justificativa_escolha, { width: 450 })
              .moveDown(0.3);
          }
        }

        // Top 5 ranking
        if (rel.top5_ranking && Array.isArray(rel.top5_ranking)) {
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('RANKING TOP 5:', { underline: true })
            .moveDown(0.5);

          rel.top5_ranking.slice(0, 5).forEach((ranking: any) => {
            doc
              .fontSize(12)
              .font('Helvetica-Bold')
              .text(`${ranking.posicao}º LUGAR: ${ranking.nome}`)
              .moveDown(0.2);

            if (ranking.score_estimado) {
              doc
                .fontSize(11)
                .font('Helvetica')
                .text(`Score: ${(ranking.score_estimado * 100).toFixed(1)}%`)
                .moveDown(0.2);
            }

            if (ranking.preco) {
              doc
                .fontSize(11)
                .font('Helvetica')
                .text(`Preço: AOA$ ${ranking.preco}`)
                .moveDown(0.2);
            }

            if (ranking.justificativa) {
              doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Justificativa: ${ranking.justificativa}`, { width: 430 })
                .moveDown(0.2);
            }

            if (ranking.url) {
              doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text(`URL: ${ranking.url}`)
                .moveDown(0.2);
            }


            if (ranking.pontos_fortes && Array.isArray(ranking.pontos_fortes)) {
              doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('Pontos Fortes:')
                .moveDown(0.1);

              ranking.pontos_fortes.forEach((ponto: string) => {
                doc
                  .fontSize(9)
                  .font('Helvetica')
                  .text(`• ${ponto}`, { width: 430 });
              });
              doc.moveDown(0.2);
            }

            if (ranking.pontos_fracos && Array.isArray(ranking.pontos_fracos)) {
              doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('Pontos Fracos:')
                .moveDown(0.1);

              ranking.pontos_fracos.forEach((ponto: string) => {
                doc
                  .fontSize(9)
                  .font('Helvetica')
                  .text(`• ${ponto}`, { width: 430 });
              });
              doc.moveDown(0.2);
            }

            doc.moveDown(0.3);
          });
        }

        // Critérios de avaliação
        if (rel.criterios_avaliacao) {
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('CRITÉRIOS DE AVALIAÇÃO:', { underline: true })
            .moveDown(0.5);

          const criterios = rel.criterios_avaliacao;
          Object.entries(criterios).forEach(([key, value]) => {
            if (value && typeof value === 'string') {
              doc
                .fontSize(11)
                .font('Helvetica-Bold')
                .text(`• ${key.replace(/_/g, ' ').toUpperCase()}:`)
                .moveDown(0.1);
              doc
                .fontSize(10)
                .font('Helvetica')
                .text(`  ${value}`, { width: 430 })
                .moveDown(0.2);
            }
          });
        }

        // Erro se houver
        if (rel.erro) {
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('ERRO NA ANÁLISE:', { underline: true })
            .moveDown(0.3);

          doc
            .fontSize(11)
            .font('Helvetica')
            .text(rel.erro, { width: 450 })
            .moveDown(0.3);
        }
      }

      doc.moveDown(1);
    });
  }

  /**
   * Adiciona rodapé ao documento
   */
  private adicionarRodape(doc: PDFKit.PDFDocument) {
    try {
      const pageRange = doc.bufferedPageRange();
      if (!pageRange || pageRange.count === 0) {
        console.log('⚠️ [RELATORIO] Nenhuma página para adicionar rodapé');
        return;
      }
      
      const pageCount = pageRange.count;
      const startPage = pageRange.start;
      
      console.log(`📄 [RELATORIO] Adicionando rodapé em ${pageCount} páginas (${startPage} a ${startPage + pageCount - 1})`);
      
      for (let i = 0; i < pageCount; i++) {
        const pageIndex = startPage + i;
        doc.switchToPage(pageIndex);
        
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(
            `Página ${i + 1} de ${pageCount}`,
            doc.page.margins.left,
            doc.page.height - doc.page.margins.bottom - 20,
            { align: 'center' }
          );
      }
    } catch (error) {
      console.error('❌ [RELATORIO] Erro ao adicionar rodapé:', error);
      // Não falhar a geração do PDF por causa do rodapé
    }
  }

  /**
   * Gera template de email baseado nos dados da cotação
   */
  private gerarTemplateEmail(data: RelatorioData): string {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    return `Prezado Cliente,

Espero que esteja bem. Conforme solicitado, segue nossa proposta comercial para a aquisição dos produtos de T.I.

SOLICITAÇÃO:
${data.solicitacao}

RESUMO DA PROPOSTA:
• Total de itens: ${data.itens.length}
• Orçamento geral:AOA$ ${data.orcamentoGeral.toFixed(2)}
• Prazo de entrega: A combinar
• Forma de pagamento: A combinar

ITENS INCLUÍDOS:
${data.itens.map((item, index) => {
  const preco = item.preco || 0;
  const total = preco * item.quantidade;
  const descricao = item.descricao || 'Descrição não informada';
  return `${index + 1}. ${item.nome}
     Descrição: ${descricao}
     Preço unitário:AOA$ ${preco.toFixed(2)}
     Quantidade: ${item.quantidade}
     Total:AOA$ ${total.toFixed(2)}`;
}).join('\n\n')}

CONDIÇÕES COMERCIAIS:
• Validade da proposta: 30 dias
• Garantia: Conforme especificações dos fabricantes
• Suporte técnico: Incluso conforme disponibilidade

Esta proposta foi elaborada com base na análise técnica de nossos especialistas, considerando as melhores opções disponíveis no mercado em termos de custo-benefício e adequação às suas necessidades.

Aguardamos seu retorno para esclarecimentos adicionais ou para prosseguirmos com a implementação.

Atenciosamente,
Equipe de Vendas
Data: ${dataAtual}`;
  }

}

export default new RelatorioService();
