import { Request, Response } from 'express';
import RelatorioService from '../services/RelatorioService';
import { ExportService } from '../services/relatorio/ExportService';
import supabase from '../infra/supabase/connect';
import fs from 'fs';
import path from 'path';

export default class RelatoriosController {
  private static exportService = new ExportService();

  static async gerarRelatorio(req: Request, res: Response) {
    try {
      const { cotacaoId } = req.params;
      if (!cotacaoId) {
        return res.status(400).json({ success: false, message: 'ID da cotação é obrigatório' });
      }
      const cotacaoIdNum = parseInt(cotacaoId);
      if (isNaN(cotacaoIdNum)) {
        return res.status(400).json({ success: false, message: 'ID da cotação deve ser um número válido' });
      }
      
      // Gerar o relatório diretamente no buffer para download
      const pdfBuffer = await RelatorioService.gerarRelatorioParaDownload(cotacaoIdNum);
      
      // Configurar headers para download do PDF
      const fileName = `relatorio_cotacao_${cotacaoIdNum}_${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Enviar o PDF diretamente
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro ao gerar relatório', error: error.message });
    }
  }

  static async downloadRelatorio(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      if (!filename) {
        return res.status(400).json({ success: false, message: 'Nome do arquivo é obrigatório' });
      }
      const decodedFilename = decodeURIComponent(filename);
      const filePath = path.join(process.cwd(), 'temp', decodedFilename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'Arquivo não encontrado' });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${decodedFilename}"`);
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro ao fazer download', error: error.message });
    }
  }

  static async statusRelatorio(req: Request, res: Response) {
    try {
      const { cotacaoId } = req.params;
      if (!cotacaoId) {
        return res.status(400).json({ success: false, message: 'ID da cotação é obrigatório' });
      }
      const cotacaoIdNum = parseInt(cotacaoId);
      if (isNaN(cotacaoIdNum)) {
        return res.status(400).json({ success: false, message: 'ID da cotação deve ser um número válido' });
      }
      const { data: cotacao, error } = await supabase
        .from('cotacoes')
        .select('status, orcamento_geral, relatorio_path, relatorio_gerado_em')
        .eq('id', cotacaoIdNum)
        .single();
      if (error || !cotacao) {
        return res.status(404).json({ success: false, message: 'Cotação não encontrada' });
      }
      // Buscar analise_web dos itens individuais da cotação
      const { data: itensComAnaliseWeb, error: itensWebError } = await supabase
        .from('cotacoes_itens')
        .select('analise_web')
        .eq('cotacao_id', cotacaoIdNum)
        .not('analise_web', 'is', null);

      // Buscar analise_local dos itens individuais da cotação
      const { data: itensComAnaliseLocal, error: itensLocalError } = await supabase
        .from('cotacoes_itens')
        .select('analise_local')
        .eq('cotacao_id', cotacaoIdNum)
        .not('analise_local', 'is', null);
      
      let temAnalises = false;
      let statusAnalises = 'sem_dados';
      let totalAnaliseWeb = 0;
      let totalAnaliseLocal = 0;
      
      // Contar analise_local dos itens individuais
      if (!itensLocalError && itensComAnaliseLocal) {
        totalAnaliseLocal = itensComAnaliseLocal.length;
        temAnalises = true;
      }
      
      // Contar analise_web dos itens individuais
      if (!itensWebError && itensComAnaliseWeb) {
        totalAnaliseWeb = itensComAnaliseWeb.length;
        temAnalises = true;
      }
      
      const estaPronta = cotacao.status === 'completa' || cotacao.status === 'incompleta';
      const temRelatorio = cotacao.relatorio_path && cotacao.relatorio_gerado_em;
      const podeGerar = estaPronta && temAnalises;
      
      res.json({
        success: true,
        data: {
          cotacao_id: cotacaoIdNum,
          status: cotacao.status,
          orcamento_geral: cotacao.orcamento_geral,
          relatorio_path: cotacao.relatorio_path,
          relatorio_gerado_em: cotacao.relatorio_gerado_em,
          tem_relatorio: temRelatorio,
          pode_gerar: podeGerar,
          tem_analises: temAnalises,
          status_analises: statusAnalises,
          total_analise_local: totalAnaliseLocal,
          total_analise_web: totalAnaliseWeb
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro ao verificar status do relatório', error: error.message });
    }
  }

  static async listarRelatorios(req: Request, res: Response) {
    try {
      const { cotacaoId } = req.params;
      if (!cotacaoId) {
        return res.status(400).json({ success: false, message: 'ID da cotação é obrigatório' });
      }
      const cotacaoIdNum = parseInt(cotacaoId);
      if (isNaN(cotacaoIdNum)) {
        return res.status(400).json({ success: false, message: 'ID da cotação deve ser um número válido' });
      }
      const { data: cotacao, error } = await supabase
        .from('cotacoes')
        .select(`id, status, orcamento_geral, relatorio_path, relatorio_gerado_em, prompt_id, created_at`)
        .eq('id', cotacaoIdNum)
        .single();
      if (error || !cotacao) {
        return res.status(404).json({ success: false, message: 'Cotação não encontrada' });
      }
      let prompt = null;
      if (cotacao.prompt_id) {
        const { data: promptData } = await supabase
          .from('prompts')
          .select('texto_original, dados_extraidos')
          .eq('id', cotacao.prompt_id)
          .single();
        prompt = promptData;
      }
      const { data: relatoriosData, error: relatoriosError } = await supabase
        .from('relatorios')
        .select('id, status, versao, criado_em, atualizado_em, analise_local')
        .eq('cotacao_id', cotacaoIdNum)
        .order('id', { ascending: false });
      
      // Buscar analise_web dos itens individuais da cotação
      const { data: itensComRelatorio, error: itensError } = await supabase
        .from('cotacoes_itens')
        .select('relatorio')
        .eq('cotacao_id', cotacaoIdNum)
        .not('relatorio', 'is', null);
      
      let analisesSummary = {
        totalAnalises: 0,
        analiseLocal: 0,
        analiseWeb: 0,
        ultimaAtualizacao: null
      };
      
      if (!relatoriosError && relatoriosData && relatoriosData.length > 0) {
        const ultimoRelatorio = relatoriosData[0];
        const analiseLocal = Array.isArray(ultimoRelatorio?.analise_local) ? ultimoRelatorio.analise_local : [];
        
        // Contar analise_web dos itens individuais
        let totalAnaliseWeb = 0;
        if (!itensError && itensComRelatorio) {
          for (const item of itensComRelatorio) {
            if (item.relatorio && Array.isArray(item.relatorio)) {
              totalAnaliseWeb += item.relatorio.length;
            }
          }
        }
        
        analisesSummary = {
          totalAnalises: analiseLocal.length + totalAnaliseWeb,
          analiseLocal: analiseLocal.length,
          analiseWeb: totalAnaliseWeb,
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
      res.status(500).json({ success: false, message: 'Erro ao listar relatórios', error: error.message });
    }
  }

  static async atualizarPropostaEmail(req: Request, res: Response) {
    try {
      const { cotacaoId } = req.params;
      const { propostaEmail } = req.body;
      if (!cotacaoId) {
        return res.status(400).json({ success: false, message: 'ID da cotação é obrigatório' });
      }
      if (!propostaEmail) {
        return res.status(400).json({ success: false, message: 'Conteúdo da proposta de email é obrigatório' });
      }
      const cotacaoIdNum = parseInt(cotacaoId);
      if (isNaN(cotacaoIdNum)) {
        return res.status(400).json({ success: false, message: 'ID da cotação deve ser um número válido' });
      }
      const { data: cotacao, error: cotacaoError } = await supabase
        .from('cotacoes')
        .select('id')
        .eq('id', cotacaoIdNum)
        .single();
      if (cotacaoError || !cotacao) {
        return res.status(404).json({ success: false, message: 'Cotação não encontrada' });
      }
      const { data: relatorioExistente, error: buscaError } = await supabase
        .from('relatorios')
        .select('id, versao')
        .eq('cotacao_id', cotacaoIdNum)
        .order('id', { ascending: false })
        .limit(1)
        .single();
      let resultado;
      if (buscaError && buscaError.code === 'PGRST116') {
        const { data, error } = await supabase
          .from('relatorios')
          .insert({ cotacao_id: cotacaoIdNum, proposta_email: propostaEmail, status: 'rascunho', versao: 1 })
          .select()
          .single();
        if (error) {
          return res.status(500).json({ success: false, message: 'Erro ao criar relatório com proposta de email', error: error.message });
        }
        resultado = data;
      } else if (relatorioExistente) {
        const { data, error } = await supabase
          .from('relatorios')
          .update({ proposta_email: propostaEmail, atualizado_em: new Date().toISOString() })
          .eq('id', relatorioExistente.id)
          .select()
          .single();
        if (error) {
          return res.status(500).json({ success: false, message: 'Erro ao atualizar proposta de email', error: error.message });
        }
        resultado = data;
      } else {
        return res.status(500).json({ success: false, message: 'Erro ao verificar relatório existente', error: buscaError.message });
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
      res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
  }

  static async obterPropostaEmail(req: Request, res: Response) {
    const { cotacaoId } = req.params;
    if (!cotacaoId) {
      return res.status(400).json({ success: false, message: 'ID da cotação é obrigatório' });
    }
    const cotacaoIdNum = parseInt(cotacaoId);
    if (isNaN(cotacaoIdNum)) {
      return res.status(400).json({ success: false, message: 'ID da cotação deve ser um número válido' });
    }
    const { data: relatorio, error: buscaError } = await supabase
      .from('relatorios')
      .select('id, proposta_email')
      .eq('cotacao_id', cotacaoIdNum)
      .order('id', { ascending: false })
      .limit(1)
      .single();
    if (buscaError) {
      return res.status(500).json({ success: false, message: 'Erro ao buscar proposta de email', error: buscaError.message });
    }
    if (!relatorio) {
      return res.status(404).json({ success: false, message: 'Proposta de email não encontrada' });
    }
    res.json({
      success: true,
      message: 'Proposta de email obtida com sucesso',
      data: {
        relatorioId: relatorio.id,
        propostaEmail: relatorio.proposta_email
      }
    });
  }

  /**
   * Gera e faz download direto do relatório em formato CSV
   */
  static async gerarRelatorioCSV(req: Request, res: Response) {
    try {
      const { cotacaoId } = req.params;
      if (!cotacaoId) {
        return res.status(400).json({ success: false, message: 'ID da cotação é obrigatório' });
      }
      const cotacaoIdNum = parseInt(cotacaoId);
      if (isNaN(cotacaoIdNum)) {
        return res.status(400).json({ success: false, message: 'ID da cotação deve ser um número válido' });
      }
      
      // Gerar o relatório CSV
      const csvContent = await RelatoriosController.exportService.gerarCSV(cotacaoIdNum);
      
      // Configurar headers para download do CSV
      const fileName = `relatorio_cotacao_${cotacaoIdNum}_${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Adicionar BOM para UTF-8 (para Excel) e enviar o CSV
      const csvWithBOM = '\uFEFF' + csvContent;
      res.send(csvWithBOM);
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao gerar relatório CSV', 
        error: error.message 
      });
    }
  }

  /**
   * Gera e faz download direto do relatório em formato XLSX
   */
  static async gerarRelatorioXLSX(req: Request, res: Response) {
    try {
      const { cotacaoId } = req.params;
      if (!cotacaoId) {
        return res.status(400).json({ success: false, message: 'ID da cotação é obrigatório' });
      }
      const cotacaoIdNum = parseInt(cotacaoId);
      if (isNaN(cotacaoIdNum)) {
        return res.status(400).json({ success: false, message: 'ID da cotação deve ser um número válido' });
      }
      
      // Gerar o relatório XLSX
      const xlsxBuffer = await RelatoriosController.exportService.gerarXLSX(cotacaoIdNum);
      
      // Configurar headers para download do XLSX
      const fileName = `relatorio_cotacao_${cotacaoIdNum}_${Date.now()}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', xlsxBuffer.length);
      
      // Enviar o XLSX diretamente
      res.send(xlsxBuffer);
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao gerar relatório XLSX', 
        error: error.message 
      });
    }
  }
}
