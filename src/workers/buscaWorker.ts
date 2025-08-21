/**
 * Worker para executar busca automática em background
 */

import { BuscaAutomatica } from '../services/BuscaAtomatica';
import FornecedorService from '../services/FornecedorService';
import { ProdutosService } from '../services/ProdutoService';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface JobMessage {
  id: string;
  termo: string;
  numResultados: number;
  fornecedores: number[];
  usuarioId?: number;
  quantidade?: number; // Quantidade opcional para busca
  custo_beneficio?: any; // Custo-benefício opcional para busca
  refinamento?: boolean; // Nova flag para indicar se deve fazer refinamento LLM
}

interface ProgressMessage {
  progresso: {
    etapa: 'busca' | 'salvamento';
    fornecedores?: number;
    produtos?: number;
    detalhes?: string;
  };
}

interface ResultMessage {
  status: 'sucesso' | 'erro';
  produtos?: any[];
  erro?: string;
  salvamento?: {
    salvos: number;
    erros: number;
    detalhes: any[];
  };
  tempoExecucao?: number;
}

// Função auxiliar para enviar mensagens via stdout (apenas JSON)
function enviarMensagem(message: ProgressMessage | ResultMessage) {
  // Usar um prefixo especial para identificar mensagens JSON
  console.log('WORKER_MSG:' + JSON.stringify(message));
}

// Função auxiliar para logs (via stderr para não interferir)
function log(message: string) {
  // Em produção, reduzir verbosidade dos logs
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    console.error(`[WORKER] ${message}`);
  }
}

// Função para filtrar produtos usando LLM
async function filtrarProdutosComLLM(produtos: any[], termoBusca: string, quantidade?: number, custo_beneficio?: any): Promise<any[]> {
  if (!produtos || produtos.length === 0) {
    return [];
  }

  try {
    log(`🧠 [LLM-FILTER] Iniciando filtro LLM (Groq) para ${produtos.length} produtos`);

    // Usar a lib groq (deve estar instalada via npm install groq-sdk)
    // @ts-ignore
    const { Groq } = require('groq-sdk');
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      log('❌ [LLM-FILTER] GROQ_API_KEY não encontrada');
      return produtos.slice(0, 1); // Fallback: primeiro produto
    }

    // Compactar candidatos para o prompt
    const candidatos = produtos.map((p, index) => ({
      index,
      nome: p.name || p.nome || '',
      categoria: p.categoria || p.modelo || '',
      tags: p.tags || [],
      descricao: (p.description || p.descricao || '').substring(0, 400),
      preco: p.price || p.preco || null,
      estoque: p.estoque || null,
      url: p.product_url || p.url || ''
    }));

    const promptSistema =
      "Você é um assistente especializado em análise de produtos. Sua tarefa é analisar candidatos e escolher o melhor.\n" +
      "IMPORTANTE: Responda APENAS com um número JSON válido no formato exato: {\"index\": N}\n" +
      "Onde N é o índice (0, 1, 2...) do melhor candidato ou -1 se nenhum for adequado.\n" +
      "Critérios de avaliação:\n" +
      "1. Correspondência com a busca original\n" +
      "2. Relevância técnica e funcional\n" +
      "3. Qualidade da descrição e especificações\n" +
      "4. Disponibilidade (se informada)\n" +
      "5. Melhor custo-benefício\n" +
      "NÃO adicione explicações, comentários ou texto extra. APENAS o JSON.";

    const userMsg =
      `TERMO DE BUSCA: ${termoBusca}\n` +
      `QUANTIDADE: ${quantidade || 1}\n` +
      `CUSTO-BENEFÍCIO: ${JSON.stringify(custo_beneficio || {})}\n` +
      `CANDIDATOS: ${JSON.stringify(candidatos)}\n` +
      "Escolha o melhor índice ou -1.";

    const client = new Groq({ apiKey });
    const resp = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: promptSistema },
        { role: "user", content: userMsg }
      ],
      temperature: 0,
      max_tokens: 50,
      stream: false
    });

    const content = (resp.choices[0].message.content || '').trim();
    log(`🧠 [LLM-FILTER] Resposta bruta: ${content}`);

    // Tentar extrair JSON {"index": X}
    let idx = -1;
    try {
      const jsonMatch = content.match(/\{\s*"index"\s*:\s*(-?\d+)\s*\}/);
      if (jsonMatch) {
        idx = parseInt(jsonMatch[1], 10);
        log(`🧠 [LLM-FILTER] Índice extraído via regex JSON: ${idx}`);
      } else {
        // Se não achou padrão JSON, tentar parse direto
        let cleanedContent = content;
        if (/^-?\d+$/.test(content)) {
          cleanedContent = `{"index": ${content}}`;
        }
        const data = JSON.parse(cleanedContent);
        const val = data.index;
        if (typeof val === 'number') {
          idx = val;
          log(`🧠 [LLM-FILTER] Índice extraído via JSON parse: ${idx}`);
        }
      }
    } catch (e) {
      log(`🧠 [LLM-FILTER] Erro ao fazer parse do JSON: ${e}`);
      // fallback: buscar qualquer número na resposta
      const numberMatch = content.match(/-?\d+/);
      if (numberMatch) {
        try {
          idx = parseInt(numberMatch[0], 10);
          log(`🧠 [LLM-FILTER] Índice extraído via regex numérica: ${idx}`);
        } catch {
          idx = -1;
        }
      }
    }

    // Validar faixa
    if (typeof idx !== 'number' || idx < 0 || idx >= produtos.length) {
      log(`🧠 [LLM-FILTER] Índice inválido: ${idx}`);
      return produtos.slice(0, 1); // Fallback: primeiro produto
    }

    const produtoSelecionado = produtos[idx];
    log(`🧠 [LLM-FILTER] Produto selecionado: ${produtoSelecionado.name || produtoSelecionado.nome}`);
    return [produtoSelecionado];
  } catch (error) {
    log(`❌ [LLM-FILTER] Erro no filtro LLM (Groq): ${error}`);
    return produtos.slice(0, 1);
  }
}

// Escutar mensagens via stdin
process.stdin.setEncoding('utf8');
process.stdin.on('data', async (data: string) => {
  try {
    const message: JobMessage = JSON.parse(data.trim());
    await processarJob(message);
  } catch (error) {
    log(`Erro ao processar mensagem: ${error}`);
    enviarMensagem({
      status: 'erro',
      erro: error instanceof Error ? error.message : 'Erro ao processar mensagem'
    });
    process.exit(1);
  }
});

// Função principal que processa o job
async function processarJob(message: JobMessage) {
  const { id, termo, numResultados, fornecedores, usuarioId, quantidade, custo_beneficio, refinamento } = message;

  log(`Worker iniciado para job ${id} - busca: "${termo}"${refinamento ? ' (com refinamento LLM)' : ''}`);
  
  const inicioTempo = Date.now();
  
  try {
    // 1. Buscar fornecedores da base de dados
    enviarMensagem({
      progresso: {
        etapa: 'busca',
        detalhes: 'Carregando fornecedores da base de dados...'
      }
    });

    const fornecedoresBD = await FornecedorService.getFornecedoresAtivos();
    
    // Filtrar fornecedores pelos IDs especificados
    const fornecedoresFiltrados = fornecedoresBD.filter(f => 
      fornecedores.includes(f.id)
    );
    
    if (fornecedoresFiltrados.length === 0) {
      throw new Error('Nenhum fornecedor válido encontrado');
    }

    const sitesParaBusca = fornecedoresFiltrados.map(f => f.url);

    enviarMensagem({
      progresso: {
        etapa: 'busca',
        fornecedores: fornecedoresFiltrados.length,
        detalhes: `Iniciando busca em ${fornecedoresFiltrados.length} fornecedores...`
      }
    });

    // 2. Executar busca
    const buscaService = new BuscaAutomatica();
    
    log(`Buscando "${termo}" em ${sitesParaBusca.length} sites`);
    
    const resultados = await buscaService.buscarProdutosMultiplosSites(
      termo,
      sitesParaBusca,
      numResultados
    );

    // Combinar resultados
    let todosProdutos = buscaService.combinarResultados(resultados);
    
    enviarMensagem({
      progresso: {
        etapa: 'busca',
        produtos: todosProdutos.length,
        detalhes: `${todosProdutos.length} produtos encontrados`
      }
    });

    // 3. Aplicar filtros se necessário
    const configuracoes = await FornecedorService.getConfiguracoesSistema();
    const { precoMinimo, precoMaximo } = configuracoes;
    
    if (precoMinimo !== null || precoMaximo !== null) {
      todosProdutos = buscaService.filtrarPorPreco(todosProdutos, precoMinimo, precoMaximo);
      log(`Produtos após filtro de preço: ${todosProdutos.length}`);
    }

    // 4. Aplicar refinamento LLM se solicitado
    if (refinamento && todosProdutos.length > 0) {
      enviarMensagem({
        progresso: {
          etapa: 'busca',
          detalhes: 'Aplicando refinamento LLM...'
        }
      });

      todosProdutos = await filtrarProdutosComLLM(todosProdutos, termo, quantidade, custo_beneficio);
      log(`Produtos após refinamento LLM: ${todosProdutos.length}`);
    }

    // 5. Salvar produtos na base de dados (se houver produtos)
    if (todosProdutos.length > 0) {
      enviarMensagem({
        progresso: {
          etapa: 'salvamento',
          detalhes: 'Salvando produtos na base de dados...'
        }
      });

      const produtoService = new ProdutosService();
      const resultadosSalvamento: any[] = [];
      
      for (let i = 0; i < resultados.length; i++) {
        const resultado = resultados[i];
        const fornecedor = fornecedoresFiltrados[i];
        
        if (!resultado || !fornecedor) continue;
        
        if (resultado.success && resultado.data && resultado.data.products.length > 0) {
          try {
            const salvamento = await produtoService.salvarProdutosDaBusca(
              resultado.data.products,
              fornecedor.id,
              usuarioId || 1
            );
            
            resultadosSalvamento.push({
              fornecedor: fornecedor.nome,
              fornecedor_id: fornecedor.id,
              ...salvamento
            });
            
          } catch (error) {
            log(`Erro ao salvar produtos do ${fornecedor.nome}: ${error}`);
            resultadosSalvamento.push({
              fornecedor: fornecedor.nome,
              fornecedor_id: fornecedor.id,
              salvos: 0,
              erros: resultado.data?.products.length || 0,
              detalhes: [{ erro: error instanceof Error ? error.message : 'Erro desconhecido' }]
            });
          }
        }
      }
      
      const totalSalvos = resultadosSalvamento.reduce((acc, r) => acc + r.salvos, 0);
      const totalErros = resultadosSalvamento.reduce((acc, r) => acc + r.erros, 0);
      
      // 6. Enviar resultado final
      const tempoTotal = Date.now() - inicioTempo;
      
      enviarMensagem({
        status: 'sucesso',
        produtos: todosProdutos,
        salvamento: {
          salvos: totalSalvos,
          erros: totalErros,
          detalhes: resultadosSalvamento
        },
        tempoExecucao: tempoTotal
      });
      
      log(`Worker concluído - Job ${id}: ${totalSalvos} produtos salvos em ${tempoTotal}ms`);
      
    } else {
      // Nenhum produto encontrado
      const tempoTotal = Date.now() - inicioTempo;
      
      enviarMensagem({
        status: 'sucesso',
        produtos: [],
        salvamento: {
          salvos: 0,
          erros: 0,
          detalhes: []
        },
        tempoExecucao: tempoTotal
      });
      
      log(`Worker concluído - Job ${id}: Nenhum produto encontrado em ${tempoTotal}ms`);
    }
    
  } catch (error) {
    log(`Erro no worker do job ${id}: ${error}`);
    
    enviarMensagem({
      status: 'erro',
      erro: error instanceof Error ? error.message : 'Erro desconhecido no worker'
    });
  }
  
  // Encerrar processo
  process.exit(0);
}

// Tratar erros não capturados
process.on('uncaughtException', (error) => {
  log(`Erro não capturado no worker: ${error}`);
  enviarMensagem({
    status: 'erro',
    erro: `Erro não capturado: ${error.message}`
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Promise rejeitada no worker: ${reason}`);
  enviarMensagem({
    status: 'erro',
    erro: `Promise rejeitada: ${reason}`
  });
  process.exit(1);
});

log('Worker de busca inicializado e aguardando mensagens...');