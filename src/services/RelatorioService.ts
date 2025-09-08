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
import { AnaliseCacheRenderer } from './relatorio/renderers/AnaliseCacheRenderer';
import { AnaliseExternaRenderer } from './relatorio/renderers/AnaliseExternaRenderer';

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

      // Buscar e processar analise_web_externa de todos os itens
      const { data: itensComAnaliseExterna, error: itensExternaError } = await supabase
        .from('cotacoes_itens')
        .select('id, item_nome, pedido, analise_web_externa')
        .eq('cotacao_id', cotacaoId)
        .not('analise_web_externa', 'is', null);

      const analiseExterna: any[] = [];
      if (!itensExternaError && itensComAnaliseExterna) {
        for (const item of itensComAnaliseExterna) {
          const externa = (item as any).analise_web_externa;
          if (externa) {
            if (Array.isArray(externa)) {
              for (const analiseItem of externa) {
                if (analiseItem) {
                  const analiseComItem = {
                    ...analiseItem,
                    id_item_cotacao: (item as any).id,
                    item_nome: (item as any).item_nome,
                    pedido: (item as any).pedido,
                  };
                  analiseExterna.push(analiseComItem);
                }
              }
            } else {
              const analiseComItem = {
                ...externa,
                id_item_cotacao: (item as any).id,
                item_nome: (item as any).item_nome,
                pedido: (item as any).pedido,
              };
              analiseExterna.push(analiseComItem);
            }
          }
        }
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

      // Buscar analise_cache (cache) dos itens
      const { data: itensComAnaliseCache, error: itensCacheError } = await supabase
        .from('cotacoes_itens')
        .select('id, item_nome, analise_cache, pedido')
        .eq('cotacao_id', cotacaoId)
        .not('analise_cache', 'is', null);
      
      //conta quantos produtos foram selecionados, quantos itens com status true
      const { data: itensEncontrados, error: itensEncontradosE } = await supabase
        .from('cotacoes_itens')
        .select('id')
        .eq('cotacao_id', cotacaoId)
        .is('status', true);

      const numProdutosEscolhidos = itensEncontrados ? itensEncontrados.length : 0;
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

      // Processar dados das análises em cache
      const analiseCache: any[] = [];
      if (!itensCacheError && itensComAnaliseCache) {
        for (const item of itensComAnaliseCache) {
          if ((item as any).analise_cache) {
            const cache = (item as any).analise_cache;
            if (Array.isArray(cache)) {
              for (const analiseItem of cache) {
                if (analiseItem) {
                  const analiseComItem = {
                    ...analiseItem,
                    id_item_cotacao: (item as any).id,
                    item_nome: (item as any).item_nome,
                    pedido: (item as any).pedido,
                  };
                  analiseCache.push(analiseComItem);
                }
              }
            } else {
              const analiseComItem = {
                ...cache,
                id_item_cotacao: (item as any).id,
                item_nome: (item as any).item_nome,
                pedido: (item as any).pedido,
              };
              analiseCache.push(analiseComItem);
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

      // Buscar e processar analise_web_externa de todos os itens
      const { data: itensComAnaliseExterna, error: itensExternaError } = await supabase
        .from('cotacoes_itens')
        .select('id, item_nome, analise_web_externa')
        .eq('cotacao_id', cotacaoId)
        .not('analise_web_externa', 'is', null);

      const analiseExterna: any[] = [];
      if (!itensExternaError && itensComAnaliseExterna) {
        for (const item of itensComAnaliseExterna) {
          const externa = (item as any).analise_web_externa;
          if (externa) {
            if (Array.isArray(externa)) {
              for (const analiseItem of externa) {
                if (analiseItem) {
                  const analiseComItem = {
                    ...analiseItem,
                    id_item_cotacao: (item as any).id,
                    item_nome: (item as any).item_nome,
                  };
                  analiseExterna.push(analiseComItem);
                }
              }
            } else {
              const analiseComItem = {
                ...externa,
                id_item_cotacao: (item as any).id,
                item_nome: (item as any).item_nome,
              };
              analiseExterna.push(analiseComItem);
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
        analiseCache,
        analiseLocal,
        analiseWeb,
        analiseExterna,
        numProdutosEscolhidos
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
        
        // Adicionar análises por pesquisa (query/pedido)
        const analiseLocalRenderer = new AnaliseLocalRenderer();
        const analiseCacheRenderer = new AnaliseCacheRenderer();
        const analiseWebRenderer = new AnaliseWebRenderer();
        const analiseExternaRenderer = new AnaliseExternaRenderer();

        // Agrupar por "pesquisa" usando pedido/query/item_nome
        const gruposMap = new Map<string, { titulo: string; locais: any[]; caches: any[]; webs: any[]; externas: any[] }>();

        const norm = (s: any) =>
          (typeof s === 'string' ? s : String(s || ''))
            .trim()
            .toLowerCase();

        const getQueryNome = (q: any) => {
          if (!q) return '';
          if (typeof q === 'string') return q;
          return q.nome || q.query_sugerida || '';
        };

        const makeKeyAndTitle = (item: any) => {
          const id = (item as any)?.id_item_cotacao ?? (item as any)?.id;
          const analise = (item as any)?.llm_relatorio || item;
          const pedido = (item as any)?.pedido;
          const queryStr = getQueryNome((item as any)?.query) || getQueryNome(analise?.query);
          const itemNome = (item as any)?.item_nome;
          const key = id != null ? `id:${id}` : norm(pedido || queryStr || itemNome || `item-${Math.random()}`);
          const titulo = (pedido && String(pedido).trim()) || (queryStr && String(queryStr)) || (itemNome && String(itemNome)) || (id != null ? `Item ${id}` : 'Item');
          return { key, titulo: String(titulo) };
        };

        const pushLocal = (item: any) => {
          const { key, titulo } = makeKeyAndTitle(item);
          if (!gruposMap.has(key)) gruposMap.set(key, { titulo, locais: [], caches: [], webs: [], externas: [] });
          gruposMap.get(key)!.locais.push(item);
        };

        const pushCache = (item: any) => {
          const { key, titulo } = makeKeyAndTitle(item);
          if (!gruposMap.has(key)) gruposMap.set(key, { titulo, locais: [], caches: [], webs: [], externas: [] });
          gruposMap.get(key)!.caches.push(item);
        };

        const pushWeb = (item: any) => {
          const { key, titulo } = makeKeyAndTitle(item);
          if (!gruposMap.has(key)) gruposMap.set(key, { titulo, locais: [], caches: [], webs: [], externas: [] });
          gruposMap.get(key)!.webs.push(item);
        };

        const pushExterna = (item: any) => {
          const { key, titulo } = makeKeyAndTitle(item);
          if (!gruposMap.has(key)) gruposMap.set(key, { titulo, locais: [], caches: [], webs: [], externas: [] });
          gruposMap.get(key)!.externas.push(item);
        };

        const locaisArr = Array.isArray((data as any).analiseLocal) ? (data as any).analiseLocal : ((data as any).analiseLocal ? [(data as any).analiseLocal] : []);
        const cachesArr = Array.isArray((data as any).analiseCache) ? (data as any).analiseCache : ((data as any).analiseCache ? [(data as any).analiseCache] : []);
        const websArr = Array.isArray((data as any).analiseWeb) ? (data as any).analiseWeb : ((data as any).analiseWeb ? [(data as any).analiseWeb] : []);
        const externasArr = Array.isArray((data as any).analiseExterna) ? (data as any).analiseExterna : ((data as any).analiseExterna ? [(data as any).analiseExterna] : []);

        locaisArr.forEach(pushLocal);
        cachesArr.forEach(pushCache);
        websArr.forEach(pushWeb);
        externasArr.forEach(pushExterna);

        const grupos = Array.from(gruposMap.values());

        // Renderizar cada grupo com cabeçalho da pesquisa e subseções Local/Web
        grupos.forEach((grupo) => {
          // Nova página para cada pesquisa
          doc.addPage();

          const margin = doc.page.margins.left;
          const pageWidth = doc.page.width;
          const contentWidth = pageWidth - margin * 2;

          // Cabeçalho da pesquisa
          doc
            .font('Helvetica-Bold')
            .fontSize(14)
            .fillColor('#003087')
            .text(`Pesquisa: ${grupo.titulo}`, margin, doc.y);
          doc
            .strokeColor('#E5E7EB')
            .lineWidth(0.5)
            .moveTo(margin, doc.y + 8)
            .lineTo(margin + contentWidth, doc.y + 8)
            .stroke();
          doc.y += 18;

          const grupoData: RelatorioData = {
            ...data,
            analiseLocal: grupo.locais,
            analiseCache: grupo.caches,
            analiseWeb: grupo.webs,
            analiseExterna: grupo.externas,
          } as any;

          // Sub-seção: Análise Local
          analiseLocalRenderer.adicionarSecaoAnaliseLocal(doc as any, grupoData);

          // Pequeno espaçamento/divisor entre local e cache
          const dividerY = doc.y;
          doc
            .strokeColor('#E5E7EB')
            .lineWidth(0.5)
            .moveTo(margin, dividerY)
            .lineTo(margin + contentWidth, dividerY)
            .stroke();
          doc.y += 10;

          // Sub-seção: Análise Cache
          analiseCacheRenderer.adicionarSecaoAnaliseCache(doc as any, grupoData);

          // Divisor entre cache e web
          const dividerY2 = doc.y;
          doc
            .strokeColor('#E5E7EB')
            .lineWidth(0.5)
            .moveTo(margin, dividerY2)
            .lineTo(margin + contentWidth, dividerY2)
            .stroke();
          doc.y += 10;

          // Sub-seção: Análise Web
          analiseWebRenderer.adicionarSecaoAnaliseWeb(doc as any, grupoData);

          // Divisor entre web e externa
          const dividerY3File = doc.y;
          doc
            .strokeColor('#E5E7EB')
            .lineWidth(0.5)
            .moveTo(margin, dividerY3File)
            .lineTo(margin + contentWidth, dividerY3File)
            .stroke();
          doc.y += 10;

          // Sub-seção: Análise Externa (após Web)
          analiseExternaRenderer.adicionarSecaoAnaliseExterna(doc as any, grupoData);
        });
        
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
        
        // Adicionar análises por pesquisa (query/pedido)
        const analiseLocalRenderer = new AnaliseLocalRenderer();
        const analiseCacheRenderer = new AnaliseCacheRenderer();
        const analiseWebRenderer = new AnaliseWebRenderer();
        const analiseExternaRenderer = new AnaliseExternaRenderer();

        // Agrupar por "pesquisa" usando pedido/query/item_nome
        const gruposMap = new Map<string, { titulo: string; locais: any[]; caches: any[]; webs: any[]; externas: any[] }>();

        const norm = (s: any) =>
          (typeof s === 'string' ? s : String(s || ''))
            .trim()
            .toLowerCase();

        const getQueryNome = (q: any) => {
          if (!q) return '';
          if (typeof q === 'string') return q;
          return q.nome || q.query_sugerida || '';
        };

        const makeKeyAndTitle = (item: any) => {
          const id = (item as any)?.id_item_cotacao ?? (item as any)?.id;
          const analise = (item as any)?.llm_relatorio || item;
          const pedido = (item as any)?.pedido;
          const queryStr = getQueryNome((item as any)?.query) || getQueryNome(analise?.query);
          const itemNome = (item as any)?.item_nome;
          const key = id != null ? `id:${id}` : norm(pedido || queryStr || itemNome || `item-${Math.random()}`);
          const titulo = (pedido && String(pedido).trim()) || (queryStr && String(queryStr)) || (itemNome && String(itemNome)) || (id != null ? `Item ${id}` : 'Item');
          return { key, titulo: String(titulo) };
        };

        const pushLocal = (item: any) => {
          const { key, titulo } = makeKeyAndTitle(item);
          if (!gruposMap.has(key)) gruposMap.set(key, { titulo, locais: [], caches: [], webs: [], externas: [] });
          gruposMap.get(key)!.locais.push(item);
        };

        const pushWeb = (item: any) => {
          const { key, titulo } = makeKeyAndTitle(item);
          if (!gruposMap.has(key)) gruposMap.set(key, { titulo, locais: [], caches: [], webs: [], externas: [] });
          gruposMap.get(key)!.webs.push(item);
        };

        const pushExterna = (item: any) => {
          const { key, titulo } = makeKeyAndTitle(item);
          if (!gruposMap.has(key)) gruposMap.set(key, { titulo, locais: [], caches: [], webs: [], externas: [] });
          gruposMap.get(key)!.externas.push(item);
        };

        const locaisArr = Array.isArray((data as any).analiseLocal) ? (data as any).analiseLocal : ((data as any).analiseLocal ? [(data as any).analiseLocal] : []);
        const websArr = Array.isArray((data as any).analiseWeb) ? (data as any).analiseWeb : ((data as any).analiseWeb ? [(data as any).analiseWeb] : []);
        const externasArr2 = Array.isArray((data as any).analiseExterna) ? (data as any).analiseExterna : ((data as any).analiseExterna ? [(data as any).analiseExterna] : []);

        locaisArr.forEach(pushLocal);
        websArr.forEach(pushWeb);
        externasArr2.forEach(pushExterna);

        const grupos = Array.from(gruposMap.values());

        grupos.forEach((grupo) => {
          // Nova página para cada pesquisa
          doc.addPage();

          const margin = doc.page.margins.left;
          const pageWidth = doc.page.width;
          const contentWidth = pageWidth - margin * 2;

          // Cabeçalho da pesquisa
          doc
            .font('Helvetica-Bold')
            .fontSize(14)
            .fillColor('#003087')
            .text(`Pesquisa: ${grupo.titulo}`, margin, doc.y);
          doc
            .strokeColor('#E5E7EB')
            .lineWidth(0.5)
            .moveTo(margin, doc.y + 8)
            .lineTo(margin + contentWidth, doc.y + 8)
            .stroke();
          doc.y += 18;

          const grupoData: RelatorioData = {
            ...data,
            analiseLocal: grupo.locais,
            analiseCache: grupo.caches,
            analiseWeb: grupo.webs,
            analiseExterna: grupo.externas,
          } as any;


          analiseLocalRenderer.adicionarSecaoAnaliseLocal(doc as any, grupoData);

          // Divisor
          const dividerY = doc.y;
          doc
            .strokeColor('#E5E7EB')
            .lineWidth(0.5)
            .moveTo(margin, dividerY)
            .lineTo(margin + contentWidth, dividerY)
            .stroke();
          doc.y += 10;

          // Cache
          analiseCacheRenderer.adicionarSecaoAnaliseCache(doc as any, grupoData);

          // Divisor entre cache e web
          const dividerY2 = doc.y;
          doc
            .strokeColor('#E5E7EB')
            .lineWidth(0.5)
            .moveTo(margin, dividerY2)
            .lineTo(margin + contentWidth, dividerY2)
            .stroke();
          doc.y += 10;

          analiseWebRenderer.adicionarSecaoAnaliseWeb(doc as any, grupoData);

          // Divisor entre web e externa
          const dividerY3 = doc.y;
          doc
            .strokeColor('#E5E7EB')
            .lineWidth(0.5)
            .moveTo(margin, dividerY3)
            .lineTo(margin + contentWidth, dividerY3)
            .stroke();
          doc.y += 10;

          // Sub-seção: Análise Externa (após Web)
          analiseExternaRenderer.adicionarSecaoAnaliseExterna(doc as any, grupoData);
        });
        
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
