import { Router } from 'express';
import RelatorioService from '../services/RelatorioService';
import { authMiddleware } from '../middleware/authMiddleware';
import supabase from '../infra/supabase/connect';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * @route POST /api/relatorios/gerar/:cotacaoId
 * @desc Gera relatório completo em PDF para uma cotação
 * @access Private
 */
router.post('/gerar/:cotacaoId', authMiddleware, async (req, res) => {
  try {
    const { cotacaoId } = req.params;
    if (!cotacaoId) {
      return res.status(400).json({
        success: false,
        message: 'ID da cotação é obrigatório'
      });
    }
    const cotacaoIdNum = parseInt(cotacaoId);

    if (isNaN(cotacaoIdNum)) {
      return res.status(400).json({
        success: false,
        message: 'ID da cotação deve ser um número válido'
      });
    }

    console.log(`📊 [RELATORIO] Gerando relatório para cotação ${cotacaoIdNum}`);

    // Gerar relatório
    const pdfPath = await RelatorioService.gerarRelatorioCompleto(cotacaoIdNum);

    console.log(`✅ [RELATORIO] Relatório gerado com sucesso: ${pdfPath}`);

    // Retornar caminho do arquivo
    res.json({
      success: true,
      message: 'Relatório gerado com sucesso',
      data: {
        pdfPath,
        filename: pdfPath.split('/').pop(),
        downloadUrl: `/api/relatorios/download/${encodeURIComponent(pdfPath)}`
      }
    });

  } catch (error: any) {
    console.error('❌ [RELATORIO] Erro ao gerar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório',
      error: error.message
    });
  }
});

/**
 * @route GET /api/relatorios/download/:filename
 * @desc Download do arquivo PDF gerado
 * @access Private
 */
router.get('/download/:filename', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Nome do arquivo é obrigatório'
      });
    }
    const decodedFilename = decodeURIComponent(filename);
    
    // Construir caminho completo
    const filePath = path.join(process.cwd(), 'temp', decodedFilename);
    
    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      });
    }

    // Configurar headers para download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${decodedFilename}"`);
    
    // Enviar arquivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error: any) {
    console.error('❌ [RELATORIO] Erro ao fazer download:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer download',
      error: error.message
    });
  }
});

/**
 * @route GET /api/relatorios/status/:cotacaoId
 * @desc Verifica se uma cotação está pronta para relatório
 * @access Private
 */
router.get('/status/:cotacaoId', authMiddleware, async (req, res) => {
  try {
    const { cotacaoId } = req.params;
    if (!cotacaoId) {
      return res.status(400).json({
        success: false,
        message: 'ID da cotação é obrigatório'
      });
    }
    const cotacaoIdNum = parseInt(cotacaoId);

    if (isNaN(cotacaoIdNum)) {
      return res.status(400).json({
        success: false,
        message: 'ID da cotação deve ser um número válido'
      });
    }

    // Buscar status da cotação e informações do relatório
    const { data: cotacao, error } = await supabase
      .from('cotacoes')
      .select('status, orcamento_geral, relatorio_path, relatorio_gerado_em')
      .eq('id', cotacaoIdNum)
      .single();

    if (error || !cotacao) {
      return res.status(404).json({
        success: false,
        message: 'Cotação não encontrada'
      });
    }

    // Buscar dados dos relatórios na tabela relatorios
    const { data: relatoriosData, error: relatoriosError } = await supabase
      .from('relatorios')
      .select('status, versao, analise_local, analise_web, criado_em')
      .eq('cotacao_id', cotacaoIdNum)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    let temAnalises = false;
    let statusAnalises = 'sem_dados';
    
    if (!relatoriosError && relatoriosData) {
      const analiseLocal = Array.isArray(relatoriosData.analise_local) ? relatoriosData.analise_local : [];
      const analiseWeb = Array.isArray(relatoriosData.analise_web) ? relatoriosData.analise_web : [];
      temAnalises = analiseLocal.length > 0 || analiseWeb.length > 0;
      statusAnalises = relatoriosData.status || 'rascunho';
    }

    // Verificar se está pronta para relatório
    const estaPronta = cotacao.status === 'completa' || cotacao.status === 'incompleta';
    const temOrcamento = cotacao.orcamento_geral > 0;
    const temRelatorio = cotacao.relatorio_path && cotacao.relatorio_gerado_em;
    const prontaParaRelatorio = estaPronta && (temOrcamento || temAnalises);

    res.json({
      success: true,
      data: {
        cotacaoId: cotacaoIdNum,
        status: cotacao.status,
        estaProntaParaRelatorio: prontaParaRelatorio,
        orcamentoGeral: cotacao.orcamento_geral,
        analises: {
          existem: temAnalises,
          status: statusAnalises,
          ultimaAtualizacao: relatoriosData?.criado_em || null
        },
        relatorio: {
          existe: temRelatorio,
          path: cotacao.relatorio_path,
          geradoEm: cotacao.relatorio_gerado_em,
          downloadUrl: temRelatorio ? `/api/relatorios/download/${encodeURIComponent(cotacao.relatorio_path)}` : null
        }
      }
    });

  } catch (error: any) {
    console.error('❌ [RELATORIO] Erro ao verificar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status',
      error: error.message
    });
  }
});

/**
 * @route GET /api/relatorios/listar/:cotacaoId
 * @desc Lista todos os relatórios disponíveis para uma cotação
 * @access Private
 */
router.get('/listar/:cotacaoId', authMiddleware, async (req, res) => {
  try {
    const { cotacaoId } = req.params;
    if (!cotacaoId) {
      return res.status(400).json({
        success: false,
        message: 'ID da cotação é obrigatório'
      });
    }
    const cotacaoIdNum = parseInt(cotacaoId);

    if (isNaN(cotacaoIdNum)) {
      return res.status(400).json({
        success: false,
        message: 'ID da cotação deve ser um número válido'
      });
    }

    // Buscar cotação e seus relatórios
    const { data: cotacao, error } = await supabase
      .from('cotacoes')
      .select(`
        id,
        status,
        orcamento_geral,
        relatorio_path,
        relatorio_gerado_em,
        prompt_id,
        created_at
      `)
      .eq('id', cotacaoIdNum)
      .single();

    if (error || !cotacao) {
      return res.status(404).json({
        success: false,
        message: 'Cotação não encontrada'
      });
    }

    // Buscar prompt relacionado
    let prompt = null;
    if (cotacao.prompt_id) {
      const { data: promptData } = await supabase
        .from('prompts')
        .select('texto_original, dados_extraidos')
        .eq('id', cotacao.prompt_id)
        .single();
      prompt = promptData;
    }

    // Buscar dados dos relatórios na tabela relatorios
    const { data: relatoriosData, error: relatoriosError } = await supabase
      .from('relatorios')
      .select('id, status, versao, criado_em, atualizado_em, analise_local, analise_web')
      .eq('cotacao_id', cotacaoIdNum)
      .order('id', { ascending: false });

    let analisesSummary = {
      totalAnalises: 0,
      analiseLocal: 0,
      analiseWeb: 0,
      ultimaAtualizacao: null
    };

    if (!relatoriosError && relatoriosData && relatoriosData.length > 0) {
      const ultimoRelatorio = relatoriosData[0];
      const analiseLocal = Array.isArray(ultimoRelatorio.analise_local) ? ultimoRelatorio.analise_local : [];
      const analiseWeb = Array.isArray(ultimoRelatorio.analise_web) ? ultimoRelatorio.analise_web : [];
      
      analisesSummary = {
        totalAnalises: analiseLocal.length + analiseWeb.length,
        analiseLocal: analiseLocal.length,
        analiseWeb: analiseWeb.length,
        ultimaAtualizacao: ultimoRelatorio.atualizado_em
      };
    }

    res.json({
      success: true,
      data: {
        cotacao: {
          id: cotacao.id,
          status: cotacao.status,
          orcamentoGeral: cotacao.orcamento_geral,
          createdAt: cotacao.created_at
        },
        prompt: prompt ? {
          textoOriginal: prompt.texto_original,
          dadosExtraidos: prompt.dados_extraidos
        } : null,
        relatorio: {
          existe: !!(cotacao.relatorio_path && cotacao.relatorio_gerado_em),
          path: cotacao.relatorio_path,
          geradoEm: cotacao.relatorio_gerado_em,
          downloadUrl: cotacao.relatorio_path ? `/api/relatorios/download/${encodeURIComponent(cotacao.relatorio_path)}` : null
        },
        analises: analisesSummary,
        relatoriosDisponiveis: relatoriosData || []
      }
    });

  } catch (error: any) {
    console.error('❌ [RELATORIO] Erro ao listar relatórios:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar relatórios',
      error: error.message
    });
  }
});

export default router;
