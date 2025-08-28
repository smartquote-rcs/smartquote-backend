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

        // Criar notificação informando que uma proposta de cotação foi criada
        try {
          const NotificationService = require('../services/NotificationService').NotificationService;
          const notificationService = new NotificationService();
          await notificationService.create({
            title: 'Proposta de Cotação Criada',
            subject: `Uma nova proposta de cotação foi gerada para a cotação #${cotacaoId}`,
            type: 'proposta_cotacao',
            url_redir: `/cotacoes/${cotacaoId}`
          });
          console.log(`🔔 Notificação criada: Proposta de cotação gerada (ID: ${cotacaoId})`);
        } catch (err) {
          console.error('Erro ao criar notificação de proposta de cotação:', err);
        }
      
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
            top: 60,
            bottom: 60,
            left: 60,
            right: 60
          },
          info: {
            Title: `Relatório de Cotação #${data.cotacaoId}`,
            Author: 'SmartQuote System',
            Subject: 'Relatório Comercial de Cotação',
            Keywords: 'cotação, relatório, comercial, proposta'
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
    const pageWidth = doc.page.width;
    const margin = doc.page.margins.left;
    const contentWidth = pageWidth - (margin * 2);
    
    // Cabeçalho com fundo colorido
    doc
      .rect(margin - 20, 20, contentWidth + 40, 120)
      .fillAndStroke('#2c3e50', '#34495e')
      .fill('#ffffff');
    
    // Logo placeholder (círculo com iniciais)
    doc
      .circle(margin + 40, 60, 25)
      .fillAndStroke('#3498db', '#2980b9')
      .fill('#ffffff')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('SQ', margin + 30, 52, { width: 20, align: 'center' });
    
    // Título principal
    doc
      .fill('#ffffff')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('RELATÓRIO DE COTAÇÃO', margin + 100, 40, { width: contentWidth - 120 });
    
    // Subtítulo
    doc
      .fontSize(14)
      .font('Helvetica')
      .text('Analise Tecnica e Proposta Comercial', margin + 100, 75, { width: contentWidth - 120 });
    
    // Informações da cotação em caixa
    doc
      .fill('#ecf0f1')
      .rect(margin, 160, contentWidth, 80)
      .fillAndStroke('#ecf0f1', '#bdc3c7');
    
    doc
      .fill('#2c3e50')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('INFORMAÇÕES DA COTAÇÃO', margin + 20, 175);
      doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Cotação ID: #${data.cotacaoId}`, margin + 20, 195)
      .text(
        `Data de Geração: ${new Date().toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`,
        margin + 20,
        210
      )
      .text(
        `Orçamento Total: AOA$ ${data.orcamentoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        -margin - 20, // joga para o lado direito
        195,
        { align: 'right' }
      )
      .text(`Total de Itens: ${data.itens.length}`, -margin - 20, 210, { align: 'right' });
    
    // Seção de solicitação com estilo aprimorado
    doc
      .fill('#34495e')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('SOLICITAÇÃO DO CLIENTE', margin, 270)
      .moveDown(0.3);
    
    // Linha decorativa
    doc
      .strokeColor('#3498db')
      .lineWidth(3)
      .moveTo(margin, 290)
      .lineTo(margin + 150, 290)
      .stroke();
    
    // Caixa para solicitação com altura dinâmica
    const solicitacaoHeight = Math.max(60, Math.min(data.solicitacao.length / 3, 120));
    doc
      .fill('#f8f9fa')
      .rect(margin, 305, contentWidth, solicitacaoHeight)
      .fillAndStroke('#f8f9fa', '#dee2e6');
    
    doc
      .fill('#2c3e50')
      .fontSize(11)
      .font('Helvetica')
      .text(data.solicitacao, margin + 15, 320, { 
        width: contentWidth - 30,
        lineGap: 3
      });
    
    doc.y = 305 + solicitacaoHeight + 20; // Posicionar dinamicamente para próximo conteúdo
  }/**
 * Adiciona seção de proposta comercial e email
 */
/**
 * Adiciona seção de proposta comercial e email
 */
private adicionarSecaoProposta(doc: PDFKit.PDFDocument, data: RelatorioData) {
  const margin = doc.page.margins.left;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - (margin * 2);
  
  // Verificar espaço inicial
  this.verificarEspacoPagina(doc, 100);
  
  // ========== CABEÇALHO DA SEÇÃO ==========
  const headerHeight = 55;
  const headerY = doc.y;
  
  // Fundo principal com gradiente simulado
  doc
    .fill('#27ae60')
    .rect(margin - 15, headerY, contentWidth + 30, headerHeight)
    .fill();
  
  // Linha de destaque superior
  doc
    .fill('#2ecc71')
    .rect(margin - 15, headerY, contentWidth + 30, 4)
    .fill();
  
  // Ícone principal
  doc
    .fill('#ffffff')
    .circle(margin + 30, headerY + 27, 18)
    .fill()
    .fill('#27ae60')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('$', margin + 25, headerY + 19);
  
  // Título principal
  doc
    .fill('#ffffff')
    .fontSize(19)
    .font('Helvetica-Bold')
    .text('PROPOSTA COMERCIAL', margin + 60, headerY + 12)
    .fontSize(12)
    .font('Helvetica')
    .text('E-mail de Resposta Automatizado', margin + 60, headerY + 35);
  
  doc.y = headerY + headerHeight + 25;
  
  // ========== CARD RESUMO EXECUTIVO ==========
  this.verificarEspacoPagina(doc, 120);
  
  const resumoY = doc.y;
  const resumoHeight = 110;
  
  // Fundo do card com sombra simulada
  doc
    .fill('#f8fffe')
    .rect(margin + 3, resumoY + 3, contentWidth - 6, resumoHeight - 6)
    .fill();
  
  // Card principal
  doc
    .fill('#ffffff')
    .rect(margin, resumoY, contentWidth, resumoHeight)
    .fillAndStroke('#ffffff', '#d5e8d4');
  
  // Borda lateral verde
  doc
    .fill('#27ae60')
    .rect(margin, resumoY, 6, resumoHeight)
    .fill();
  
  // Header do card
  const cardHeaderY = resumoY + 15;
  
  // Badge do resumo
  doc
    .fill('#e8f5e8')
    .roundedRect(margin + 25, cardHeaderY - 3, 140, 28, 14)
    .fill()
    .fill('#27ae60')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('RESUMO EXECUTIVO', margin + 35, cardHeaderY + 5);
  
  // Grid de informações
  const infoY = cardHeaderY + 40;
  const colWidth = (contentWidth - 60) / 3;
  
  // Dados da cotação
  const totalItens = data.itens.length;
  const orcamento = data.orcamentoGeral || 0;
  const status = totalItens > 0 ? 'COMPLETA' : 'PENDENTE';
  const statusColor = totalItens > 0 ? '#27ae60' : '#e74c3c';
  
  // Coluna 1 - Total de Itens
  doc
    .fill('#7f8c8d')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('TOTAL DE ITENS', margin + 25, infoY);
  
  doc
    .fill('#2c3e50')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(`${totalItens}`, margin + 25, infoY + 12)
    .fontSize(9)
    .font('Helvetica')
    .text('produtos', margin + 25, infoY + 32);
  
  // Coluna 2 - Orçamento
  doc
    .fill('#7f8c8d')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('ORÇAMENTO GERAL', margin + 25 + colWidth, infoY);
  
  doc
    .fill('#27ae60')
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
  doc
    .fill('#7f8c8d')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('STATUS', margin + 25 + (colWidth * 2), infoY);
  
  // Badge de status
  doc
    .fill(statusColor === '#27ae60' ? '#e8f5e8' : '#ffeaea')
    .roundedRect(margin + 25 + (colWidth * 2), infoY + 10, 70, 20, 10)
    .fill()
    .fill(statusColor)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(status, margin + 35 + (colWidth * 2), infoY + 16);
  
  doc.y = resumoY + resumoHeight + 25;
  
  // ========== LISTA DE ITENS ==========
  if (data.itens.length > 0) {
    doc.addPage();
    // Header da seção de itens
    const itemsHeaderY = doc.y;
    
    doc
      .fill('#34495e')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('ITENS INCLUÍDOS NA PROPOSTA', margin, itemsHeaderY);
    
    // Linha decorativa moderna
    doc
      .fill('#3498db')
      .rect(margin, itemsHeaderY + 25, 180, 2)
      .fill();
    
    doc.y = itemsHeaderY + 40;
    
    // Processar cada item
    data.itens.forEach((item, index) => {
      const preco = item.preco || 0;
      const total = preco * item.quantidade;
      
      // ========== CÁLCULO DINÂMICO DA ALTURA ==========
      let itemHeight = 30; // padding superior
      
      // Altura do header (incluindo nome do produto que pode ser multilinha)
      doc.fontSize(13).font('Helvetica-Bold');
      const nomeHeight = doc.heightOfString(item.nome, { 
        width: contentWidth - 280,
        lineGap: 2
      });
      itemHeight += Math.max(nomeHeight, 25) + 10; // mínimo 25px para o header
      
      // Altura da descrição
      doc.fontSize(10).font('Helvetica');
      const descricao = item.descricao || 'Descrição não informada';
      const descHeight = doc.heightOfString(descricao, { 
        width: contentWidth - 40, 
        lineGap: 3 
      });
      itemHeight += descHeight + 25; // altura + espaçamento
      
      // Altura dos dados técnicos
      itemHeight += 45;
      
      // Altura da análise IA (se existir)
      if (item.llm_relatorio?.escolha_principal) {
        doc.fontSize(9).font('Helvetica');
        const analiseHeight = doc.heightOfString(
          item.llm_relatorio.escolha_principal, 
          { width: contentWidth - 60, lineGap: 2 }
        );
        itemHeight += analiseHeight + 40; // altura do texto + header + padding
      }
      
      itemHeight += 25; // padding inferior
      
      // Verificar se cabe na página
      this.verificarEspacoPagina(doc, itemHeight);
      
      const itemY = doc.y;
      
      // ========== DESENHO DO CARD DO ITEM ==========
      // Sombra simulada
      doc
        .fill('#f5f5f5')
        .rect(margin + 2, itemY + 2, contentWidth - 4, itemHeight - 4)
        .fill();
      
      // Card principal
      doc
        .fill('#ffffff')
        .rect(margin, itemY, contentWidth, itemHeight)
        .fillAndStroke('#ffffff', '#e1e8ed');
      
      // Borda lateral colorida por posição
      const borderColors = ['#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
      const borderColor = borderColors[index % borderColors.length];
      
      doc
        .fill(borderColor)
        .rect(margin, itemY, 5, itemHeight)
        .fill();
      
      // ========== HEADER DO ITEM ==========
      const itemHeaderY = itemY + 20;
      
      // Número do item em badge
      doc
        .fill(borderColor)
        .roundedRect(margin + 20, itemHeaderY - 5, 32, 26, 13)
        .fill()
        .fill('#ffffff')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`${index + 1}`, margin + 31, itemHeaderY + 3);
      
      // Nome do produto (usar a altura já calculada)
      doc
        .fill('#1a1a1a')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(item.nome, margin + 65, itemHeaderY, { 
          width: contentWidth - 280,
          lineGap: 2 // Permitir múltiplas linhas sem truncar
        });
      
      // Preço total em destaque (ajustar posição baseada na altura do nome para centralizar verticalmente)
      const headerMinHeight = Math.max(nomeHeight, 25);
      const precoY = itemHeaderY + (headerMinHeight - 26) / 2; // Centralizar a caixa de preço verticalmente no header
      const precoBoxX = margin + contentWidth - 130;
      doc
        .fill('#e8f5e8')
        .roundedRect(precoBoxX, precoY, 120, 26, 13)
        .fill()
        .fill('#27ae60')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(
          `${total.toLocaleString('pt-AO', { 
            style: 'currency', 
            currency: 'AOA' 
          })}`,
          precoBoxX + 5,
          precoY + 6,
          { width: 110, align: 'center' }
        );
      
      // ========== DESCRIÇÃO ==========
      const descY = itemHeaderY + headerMinHeight + 15;
      
      doc
        .fill('#666666')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('DESCRIÇÃO', margin + 20, descY);
      
      doc
        .fill('#333333')
        .fontSize(10)
        .font('Helvetica')
        .text(descricao, margin + 20, descY + 12, { 
          width: contentWidth - 40, 
          lineGap: 3,
          continued: false // Não truncar o texto
        });
      
      // ========== DADOS TÉCNICOS EM GRID ==========
      const techY = descY + descHeight + 25;
      
      // Fundo sutil para a área técnica
      doc
        .fill('#f8f9fa')
        .rect(margin + 15, techY - 5, contentWidth - 30, 35)
        .fill();
      
      // Grid de informações com colunas dinâmicas
      const techColWidth = (contentWidth - 40) / 4;
      const techData = [
        { label: 'PREÇO UNIT.', value: preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }), x: margin + 20 },
        { label: 'QUANTIDADE', value: `${item.quantidade} un.`, x: margin + 20 + techColWidth },
        { label: 'ORIGEM', value: item.origem.toUpperCase(), x: margin + 20 + (techColWidth * 2) },
        { label: 'SUBTOTAL', value: total.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }), x: margin + 20 + (techColWidth * 3) }
      ];
      
      techData.forEach(tech => {
        doc
          .fill('#7f8c8d')
          .fontSize(7)
          .font('Helvetica-Bold')
          .text(tech.label, tech.x, techY + 2)
          .fill('#2c3e50')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(tech.value, tech.x, techY + 15);
      });
      
      // ========== ANÁLISE IA ==========
      if (item.llm_relatorio?.escolha_principal) {
        const analiseY = techY + 50;
        
        // Fundo da análise IA
        doc
          .fill('#f8f4ff')
          .roundedRect(margin + 15, analiseY - 8, contentWidth - 30, 30, 10)
          .fill();
        
        // Badge IA
        doc
          .fill('#8e44ad')
          .circle(margin + 35, analiseY + 7, 10)
          .fill()
          .fill('#ffffff')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('AI', margin + 31, analiseY + 3);
        
        // Label da análise
        doc
          .fill('#8e44ad')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('ANÁLISE INTELIGENTE', margin + 55, analiseY + 3);
        
        // Conteúdo da análise
        doc
          .fill('#5d4e75')
          .fontSize(9)
          .font('Helvetica')
          .text(
            item.llm_relatorio.escolha_principal,
            margin + 25,
            analiseY + 25,
            { width: contentWidth - 60, lineGap: 2 }
          );
      }
      
      // Atualizar posição Y
      doc.y = itemY + itemHeight + 20;
    });
  }
  
  // ========== TEMPLATE DE EMAIL COM DESIGN CONTÍNUO ==========
  this.adicionarTemplateEmailComDesignContinuo(doc, data, margin, contentWidth);
}

  /**
   * Adiciona template de email com design que continua através das páginas
   */
  private adicionarTemplateEmailComDesignContinuo(
    doc: PDFKit.PDFDocument, 
    data: RelatorioData, 
    margin: number, 
    contentWidth: number
  ) {
    const emailTemplate = this.gerarTemplateEmail(data);
    const emailHeaderHeight = 45;
    const padding = 20;
    
    // Dividir o texto em linhas para controle manual de quebra
    const lines = emailTemplate.split('\n');
    let isFirstPage = true;
    
    // Função para desenhar header do email
    const drawEmailHeader = (y: number, isContinuation = false) => {
      const headerY = y;
      
      // Fundo do header
      doc
        .fill('#e67e22')
        .rect(margin - 15, headerY, contentWidth + 30, emailHeaderHeight)
        .fill();
      
      // Linha de destaque superior
      doc
        .fill('#f39c12')
        .rect(margin - 15, headerY, contentWidth + 30, 3)
        .fill();
      
      // Ícone do email
      doc
        .fill('#ffffff')
        .circle(margin + 30, headerY + 22, 16)
        .fill()
        .fill('#e67e22')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('@', margin + 25, headerY + 15);
      
      // Título do email
      const title = isContinuation ? 'TEMPLATE DE E-MAIL RESPOSTA (CONT.)' : 'TEMPLATE DE E-MAIL RESPOSTA';
      doc
        .fill('#ffffff')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(title, margin + 60, headerY + 18);
      
      return headerY + emailHeaderHeight + 15;
    };
    
    // Função para desenhar box do email com bordas
    const drawEmailBox = (startY: number, height: number) => {
      // Sombra
      doc
        .fill('#fff8e7')
        .rect(margin + 2, startY + 2, contentWidth - 4, height - 4)
        .fill();
      
      // Box principal
      doc
        .fill('#fffbf0')
        .rect(margin, startY, contentWidth, height)
        .fillAndStroke('#fffbf0', '#f39c12');
      
      // Borda lateral decorativa
      doc
        .fill('#e67e22')
        .rect(margin, startY, 5, height)
        .fill();
    };
    
    // Verificar espaço inicial
    this.verificarEspacoPagina(doc, emailHeaderHeight + 100);
    
    // Desenhar header inicial
    let currentY = drawEmailHeader(doc.y, false);
    let boxStartY = currentY;
    let textY = currentY + padding;
    
    // Desenhar box de fundo primeiro (estimativa inicial)
    const estimatedHeight = Math.min(600, lines.length * 15 + padding * 2);
    drawEmailBox(boxStartY, estimatedHeight);
    
    // Desenhar texto linha por linha
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] || '';
      
      if (line.trim() === '') {
        textY += 10; // Espaço para linhas vazias
        continue;
      }
      
      // Verificar se precisa quebrar página
      const availableSpace = doc.page.height - textY - doc.page.margins.bottom - 50;
      
      if (availableSpace < 30 && i > 0) {
        // Quebrar página
        doc.addPage();
        
        // Desenhar header de continuação
        currentY = drawEmailHeader(doc.page.margins.top, true);
        boxStartY = currentY;
        textY = currentY + padding;
        
        // Desenhar nova box para a página
        const remainingLines = lines.length - i;
        const newBoxHeight = Math.min(650, remainingLines * 20 + padding * 2);
        drawEmailBox(boxStartY, newBoxHeight);
      }
      
      // Desenhar o texto da linha
      doc
        .fill('#2c3e50')
        .fontSize(10)
        .font('Helvetica')
        .text(line, margin + 20, textY, {
          width: contentWidth - 40,
          lineGap: 3,
          continued: false
        });
      
      // Calcular altura real da linha e atualizar posição
      const lineHeight = doc.heightOfString(line, {
        width: contentWidth - 40,
        lineGap: 3
      });
      textY += lineHeight + 3;
    }
    
    // Atualizar posição final
    doc.y = textY + 20;
    
    // Linha final decorativa
    doc
      .fill('#ecf0f1')
      .rect(margin, doc.y - 10, contentWidth, 2)
      .fill();
  }

  /**
   * Verifica se há espaço suficiente na página atual, senão adiciona nova página
   */
  private verificarEspacoPagina(doc: PDFKit.PDFDocument, alturaMinima: number) {
    const espacoRestante = doc.page.height - doc.y - doc.page.margins.bottom;
    if (espacoRestante < alturaMinima) {
      doc.addPage();
    }
  }
/**
 * Adiciona seção de análise LLM e top 5
 */
private adicionarSecaoAnaliseLLM(doc: PDFKit.PDFDocument, data: RelatorioData) {
  const margin = doc.page.margins.left;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - (margin * 2);
  
  // Verificar espaço para a seção
  this.verificarEspacoPagina(doc, 100);
  
  // Título da seção com gradiente visual
  doc
    .fill('#8e44ad')
    .rect(margin - 20, doc.y - 10, contentWidth + 40, 45)
    .fillAndStroke('#8e44ad', '#7d3c98');
  
  doc
    .fill('#ffffff')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('ANALISE INTELIGENTE - TOP 5 PRODUTOS', margin, doc.y + 10)
    .moveDown(1.5);

  if (data.queries.length === 0) {
    // Card de aviso quando não há análises
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
      .text('Nenhuma analise LLM disponivel para esta cotacao.', margin + 20, doc.y + 35)
      .moveDown(2);
    return;
  }

  // Para cada query, mostrar top 5 com design aprimorado
  data.queries.forEach((query, queryIndex) => {
    // Verificar espaço para cada query
    this.verificarEspacoPagina(doc, 150);
    
    // Card da query
    const queryY = doc.y;
    doc
      .fill('#f8f9fa')
      .rect(margin, queryY, contentWidth, 40)
      .fillAndStroke('#f8f9fa', '#8e44ad');
    
    // Ícone da pesquisa
    doc
      .fill('#8e44ad')
      .circle(margin + 20, queryY + 20, 12)
      .fill()
      .fill('#ffffff')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`${queryIndex + 1}`, margin + 16, queryY + 16);
    
    doc
      .fill('#2c3e50')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(`PESQUISA: ${query.queryId}`, margin + 45, queryY + 15)
      .moveDown(1.5);

    // Relatório LLM se disponível
    if (query.produtos.length > 0 && query.produtos[0]?.llm_relatorio) {
      const rel = query.produtos[0]!.llm_relatorio;
      
      // Card da escolha principal
      if (rel.escolha_principal) {
        const choiceY = doc.y;
        
        // Calcular altura dinâmica do texto da escolha
        doc.fontSize(12).font('Helvetica-Bold');
        const escolhaHeight = doc.heightOfString(rel.escolha_principal, { 
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
          .text('PRODUTO RECOMENDADO', margin + 50, choiceY + 15);
        
        // Texto da escolha principal
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(rel.escolha_principal, margin + 20, choiceY + 40, { 
            width: contentWidth - 40,
            lineGap: 2
          });
        
        doc.y = choiceY + totalChoiceHeight + 15;
        
        if (rel.justificativa_escolha) {
          // Verificar espaço mínimo antes de desenhar
          this.verificarEspacoPagina(doc, 100);
        
          const justY = doc.y;
          
          // Calcular altura dinâmica da justificativa
          doc.fontSize(10).font('Helvetica');
          const justificativaHeight = doc.heightOfString(rel.justificativa_escolha, {
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
            .text(rel.justificativa_escolha, margin + 20, justY + 35, {
              width: contentWidth - 40,
              lineGap: 2
            });
        
          // Atualizar posição Y
          doc.y = justY + totalJustHeight + 15;
        }
      }

      // Mostrar ranking completo top 5 com design aprimorado
      if (rel.top_ranking && Array.isArray(rel.top_ranking)) {
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
          .text('RANKING COMPLETO TOP 5', margin + 20, doc.y + 10)
          .moveDown(1.2);

        rel.top_ranking.forEach((ranking: any, rankIndex: number) => {
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
      if (rel.criterios_avaliacao) {
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

        const criterios = rel.criterios_avaliacao;
        const criteriosList = [
          { key: 'correspondencia_tipo', label: 'Correspondência de Tipo' },
          { key: 'especificacoes', label: 'Especificações' },
          { key: 'custo_beneficio', label: 'Custo-Benefício' },
          { key: 'disponibilidade', label: 'Disponibilidade' }
        ];

        criteriosList.forEach(criterio => {
          if (criterios[criterio.key]) {
            // Verificar espaço para cada critério
            this.verificarEspacoPagina(doc, 60);
            
            const criterioY = doc.y;
            
            // Calcular altura do texto do critério
            doc.fontSize(10).font('Helvetica');
            const textHeight = doc.heightOfString(criterios[criterio.key], {
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
              .text(criterios[criterio.key], margin + 25, criterioY + 25, { 
                width: contentWidth - 50,
                lineGap: 2
              });
            
            doc.y = criterioY + totalHeight + 10;
          }
        });
      }
    } else {
      // Fallback: mostrar produtos da query sem relatório LLM
      const fallbackY = doc.y;
      doc
        .fill('#fff3cd')
        .rect(margin, fallbackY, contentWidth, 50)
        .fillAndStroke('#fff3cd', '#ffc107');
      
      doc
        .fill('#856404')
        .fontSize(12)
        .font('Helvetica')
        .text('Relatório LLM não disponível para esta query.', margin + 20, fallbackY + 18)
        .moveDown(1.5);

      // Top 5 produtos básicos
      query.produtos.slice(0, 5).forEach((produto, posicao) => {
        this.verificarEspacoPagina(doc, 40);
        
        const prodY = doc.y;
        doc
          .fill('#ffffff')
          .rect(margin, prodY, contentWidth, 35)
          .fillAndStroke('#ffffff', '#dee2e6');
        
        doc
          .fill('#6c757d')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`${posicao + 1}º:`, margin + 15, prodY + 10)
          .fill('#212529')
          .text(produto.nome, margin + 35, prodY + 10, { width: contentWidth - 120 })
          .fill('#28a745')
          .text(`${(produto.score * 100).toFixed(1)}%`, margin + contentWidth - 70, prodY + 10);
        
        doc.y = prodY + 40;
      });
    }

    doc.moveDown(1);
  });
}

/**
 * Adiciona seção de relatórios de busca web
 */
private adicionarSecaoRelatoriosWeb(doc: PDFKit.PDFDocument, data: RelatorioData) {
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

  if (data.relatoriosWeb.length === 0) {
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
  data.relatoriosWeb.forEach((relatorioWeb, webIndex) => {
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
    doc
      .fill('#7f8c8d')
      .fontSize(9)
      .font('Helvetica')
      .text(`Data: ${new Date(relatorioWeb.timestamp).toLocaleDateString('pt-BR')} | `, margin + 45, webY + 35)
      .text(`Analisados: ${relatorioWeb.produtos_analisados} | `, margin + 180, webY + 35)
      .text(`Selecionados: ${relatorioWeb.produtos_selecionados}`, margin + 300, webY + 35);
    
    doc.y = webY + 95;

    // Relatório LLM da busca web se disponível
    if (relatorioWeb.relatorio) {
      const rel = relatorioWeb.relatorio;
      
      // Card da escolha principal
      if (rel.escolha_principal) {
        const choiceY = doc.y;
        
        // Calcular altura dinâmica do texto da escolha
        doc.fontSize(12).font('Helvetica-Bold');
        const escolhaHeight = doc.heightOfString(rel.escolha_principal, { 
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
          .text(rel.escolha_principal, margin + 20, choiceY + 40, { 
            width: contentWidth - 40,
            lineGap: 2
          });
        
        doc.y = choiceY + totalChoiceHeight + 15;
        
        if (rel.justificativa_escolha) {
          // Verificar espaço mínimo antes de desenhar
          this.verificarEspacoPagina(doc, 100);
        
          const justY = doc.y;
          
          // Calcular altura dinâmica da justificativa
          doc.fontSize(10).font('Helvetica');
          const justificativaHeight = doc.heightOfString(rel.justificativa_escolha, {
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
            .text(rel.justificativa_escolha, margin + 20, justY + 35, {
              width: contentWidth - 40,
              lineGap: 2
            });
        
          // Atualizar posição Y
          doc.y = justY + totalJustHeight + 15;
        }
      }

      // Mostrar ranking completo top 5 com design aprimorado
      if (rel.top_ranking && Array.isArray(rel.top_ranking)) {
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

        rel.top_ranking.forEach((ranking: any, rankIndex: number) => {
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
      if (rel.criterios_avaliacao) {
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

        const criterios = rel.criterios_avaliacao;
        const criteriosList = [
          { key: 'correspondencia_tipo', label: 'Correspondência de Tipo' },
          { key: 'especificacoes', label: 'Especificações' },
          { key: 'custo_beneficio', label: 'Custo-Benefício' },
          { key: 'disponibilidade', label: 'Disponibilidade' },
          { key: 'confiabilidade', label: 'Confiabilidade da Fonte' },
          { key: 'reputacao_vendedor', label: 'Reputação do Vendedor' }
        ];

        criteriosList.forEach(criterio => {
          if (criterios[criterio.key]) {
            // Verificar espaço para cada critério
            this.verificarEspacoPagina(doc, 60);
            
            const criterioY = doc.y;
            
            // Calcular altura do texto do critério
            doc.fontSize(10).font('Helvetica');
            const textHeight = doc.heightOfString(criterios[criterio.key], {
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
              .text(criterios[criterio.key], margin + 25, criterioY + 25, { 
                width: contentWidth - 50,
                lineGap: 2
              });
            
            doc.y = criterioY + totalHeight + 10;
          }
        });
      }

      // Mostrar erro se houver
      if (rel.erro) {
        this.verificarEspacoPagina(doc, 80);
        
        const erroY = doc.y;
        
        // Calcular altura do erro
        doc.fontSize(10).font('Helvetica');
        const erroHeight = doc.heightOfString(rel.erro, {
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
          .text(rel.erro, margin + 20, erroY + 35, {
            width: contentWidth - 40,
            lineGap: 2
          });
        
        doc.y = erroY + totalErroHeight + 15;
      }
    } else {
      // Fallback: informar que não há relatório LLM para esta busca web
      const fallbackY = doc.y;
      doc
        .fill('#fff3cd')
        .rect(margin, fallbackY, contentWidth, 50)
        .fillAndStroke('#fff3cd', '#ffc107');
      
      doc
        .fill('#856404')
        .fontSize(12)
        .font('Helvetica')
        .text('Relatório LLM não disponível para esta busca web.', margin + 20, fallbackY + 18)
        .moveDown(1.5);
    }

    doc.moveDown(1);
  });
}
  /**
   * Adiciona rodapé ao documento com design aprimorado
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
      const margin = doc.page.margins.left;
      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - (margin * 2);
      
      console.log(`📄 [RELATORIO] Adicionando rodapé em ${pageCount} páginas (${startPage} a ${startPage + pageCount - 1})`);
      
      for (let i = 0; i < pageCount; i++) {
        const pageIndex = startPage + i;
        doc.switchToPage(pageIndex);
        
        const footerY = doc.page.height - doc.page.margins.bottom - 30;
        
        // Linha decorativa no rodapé
        doc
          .strokeColor('#3498db')
          .lineWidth(1)
          .moveTo(margin, footerY)
          .lineTo(margin + contentWidth, footerY)
          .stroke();
        
        // Informações do rodapé
        doc
          .fill('#7f8c8d')
          .fontSize(9)
          .font('Helvetica')
          .text(
            `SmartQuote System - Relatório Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
            margin,
            footerY + 10,
            { width: contentWidth / 2 }
          )
          .text(
            `Página ${i + 1} de ${pageCount}`,
            margin + contentWidth / 2,
            footerY + 10,
            { width: contentWidth / 2, align: 'right' }
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
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const valorTotal = data.orcamentoGeral.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'AOA',
      minimumFractionDigits: 2 
    }).replace('AOA', 'AOA$');
    
    return `Prezado(a) Cliente,
  
  Esperamos que esteja bem. É com grande satisfação que apresentamos nossa proposta comercial personalizada para atender às suas necessidades de tecnologia.
  
  SOLICITACAO ORIGINAL:
  ${data.solicitacao}
  
  RESUMO EXECUTIVO DA PROPOSTA:
  --------------------------------------------
  • Total de Produtos Selecionados: ${data.itens.length} item(ns)
  • Investimento Total: ${valorTotal}
  • Prazo de Entrega: 5-10 dias úteis
  • Condições de Pagamento: À vista / Parcelado
  --------------------------------------------
  
  PRODUTOS INCLUIDOS NA PROPOSTA:
  ${data.itens.map((item, index) => {
    const preco = item.preco || 0;
    const total = preco * item.quantidade;
     return `
  ${index + 1}. ${item.nome.toUpperCase()}
      - Preço Unitário: AOA$ ${preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      - Quantidade: ${item.quantidade} unidade(s)
      - Subtotal: AOA$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }).join('\n')}
  
  CONDICOES COMERCIAIS:
  • Validade da Proposta: 30 dias corridos
  • Garantia: Conforme especificações dos fabricantes
  • Suporte Técnico: Incluso por 90 dias
  • Frete: Consultar conforme localização
  • Formas de Pagamento: À vista, cartão ou parcelado
  
  DIFERENCIAIS DA NOSSA PROPOSTA:
  • Análise técnica realizada por inteligência artificial
  • Seleção criteriosa baseada em custo-benefício
  • Produtos de fornecedores qualificados
  • Suporte especializado pós-venda
  
  Esta proposta foi elaborada utilizando nossa tecnologia de análise inteligente, considerando as melhores opções disponíveis no mercado em termos de qualidade, preço e adequação às suas necessidades específicas.
  
  Estamos à disposição para esclarecimentos adicionais, ajustes na proposta ou para prosseguirmos com a implementação do projeto.
  
  Para aprovação ou dúvidas, entre em contato:
  • Email: vendas@smartquote.ao
  • Telefone: +244 XXX XXX XXX
  • WhatsApp: +244 XXX XXX XXX
  
  Atenciosamente,
  
  --------------------------------------------
  SMARTQUOTE SYSTEM
  Equipe Comercial e Técnica
  ${dataAtual}
  --------------------------------------------
  
  *Esta proposta foi gerada automaticamente pelo sistema SmartQuote v2.0*`;
  }
  
  private gerarTemplateEmailold(data: RelatorioData): string {
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const valorTotal = data.orcamentoGeral.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'AOA',
      minimumFractionDigits: 2 
    }).replace('AOA', 'AOA$');
    
    return `Prezado(a) Cliente,

Esperamos que esteja bem. É com grande satisfação que apresentamos nossa proposta comercial personalizada para atender às suas necessidades de tecnologia.

SOLICITACAO ORIGINAL:
${data.solicitacao}

RESUMO EXECUTIVO DA PROPOSTA:
┌─────────────────────────────────────────────┐
│ Total de Produtos Selecionados: ${data.itens.length.toString().padStart(2)} itens     │
│ Investimento Total: ${valorTotal.padStart(15)}     │
│ Prazo de Entrega: 5-10 dias úteis          │
│ Condições de Pagamento: À vista/Parcelado   │
└─────────────────────────────────────────────┘

PRODUTOS INCLUIDOS NA PROPOSTA:
${data.itens.map((item, index) => {
  const preco = item.preco || 0;
  const total = preco * item.quantidade;
  const descricao = item.descricao || 'Especificações técnicas disponíveis';
  return `
${(index + 1).toString().padStart(2)}. ${item.nome.toUpperCase()}
    ├─ Descrição: ${descricao}
    ├─ Preço Unitário: AOA$ ${preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    ├─ Quantidade: ${item.quantidade} unidade(s)
    ├─ Subtotal: AOA$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    └─ Origem: ${item.origem.toUpperCase()}`;
}).join('\n')}

CONDICOES COMERCIAIS:
• Validade da Proposta: 30 dias corridos
• Garantia: Conforme especificacoes dos fabricantes
• Suporte Tecnico: Incluso por 90 dias
• Frete: Consultar conforme localizacao
• Formas de Pagamento: A vista, cartao ou parcelado

DIFERENCIAIS DA NOSSA PROPOSTA:
• Análise técnica realizada por inteligência artificial
• Seleção criteriosa baseada em custo-benefício
• Produtos de fornecedores qualificados
• Suporte especializado pós-venda

Esta proposta foi elaborada utilizando nossa tecnologia de análise inteligente, considerando as melhores opções disponíveis no mercado em termos de qualidade, preço e adequação às suas necessidades específicas.

Estamos à disposição para esclarecimentos adicionais, ajustes na proposta ou para prosseguirmos com a implementação do projeto.

Para aprovacao ou duvidas, entre em contato:
• Email: vendas@smartquote.ao
• Telefone: +244 XXX XXX XXX
• WhatsApp: +244 XXX XXX XXX

Atenciosamente,

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SMARTQUOTE SYSTEM
Equipe Comercial e Técnica
${dataAtual}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Esta proposta foi gerada automaticamente pelo sistema SmartQuote v2.0*`;
  }

}

export default new RelatorioService();
