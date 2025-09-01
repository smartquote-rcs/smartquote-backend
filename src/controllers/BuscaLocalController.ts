import { Request, Response } from 'express';
import { pythonProcessor } from '../services/PythonInterpretationProcessor';
import { BuscaAutomatica } from '../services/BuscaAtomatica';
import WebBuscaJobService from '../services/WebBuscaJobService';
import FornecedorService from '../services/FornecedorService';
import CotacoesItensService from '../services/CotacoesItensService';
import supabase from '../infra/supabase/connect';
import PromptsService from '../services/PromptsService';
import CotacoesService from '../services/CotacoesService';
import type { Cotacao } from '../models/Cotacao';
import RelatorioService from '../services/RelatorioService';
import { number } from 'zod';

type BuscaLocalOptions = {
  limite?: number;
  multilingue?: boolean; // default: true
  criarCotacao?: boolean; // default: false
  timeoutMs?: number; // default: 120000
  onlyBuscarHibridoPonderado?: boolean; // default: false
};

export class BuscaLocalController {
  private buildArgs(opts: BuscaLocalOptions): string[] {
    const args: string[] = [];
    if (opts.limite && Number.isFinite(opts.limite)) {
      args.push('--limite', String(opts.limite));
    }
    if (opts.multilingue === false) {
      args.push('--no-multilingue');
    }
    if (opts.criarCotacao) {
      args.push('--criar-cotacao');
    }
    if(opts.onlyBuscarHibridoPonderado)
    {
      args.push('--only-buscar_hibrido_ponderado');
    }
    return args;
  }

  async searchLocal(req: Request, res: Response) {
    try {
      const pesquisa: string = (req.body?.pesquisa || '').toString().trim();
      const limite = Number(req.body?.limite) || undefined;
      const filtros = req.body?.filtros || undefined;

      if (!pesquisa) {
        return res.status(400).json({ 
          success: false, 
          message: 'Campo "pesquisa" é obrigatório' 
        });
      }

      console.log(`🔍 [BUSCA-LOCAL] Iniciando busca híbrida para: "${pesquisa}"`);
      
      // Preparar payload para o Python no formato esperado pelo --only-buscar_hibrido_ponderado
      const searchPayload = {
        pesquisa,
        filtros: filtros || {},
        limite
      };

      // Enviar para o processo Python usando o método especializado para busca híbrida
      const result = await pythonProcessor.processHybridSearch(searchPayload);

      if (!result.success) {
        console.error(`❌ [BUSCA-LOCAL] Falha na busca: ${result.error}`);
        return res.status(500).json({ 
          success: false, 
          message: 'Falha na busca local', 
          error: result.error 
        });
      }

      const pythonResult = result.result;
      
      if (pythonResult?.status === 'empty') {
        console.log(`📭 [BUSCA-LOCAL] Nenhum resultado encontrado para: "${pesquisa}"`);
        return res.status(200).json({
          success: true,
          message: 'Busca concluída - nenhum resultado encontrado',
          resultados: [],
          total: 0,
          pesquisa,
          filtros
        });
      }

      if (pythonResult?.status === 'success' && Array.isArray(pythonResult.resultados)) {
        const resultados = pythonResult.resultados;
        console.log(`✅ [BUSCA-LOCAL] ${resultados.length} produtos encontrados para: "${pesquisa}"`);
        
        return res.status(200).json({
          success: true,
          message: 'Busca híbrida concluída com sucesso',
          resultados,
          total: resultados.length,
          pesquisa,
          filtros,
          executionTime: result.executionTime
        });
      }

      // Caso não esperado
      console.warn(`⚠️ [BUSCA-LOCAL] Resultado inesperado do Python:`, pythonResult);
      return res.status(500).json({
        success: false,
        message: 'Formato de resultado inesperado',
        pythonResult
      });

    } catch (error: any) {
      console.error(`❌ [BUSCA-LOCAL] Erro ao processar busca: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao processar busca', 
        error: error.message 
      });
    }
  }

  async search(req: Request, res: Response) {
    try {
      const solicitacao: string = (req.body?.solicitacao || '').toString().trim();
      const limite = Number(req.body?.limite) || undefined;
      const multilingue = req.body?.multilingue !== undefined ? Boolean(req.body.multilingue) : true;
      const criarCotacao = req.body?.criarCotacao ? Boolean(req.body.criarCotacao) : false;
      const searchWeb = req.body?.searchWeb !== undefined ? Boolean(req.body.searchWeb) : true;
      const ponderacaoWeb_LLM = req.body?.ponderacao_busca_externa !== undefined ? Boolean(req.body.ponderacao_busca_externa) : false;
      if (!solicitacao) {
        return res.status(400).json({ success: false, message: 'Campo "solicitacao" é obrigatório' });
      }

      // Executar busca local via worker persistente
      const result = await pythonProcessor.processInterpretation({
        id: `manual_${Date.now()}`,
        emailId: 'manual',
        tipo: 'pedido',
        prioridade: 'media',
        solicitacao,
        cliente: {},
        confianca: 100,
        interpretedAt: new Date().toISOString(),
      } as any);

      if (!result.success || !result.result) {
        return res.status(500).json({ success: false, message: 'Falha na busca local', error: result });
      }

  const payload = result.result || {};
  const faltantes = Array.isArray(payload.faltantes) ? payload.faltantes : [];
  const resumoLocal = payload?.resultado_resumo || {};
  const cotacoesInfo = payload.cotacoes || null;

  console.log(`🔍 [BUSCA-LOCAL] Processando busca para: "${solicitacao}"`);
  console.log(`📊 [BUSCA-LOCAL] Produtos não encontrados no banco de dados: ${faltantes.length}`);
  console.log(`🏠 [BUSCA-LOCAL] Resultados locais: ${Object.keys(resumoLocal).length} queries`);
  console.log(`📋 [BUSCA-LOCAL] Cotação: ${cotacoesInfo?.principal_id || 'Nenhuma'}`);

  let produtosWeb: any[] = [];
  let resultadosCompletos: any[] = [];
  if (faltantes.length > 0) {
    console.log(`🌐 [BUSCA-LOCAL] Iniciando busca web para ${faltantes.length} faltantes`);
    const svc = new WebBuscaJobService();
    const statusUrls = await svc.createJobsForFaltantes(faltantes, solicitacao, ponderacaoWeb_LLM);
    console.log(`🚀 [BUSCA-LOCAL] Jobs criados: ${statusUrls.length}`);
    
    const { resultadosCompletos: resultados, produtosWeb: aprovados } = await svc.waitJobs(statusUrls);
    produtosWeb = aprovados;
    resultadosCompletos = resultados;
    console.log(`✅ [BUSCA-LOCAL] Jobs concluídos: ${produtosWeb.length} produtos aprovados`);
    console.log(`📋 [BUSCA-LOCAL] Resultados completos: ${resultadosCompletos.length} jobs`);
    
    // Verificar se precisamos criar cotação para produtos web
    if (produtosWeb.length > 0 && !cotacoesInfo?.principal_id) {
      console.log(`📝 [BUSCA-LOCAL] Cotação será criada para receber ${produtosWeb.length} produtos web`);
    }
  }

        // Usar a cotação que o Python já criou, ou criar apenas se necessário
      let cotacaoPrincipalId: number | null = cotacoesInfo?.principal_id ?? null;
      const temResultadosLocais = Object.values(resumoLocal).some((arr: any) => Array.isArray(arr) && arr.length > 0);
      
      console.log(`🏗️ [BUSCA-LOCAL] Verificando cotação:`);
      console.log(`   - Cotação: ${cotacaoPrincipalId || 'Nenhuma'}`);
      console.log(`   - Produtos web: ${produtosWeb.length}`);
      console.log(`   - Faltantes: ${faltantes.length}`);
      
      // Só criar cotação se o Python não criou e realmente precisarmos
      if (!cotacaoPrincipalId && (produtosWeb.length > 0 || faltantes.length > 0)) {
        console.log(`📝 [BUSCA-LOCAL] Criando nova cotação para produtos web/faltantes`);
        const dadosExtraidos = payload?.dados_extraidos || {
          solucao_principal: solicitacao,
          tipo_de_solucao: 'sistema',
          itens_a_comprar: faltantes.map((f: any) => ({
            nome: f.nome || 'Item não especificado',
            natureza_componente: 'software',
            prioridade: 'media',
            categoria: f.categoria || 'Geral',
            quantidade: f.quantidade || 1
          }))
        };
        const prompt = await PromptsService.create({
          texto_original: solicitacao,
          dados_extraidos: dadosExtraidos,
          cliente: payload?.cliente || {},
          dados_bruto: payload?.dados_bruto || {},
          origem: { tipo: 'servico', fonte: 'api' },
          status: 'analizado'
        });
        if (prompt.id) {
          const nova: Cotacao = {
            prompt_id: prompt.id,
            status: 'incompleta',
            aprovacao: false,
            faltantes: faltantes?.length ? faltantes : [],
            orcamento_geral: 0
          };
          try {
            const criada = await CotacoesService.create(nova);
            cotacaoPrincipalId = criada?.id ?? null;
            console.log(`✅ [BUSCA-LOCAL] Cotação criada com sucesso: ID ${cotacaoPrincipalId}`);
          } catch (e) {
            console.error('❌ [BUSCA-LOCAL] Erro ao criar cotação principal:', e);
          }
        }
      } else if (cotacaoPrincipalId) {
        console.log(`📋 [BUSCA-LOCAL] Usando cotação existente: ID ${cotacaoPrincipalId}`);
      } else {
        console.log(`ℹ️ [BUSCA-LOCAL] Nenhuma cotação necessária (apenas resultados locais)`);
      }
  // Inserir itens web, se houver
  if (cotacaoPrincipalId && resultadosCompletos.length > 0 && searchWeb) {
        console.log(`🔧 [BUSCA-LOCAL] Iniciando inserção de ${resultadosCompletos.length} resultados de jobs na cotação ${cotacaoPrincipalId}`);
        
        try {
          const svc = new WebBuscaJobService();
          
          const inseridos = await svc.insertJobResultsInCotacao(Number(cotacaoPrincipalId), resultadosCompletos);
          
          await svc.recalcOrcamento(Number(cotacaoPrincipalId));
          
          console.log(`✅ [BUSCA-LOCAL] ${inseridos} itens web inseridos na cotação ${cotacaoPrincipalId}`);
        } catch (e) {
          console.error('❌ [BUSCA-LOCAL] Erro ao inserir itens web na cotação:', e);
          console.error('❌ [BUSCA-LOCAL] Stack trace:', (e as any)?.stack);
        }
      } else {
        console.log(`⚠️ [BUSCA-LOCAL] Condições não atendidas para inserção web:`);
        console.log(`   - cotacaoPrincipalId: ${cotacaoPrincipalId}`);
      }

      // O Python já cria os itens locais automaticamente, não precisamos duplicar aqui
      // Apenas recalcular orçamento se houver resultados locais
      if (cotacaoPrincipalId && temResultadosLocais) {
        await this.recalcularOrcamento(Number(cotacaoPrincipalId));
      }

      // Relatório será gerado automaticamente pelo WebBuscaJobService quando a cotação estiver completa
      
      return res.status(200).json({
        success: true,
        message: 'Busca híbrida concluída',
        dados_python: payload,
        resultados_web: produtosWeb,
        cotacao_principal_id: cotacaoPrincipalId,
      });
    } catch (error: any) {
      console.error('Erro no fluxo de busca híbrida:', error);
      return res.status(500).json({ success: false, message: 'Erro interno', error: error?.message || String(error) });
    }
  }

  private async recalcularOrcamento(cotacaoId: number) {
    try {
      const { data: itens, error } = await supabase
        .from('cotacoes_itens')
        .select('item_preco, quantidade')
        .eq('cotacao_id', cotacaoId);
      if (!error && Array.isArray(itens)) {
        let total = 0;
        for (const it of itens) {
          const preco = parseFloat(String(it.item_preco ?? 0));
          const qtd = parseInt(String(it.quantidade ?? 1));
          if (!isNaN(preco) && !isNaN(qtd)) total += preco * qtd;
        }
        await supabase.from('cotacoes').update({ orcamento_geral: total }).eq('id', cotacaoId);
      }
    } catch (e) {
      console.error('Erro ao recalcular orçamento:', e);
    }
  }

}

export default new BuscaLocalController();
