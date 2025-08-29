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
      const analiseLocal = Array.isArray(ultimoRelatorio?.analise_local) ? ultimoRelatorio.analise_local : [];
      const analiseWeb = Array.isArray(ultimoRelatorio?.analise_web) ? ultimoRelatorio.analise_web : [];
      
      analisesSummary = {
        totalAnalises: analiseLocal.length + analiseWeb.length,
        analiseLocal: analiseLocal.length,
        analiseWeb: analiseWeb.length,
        ultimaAtualizacao: ultimoRelatorio?.atualizado_em
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

/**
 * @route PUT /api/relatorios/proposta-email/:cotacaoId
 * @desc Atualiza ou cria o conteúdo da proposta de email para uma cotação
 * @access public
 */
router.put('/proposta-email/:cotacaoId', async (req, res) => {
  try {
    const { cotacaoId } = req.params;
    const { propostaEmail } = req.body;

    if (!cotacaoId) {
      return res.status(400).json({
        success: false,
        message: 'ID da cotação é obrigatório'
      });
    }

    if (!propostaEmail) {
      return res.status(400).json({
        success: false,
        message: 'Conteúdo da proposta de email é obrigatório'
      });
    }

    const cotacaoIdNum = parseInt(cotacaoId);

    if (isNaN(cotacaoIdNum)) {
      return res.status(400).json({
        success: false,
        message: 'ID da cotação deve ser um número válido'
      });
    }

    console.log(`📧 [RELATORIO] Atualizando proposta de email para cotação ${cotacaoIdNum}`);

    // Verificar se a cotação existe
    const { data: cotacao, error: cotacaoError } = await supabase
      .from('cotacoes')
      .select('id')
      .eq('id', cotacaoIdNum)
      .single();

    if (cotacaoError || !cotacao) {
      return res.status(404).json({
        success: false,
        message: 'Cotação não encontrada'
      });
    }

    // Verificar se já existe um relatório para esta cotação
    const { data: relatorioExistente, error: buscaError } = await supabase
      .from('relatorios')
      .select('id, versao')
      .eq('cotacao_id', cotacaoIdNum)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    let resultado;

    if (buscaError && buscaError.code === 'PGRST116') {
      // Não existe relatório, criar um novo
      const { data, error } = await supabase
        .from('relatorios')
        .insert({
          cotacao_id: cotacaoIdNum,
          proposta_email: propostaEmail,
          status: 'rascunho',
          versao: 1
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [RELATORIO] Erro ao criar relatório:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar relatório com proposta de email',
          error: error.message
        });
      }

      resultado = data;
      console.log(`✅ [RELATORIO] Novo relatório criado com proposta de email para cotação ${cotacaoIdNum}`);

    } else if (relatorioExistente) {
      // Existe relatório, atualizar a proposta_email
      const { data, error } = await supabase
        .from('relatorios')
        .update({
          proposta_email: propostaEmail,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', relatorioExistente.id)
        .select()
        .single();

      if (error) {
        console.error('❌ [RELATORIO] Erro ao atualizar proposta de email:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar proposta de email',
          error: error.message
        });
      }

      resultado = data;
      console.log(`✅ [RELATORIO] Proposta de email atualizada para cotação ${cotacaoIdNum}`);

    } else {
      // Erro inesperado na busca
      console.error('❌ [RELATORIO] Erro ao buscar relatório existente:', buscaError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar relatório existente',
        error: buscaError.message
      });
    }

    res.json({
      success: true,
      message: 'Proposta de email atualizada com sucesso',
      data: {
        relatorioId: resultado.id,
        cotacaoId: cotacaoIdNum,
        versao: resultado.versao,
        status: resultado.status,
        atualizadoEm: resultado.atualizado_em
      }
    });

  } catch (error: any) {
    console.error('❌ [RELATORIO] Erro ao atualizar proposta de email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route GET /api/relatorios/proposta-email/:cotacaoId
 * @desc obter proposta de email se já tiver sido gerada
 * @access public
 */
router.get('/proposta-email/:cotacaoId', async (req, res) => {
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

  console.log(`📧 [RELATORIO] Obtendo proposta de email para cotação ${cotacaoIdNum}`);

  // Buscar relatório existente
  const { data: relatorio, error: buscaError } = await supabase
    .from('relatorios')
    .select('id, proposta_email')
    .eq('cotacao_id', cotacaoIdNum)
    .single();

  if (buscaError) {
    console.error('❌ [RELATORIO] Erro ao buscar proposta de email:', buscaError);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar proposta de email',
      error: buscaError.message
    });
  }

  if (!relatorio) {
    return res.status(404).json({
      success: false,
      message: 'Proposta de email não encontrada'
    });
  }

  res.json({
    success: true,
    message: 'Proposta de email obtida com sucesso',
    data: {
      relatorioId: relatorio.id,
      propostaEmail: relatorio.proposta_email
    }
  });
});

export default router;
