/**
 * Worker para executar busca automática em background
 */

import { BuscaAutomatica } from '../services/BuscaAtomatica';
import FornecedorService from '../services/FornecedorService';
import { ProdutosService } from '../services/ProdutoService';

interface JobMessage {
  id: string;
  termo: string;
  numResultados: number;
  fornecedores: number[];
  usuarioId?: number;
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
  salvamento?: {
    salvos: number;
    erros: number;
    detalhes: any[];
  };
  tempoExecucao?: number;
  erro?: string;
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
  const { id, termo, numResultados, fornecedores, usuarioId } = message;
  
  log(`Worker iniciado para job ${id} - busca: "${termo}"`);
  
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
      todosProdutos = buscaService.filtrarPorPreco(
        todosProdutos,
        precoMinimo || undefined,
        precoMaximo || undefined
      );
      
      enviarMensagem({
        progresso: {
          etapa: 'busca',
          produtos: todosProdutos.length,
          detalhes: `${todosProdutos.length} produtos após filtro de preço`
        }
      });
    }

    // 4. Salvar produtos na base de dados
    if (todosProdutos.length > 0) {
      enviarMensagem({
        progresso: {
          etapa: 'salvamento',
          produtos: todosProdutos.length,
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
      
      // 5. Enviar resultado final
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