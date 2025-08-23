/**
 * Worker para executar busca automática em background
 */

import { BuscaAutomatica } from '../services/BuscaAtomatica';
import FornecedorService from '../services/FornecedorService';
import { ProdutosService } from '../services/ProdutoService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Product } from '../types/BuscaTypes';

interface JobMessage {
  id: string;
  termo: string;
  numResultados: number;
  fornecedores: number[];
  usuarioId?: number;
  quantidade?: number; // Quantidade opcional para busca
  custo_beneficio?: any; // Custo-benefício opcional para busca
  rigor?: number; // Novo parâmetro para rigor
  refinamento?: boolean; // Nova flag para indicar se deve fazer refinamento LLM
  faltante_id?: string; // ID do faltante para rastreamento
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
  quantidade?: number; // Quantidade de produtos requerido
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
  // Sempre exibir logs do LLM e logs importantes
  if (message.includes('[LLM-FILTER]') || message.includes('Worker') || message.includes('Job')) {
    console.error(`[WORKER] ${message}`);
  } else {
    // Em produção, reduzir verbosidade dos logs gerais
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.error(`[WORKER] ${message}`);
    }
  }
}

// Função para filtrar produtos usando LLM
async function filtrarProdutosComLLM(produtos: any[], termoBusca: string, quantidade?: number, custo_beneficio?: any, rigor?: number): Promise<any[]> {
  if (!produtos || produtos.length === 0) {
    return [];
  }

  try {
    log(`🧠 [LLM-FILTER] Iniciando filtro LLM (Groq) para ${produtos.length} produtos`);

    // Filtrar produtos inadequados antes de enviar para o LLM
    const produtosValidos = produtos.filter(p => {
      const temNome = p.name && p.name.trim().length > 0;
      const temUrl = p.product_url && p.product_url.trim().length > 0;
      const temDescricao = p.description && p.description.trim().length > 10;
      
      if (!temNome || !temUrl || !temDescricao) {
        log(`🧠 [LLM-FILTER] Produto filtrado por dados incompletos: ${p.name || 'Sem nome'} (URL: ${!!p.product_url}, Desc: ${!!p.description})`);
        return false;
      }
      return true;
    });

    if (produtosValidos.length === 0) {
      log(`🧠 [LLM-FILTER] Nenhum produto válido encontrado após filtro`);
      return [];
    }

    log(`🧠 [LLM-FILTER] ${produtosValidos.length} produtos válidos para análise LLM`);

    // Usar a lib groq (deve estar instalada via npm install groq-sdk)
    // @ts-ignore
    const { Groq } = require('groq-sdk');
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      log('❌ [LLM-FILTER] GROQ_API_KEY não encontrada');
      log('🧠 [LLM-FILTER] Sem API key - nenhum produto será salvo');
      return []; // Sem API key, não salvar nenhum produto
    }

    // Compactar candidatos para o prompt
    const candidatos = produtosValidos.map((p, index) => ({
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
      "1. Correspondência EXATA com o termo de busca\n" +
      "2. Produto deve ter URL válida e informações completas\n" +
      "3. Relevância técnica e funcional\n" +
      "4. Qualidade da descrição e especificações\n" +
      "5. Disponibilidade (se informada)\n" +
      "6. Melhor custo-benefício\n" +
      "7. Rigor na busca: inteiro (0–5) indicando quão exatamente o usuário quer o item:\n" +
      "   - 0 = genérico (\"um computador\")\n" +
      "   - 1 = pouco específico\n" +
      "   - 2 = algumas características\n" +
      "   - 3 = moderadamente específico\n" +
      "   - 4 = quase fechado\n" +
      "   - 5 = rígido, modelo exato\n" +
      "REGRAS IMPORTANTES:\n" +
      "- NUNCA escolha produtos sem URL ou com informações vazias\n" +
      "- Prefira produtos com descrições detalhadas\n" +
      "- Se nenhum produto for adequado, retorne -1\n" +
      "- Seja RIGOROSO na seleção - é melhor rejeitar do que aceitar produtos inadequados\n" +
      "NÃO adicione explicações, comentários ou texto extra. APENAS o JSON.";

    const userMsg =
      `TERMO DE BUSCA: ${termoBusca}\n` +
      `QUANTIDADE: ${quantidade || 1}\n` +
      `CUSTO-BENEFÍCIO: ${JSON.stringify(custo_beneficio || {})}\n` +
      `RIGOR: ${rigor || 0}\n` +
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
    if (typeof idx !== 'number' || idx < 0 || idx >= produtosValidos.length) {
      if (idx === -1) {
        log(`🧠 [LLM-FILTER] LLM rejeitou todos os produtos (índice: -1)`);
        return []; // Nenhum produto selecionado pelo LLM
      }
      log(`🧠 [LLM-FILTER] Índice inválido: ${idx}`);
      return []; // Não fazer fallback, apenas retornar vazio
    }

    const produtoSelecionado = produtosValidos[idx];
    log(`🧠 [LLM-FILTER] Produto selecionado: ${produtoSelecionado.name || produtoSelecionado.nome}`);
    return [produtoSelecionado];
  } catch (error) {
    log(`❌ [LLM-FILTER] Erro no filtro LLM (Groq): ${error}`);
    // Em caso de erro, não salvar nenhum produto
    log(`🧠 [LLM-FILTER] Erro no LLM - nenhum produto será salvo`);
    return [];
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
  const { id, termo, numResultados, fornecedores, usuarioId, quantidade, custo_beneficio, rigor, refinamento, faltante_id } = message;

  log(`Worker iniciado para job ${id} - busca: "${termo}"${refinamento ? ' (com refinamento LLM)' : ''}${faltante_id ? ` - Faltante ID: ${faltante_id}` : ''}`);
  
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
    
    // Adicionar o ID do faltante a todos os produtos
    if (faltante_id) {
      todosProdutos = todosProdutos.map(produto => ({
        ...produto,
        faltante_id: faltante_id
      }));
    }
    
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

      const produtosAntesLLM = todosProdutos.length;
      todosProdutos = await filtrarProdutosComLLM(todosProdutos, termo, quantidade, custo_beneficio, rigor);
      log(`Produtos após refinamento LLM: ${todosProdutos.length} de ${produtosAntesLLM}`);
      
      if (todosProdutos.length === 0) {
        log(`🧠 [LLM-FILTER] Nenhum produto aprovado pelo LLM para salvamento`);
      }
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
      
      // Usar os produtos filtrados pelo LLM (todosProdutos) em vez dos produtos originais
      // Agrupar produtos por fornecedor para salvar corretamente
      const produtosPorFornecedor = new Map<number, Product[]>();
      
      // Mapear produtos filtrados para seus fornecedores originais
      for (const produtoFiltrado of todosProdutos) {
        // Encontrar o fornecedor original deste produto
        for (let i = 0; i < resultados.length; i++) {
          const resultado = resultados[i];
          const fornecedor = fornecedoresFiltrados[i];
          
          if (resultado?.success && resultado.data?.products) {
            // Verificar se este produto filtrado veio deste fornecedor
            const produtoOriginal = resultado.data.products.find(p => 
              p.name === produtoFiltrado.name && 
              p.product_url === produtoFiltrado.product_url
            );
            
            if (produtoOriginal && fornecedor) {
              if (!produtosPorFornecedor.has(fornecedor.id)) {
                produtosPorFornecedor.set(fornecedor.id, []);
              }
              produtosPorFornecedor.get(fornecedor.id)!.push(produtoFiltrado);
              break;
            }
          }
        }
      }
      
      // Salvar produtos agrupados por fornecedor
      for (const [fornecedorId, produtos] of produtosPorFornecedor) {
        const fornecedor = fornecedoresFiltrados.find(f => f.id === fornecedorId);
        if (!fornecedor) continue;
        
        try {
          const salvamento = await produtoService.salvarProdutosDaBusca(
            produtos,
            fornecedorId,
            usuarioId || 1
          );
          
          resultadosSalvamento.push({
            fornecedor: fornecedor.nome,
            fornecedor_id: fornecedorId,
            ...salvamento
          });
          
        } catch (error) {
          log(`Erro ao salvar produtos do ${fornecedor.nome}: ${error}`);
          resultadosSalvamento.push({
            fornecedor: fornecedor.nome,
            fornecedor_id: fornecedorId,
            salvos: 0,
            erros: produtos.length,
            detalhes: [{ erro: error instanceof Error ? error.message : 'Erro desconhecido' }]
          });
        }
      }
      
      const totalSalvos = resultadosSalvamento.reduce((acc, r) => acc + r.salvos, 0);
      const totalErros = resultadosSalvamento.reduce((acc, r) => acc + r.erros, 0);
      
      // 6. Enviar resultado final
      const tempoTotal = Date.now() - inicioTempo;
      
      enviarMensagem({
        status: 'sucesso',
        produtos: todosProdutos,
        quantidade: quantidade,
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