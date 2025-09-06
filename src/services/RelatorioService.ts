import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import CotacoesService from './CotacoesService';
import PromptsService from './PromptsService';
import supabase from '../infra/supabase/connect';

// Import modular components
import { RelatorioData } from './relatorio/types';
import { PDFGenerator } from './relatorio/PDFGenerator';
import { AnaliseLocalRenderer } from './relatorio/renderers/AnaliseLocalRenderer';
import { AnaliseWebRenderer } from './relatorio/renderers/AnaliseWebRenderer';

export class RelatorioService {
  constructor() {
  }

  /**
   * Verifica se a cotação está completa e gera relatório automaticamente
   */
  public async verificarEgerarRelatorio(cotacaoId: number): Promise<string> {
    try {
      // Buscar status atual da cotação
      const { data: cotacao, error } = await supabase
        .from('cotacoes')
        .select('status, orcamento_geral, aprovacao')
        .eq('id', cotacaoId)
        .single();

      if (error || !cotacao) {
        console.error('❌ [RELATORIO] Erro ao buscar status da cotação:', error);
        return "";
      }

      // Verificar se está completa
      //&& cotacao.aprovacao == true
      if (cotacao.status === 'completa' && cotacao.orcamento_geral > 0 || true) {
        console.log(`📊 [RELATORIO] Cotação ${cotacaoId} está completa. Gerando relatório automaticamente...`);
        
        try {
          const pdfPath = await this.gerarRelatorioCompleto(cotacaoId);
          console.log(`✅ [RELATORIO] Relatório gerado automaticamente: ${pdfPath}`);
          
          // Atualizar a cotação com o caminho do relatório
          await supabase
            .from('relatorios')
            .update({ 
              relatorio_path: pdfPath
            })
            .eq('cotacao_id', cotacaoId);
          return pdfPath;
        } catch (reportError) {
          console.error('❌ [RELATORIO] Erro ao gerar relatório automaticamente:', reportError);
          return "";
        }
      }
      return "";
    } catch (error) {
      console.error('❌ [RELATORIO] Erro geral na verificação:', error);
      return "";
    }
  }
  /**
   * Gera dados de relatorio
   */
  public async gerarDadosRelatorio(cotacaoId: number): Promise<RelatorioData> {
       try {
      // Buscar dados básicos da cotação incluindo proposta_email
      const { data: cotacao, error: cotacaoError } = await supabase
        .from('cotacoes')
        .select(`
          id, 
          prompt_id, 
          orcamento_geral,
          proposta_email,
          prompt:prompts(id, texto_original, cliente)
        `)
        .eq('id', cotacaoId)
        .single();

      if (cotacaoError || !cotacao) {
        throw new Error(`Dados da cotação não encontrados: ${cotacaoError?.message}`);
      }

      // Buscar analise_web e analise_local dos itens individuais da cotação
      const { data: itensComAnaliseWeb, error: itensWebError } = await supabase
        .from('cotacoes_itens')
        .select('id, item_nome, analise_web')
        .eq('cotacao_id', cotacaoId)
        .not('analise_web', 'is', null);

      const { data: itensComAnaliseLocal, error: itensLocalError } = await supabase
        .from('cotacoes_itens')
        .select('id, item_nome, analise_local, pedido')
        .eq('cotacao_id', cotacaoId)
        .not('analise_local', 'is', null);

      // Processar dados das análises locais
      const analiseLocal: any[] = [];
      if (!itensLocalError && itensComAnaliseLocal) {
        for (const item of itensComAnaliseLocal) {
          if (item.analise_local) {
            // Se analise_local é um array
            if (Array.isArray(item.analise_local)) {
              for (const analiseItem of item.analise_local) {
                if (analiseItem) {
                  const analiseComItem = {
                    ...analiseItem,
                    id_item_cotacao: item.id,
                    item_nome: item.item_nome,
                    pedido: (item as any).pedido
                  };
                  analiseLocal.push(analiseComItem);
                }
              }
            } else {
              // Se analise_local é um objeto único
              const analiseComItem = {
                ...item.analise_local,
                id_item_cotacao: item.id,
                item_nome: item.item_nome,
                pedido: (item as any).pedido
              };
              analiseLocal.push(analiseComItem);
            }
          }
        }
      }

      // Agregar analise_web de todos os itens
      const analiseWeb: any[] = [];
      if (!itensWebError && itensComAnaliseWeb) {
        for (const item of itensComAnaliseWeb) {
          if (item.analise_web) {
            // Se analise_web é um array
            if (Array.isArray(item.analise_web)) {
              for (const analiseItem of item.analise_web) {
                if (analiseItem) {
                  const analiseComItem = {
                    ...analiseItem,
                    id_item_cotacao: item.id,
                    item_nome: item.item_nome
                  };
                  analiseWeb.push(analiseComItem);
                }
              }
            } else {
              // Se analise_web é um objeto único
              const analiseComItem = {
                ...item.analise_web,
                id_item_cotacao: item.id,
                item_nome: item.item_nome
              };
              analiseWeb.push(analiseComItem);
            }
          }
        }
      }

      // Estruturar dados para o relatório
      const data: RelatorioData = {
        cotacaoId: cotacao.id,
        promptId: cotacao.prompt_id,
        solicitacao: (cotacao as any).prompt?.texto_original || 'Solicitação não encontrada',
        orcamentoGeral: cotacao.orcamento_geral,
        cliente: (cotacao as any).prompt?.cliente || {},
        propostaEmail: (cotacao as any).proposta_email,
        analiseLocal,
        analiseWeb
      };

      console.log(`📋 [RELATORIO] Dados processados - Local: ${analiseLocal.length}, Web: ${analiseWeb.length} (de ${itensComAnaliseLocal?.length || 0} + ${itensComAnaliseWeb?.length || 0} itens)`);
      return data;
    } catch (error) {
        console.error('❌ [RELATORIO] Erro ao gerar dados do relatório:', error);
        return null as any;
    }
  }

  /**
   * Gera relatório completo em PDF para download direto (retorna buffer)
   */
  public async gerarRelatorioParaDownload(cotacaoId: number): Promise<Buffer> {
    console.log(`📊 [RELATORIO] Iniciando geração de relatório para download da cotação ${cotacaoId}`);
    try {
      const data = await this.gerarDadosRelatorio(cotacaoId);

      // Gerar PDF como buffer
      const pdfBuffer = await this.gerarPDFBuffer(data);
      
      console.log(`✅ [RELATORIO] PDF gerado com sucesso para download`);
      return pdfBuffer;

    } catch (error) {
      console.error('❌ [RELATORIO] Erro ao gerar relatório para download:', error);
      throw error;
    }
  }

  /**
   * Gera o arquivo PDF como buffer para download direto
   */
  private async gerarPDFBuffer(data: RelatorioData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Criar documento PDF
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          info: {
            Title: `Relatório de Cotação ${data.cotacaoId}`,
            Author: 'SmartQuote System',
            Subject: 'Relatório de Análise de Cotação',
            Keywords: 'cotação, análise, relatório, smartquote'
          }
        });

        // Armazenar dados em chunks para formar o buffer
        const chunks: Buffer[] = [];
        
        doc.on('data', (chunk) => {
          chunks.push(chunk);
        });

        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          console.log(`📄 [RELATORIO] PDF buffer gerado com ${pdfBuffer.length} bytes`);
          resolve(pdfBuffer);
        });

        doc.on('error', (error) => {
          console.error('❌ [RELATORIO] Erro ao gerar PDF buffer:', error);
          reject(error);
        });

        // Inicializar componentes
        const pdfGenerator = new PDFGenerator(doc);

        // Gerar conteúdo do PDF
        pdfGenerator.adicionarCabecalho(data);
        await pdfGenerator.adicionarSecaoProposta(data);
        
        // Adicionar condições comerciais
        pdfGenerator.adicionarCondicoesComerciais(data);
        
  // Adicionar template de email (aguardando pois é assíncrono)
  await pdfGenerator.adicionarTemplateEmail(data);
        
        // Adicionar análises
        const analiseLocalRenderer = new AnaliseLocalRenderer();
        const analiseWebRenderer = new AnaliseWebRenderer();
        //nova pagina
        doc.addPage();
        analiseLocalRenderer.adicionarSecaoAnaliseLocal(doc, data);
        doc.addPage();
        analiseWebRenderer.adicionarSecaoAnaliseWeb(doc, data);
        
        // Adicionar rodapé
        pdfGenerator.adicionarRodape();

        // Finalizar documento
        doc.end();

      } catch (error) {
        console.error('❌ [RELATORIO] Erro ao criar PDF buffer:', error);
        reject(error);
      }
    });
  }

  /**
   * Gera relatório completo em PDF
   */
  public async gerarRelatorioCompleto(cotacaoId: number): Promise<string> {
    console.log(`📊 [RELATORIO] Iniciando geração de relatório para cotação ${cotacaoId}`);
    try{
      const data = await this.gerarDadosRelatorio(cotacaoId);

      // Gerar PDF
      const pdfPath = await this.gerarPDF(data);
      
      console.log(`✅ [RELATORIO] PDF gerado com sucesso: ${pdfPath}`);
      return pdfPath;

    } catch (error) {
      console.error('❌ [RELATORIO] Erro ao gerar relatório completo:', error);
      throw error;
    }
  }

  /**
   * Gera o arquivo PDF usando os componentes modulares
   */
  private async gerarPDF(data: RelatorioData): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Criar documento PDF
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          info: {
            Title: `Relatório de Cotação ${data.cotacaoId}`,
            Author: 'SmartQuote System',
            Subject: 'Relatório de Análise de Cotação',
            Keywords: 'cotação, análise, relatório, smartquote'
          }
        });

        // Configurar caminho do arquivo
        const fileName = `relatorio_cotacao_${data.cotacaoId}_${Date.now()}.pdf`;
        const filePath = path.join(process.cwd(), 'uploads', 'relatorios', fileName);
        
        // Garantir que o diretório existe
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Stream para arquivo
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Inicializar componentes
        const pdfGenerator = new PDFGenerator(doc);

        // Gerar conteúdo do PDF
        pdfGenerator.adicionarCabecalho(data);
        await pdfGenerator.adicionarSecaoProposta(data);
        
        // Adicionar condições comerciais
        pdfGenerator.adicionarCondicoesComerciais(data);
        
  // Adicionar template de email (aguardando pois é assíncrono)
  await pdfGenerator.adicionarTemplateEmail(data);
        
        // Adicionar análises
        const analiseLocalRenderer = new AnaliseLocalRenderer();
        const analiseWebRenderer = new AnaliseWebRenderer();
        analiseLocalRenderer.adicionarSecaoAnaliseLocal(doc, data);
        analiseWebRenderer.adicionarSecaoAnaliseWeb(doc, data);
        
        // Adicionar rodapé
        pdfGenerator.adicionarRodape();

        // Finalizar documento
        doc.end();

        // Aguardar conclusão
        stream.on('finish', () => {
          console.log(`📄 [RELATORIO] PDF salvo em: ${filePath}`);
          resolve(filePath);
        });

        stream.on('error', (error) => {
          console.error('❌ [RELATORIO] Erro ao salvar PDF:', error);
          reject(error);
        });

      } catch (error) {
        console.error('❌ [RELATORIO] Erro ao criar PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Verifica se existe relatório para uma cotação
   */
  public async verificarExistenciaRelatorio(cotacaoId: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('relatorios')
        .select('id')
        .eq('cotacao_id', cotacaoId)
        .limit(1);

      if (error) {
        console.error('❌ [RELATORIO] Erro ao verificar existência:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('❌ [RELATORIO] Erro geral na verificação de existência:', error);
      return false;
    }
  }
}

export default new RelatorioService();
