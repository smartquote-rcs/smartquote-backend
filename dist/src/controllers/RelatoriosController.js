"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RelatorioService_1 = __importDefault(require("../services/RelatorioService"));
const connect_1 = __importDefault(require("../infra/supabase/connect"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class RelatoriosController {
    static async gerarRelatorio(req, res) {
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
            const pdfBuffer = await RelatorioService_1.default.gerarRelatorioParaDownload(cotacaoIdNum);
            // Configurar headers para download do PDF
            const fileName = `relatorio_cotacao_${cotacaoIdNum}_${Date.now()}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            // Enviar o PDF diretamente
            res.send(pdfBuffer);
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao gerar relatório', error: error.message });
        }
    }
    static async downloadRelatorio(req, res) {
        try {
            const { filename } = req.params;
            if (!filename) {
                return res.status(400).json({ success: false, message: 'Nome do arquivo é obrigatório' });
            }
            const decodedFilename = decodeURIComponent(filename);
            const filePath = path_1.default.join(process.cwd(), 'temp', decodedFilename);
            if (!fs_1.default.existsSync(filePath)) {
                return res.status(404).json({ success: false, message: 'Arquivo não encontrado' });
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${decodedFilename}"`);
            const fileStream = fs_1.default.createReadStream(filePath);
            fileStream.pipe(res);
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao fazer download', error: error.message });
        }
    }
    static async statusRelatorio(req, res) {
        try {
            const { cotacaoId } = req.params;
            if (!cotacaoId) {
                return res.status(400).json({ success: false, message: 'ID da cotação é obrigatório' });
            }
            const cotacaoIdNum = parseInt(cotacaoId);
            if (isNaN(cotacaoIdNum)) {
                return res.status(400).json({ success: false, message: 'ID da cotação deve ser um número válido' });
            }
            const { data: cotacao, error } = await connect_1.default
                .from('cotacoes')
                .select('status, orcamento_geral, relatorio_path, relatorio_gerado_em')
                .eq('id', cotacaoIdNum)
                .single();
            if (error || !cotacao) {
                return res.status(404).json({ success: false, message: 'Cotação não encontrada' });
            }
            const { data: relatoriosData, error: relatoriosError } = await connect_1.default
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao verificar status', error: error.message });
        }
    }
    static async listarRelatorios(req, res) {
        try {
            const { cotacaoId } = req.params;
            if (!cotacaoId) {
                return res.status(400).json({ success: false, message: 'ID da cotação é obrigatório' });
            }
            const cotacaoIdNum = parseInt(cotacaoId);
            if (isNaN(cotacaoIdNum)) {
                return res.status(400).json({ success: false, message: 'ID da cotação deve ser um número válido' });
            }
            const { data: cotacao, error } = await connect_1.default
                .from('cotacoes')
                .select(`id, status, orcamento_geral, relatorio_path, relatorio_gerado_em, prompt_id, created_at`)
                .eq('id', cotacaoIdNum)
                .single();
            if (error || !cotacao) {
                return res.status(404).json({ success: false, message: 'Cotação não encontrada' });
            }
            let prompt = null;
            if (cotacao.prompt_id) {
                const { data: promptData } = await connect_1.default
                    .from('prompts')
                    .select('texto_original, dados_extraidos')
                    .eq('id', cotacao.prompt_id)
                    .single();
                prompt = promptData;
            }
            const { data: relatoriosData, error: relatoriosError } = await connect_1.default
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao listar relatórios', error: error.message });
        }
    }
    static async atualizarPropostaEmail(req, res) {
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
            const { data: cotacao, error: cotacaoError } = await connect_1.default
                .from('cotacoes')
                .select('id')
                .eq('id', cotacaoIdNum)
                .single();
            if (cotacaoError || !cotacao) {
                return res.status(404).json({ success: false, message: 'Cotação não encontrada' });
            }
            const { data: relatorioExistente, error: buscaError } = await connect_1.default
                .from('relatorios')
                .select('id, versao')
                .eq('cotacao_id', cotacaoIdNum)
                .order('id', { ascending: false })
                .limit(1)
                .single();
            let resultado;
            if (buscaError && buscaError.code === 'PGRST116') {
                const { data, error } = await connect_1.default
                    .from('relatorios')
                    .insert({ cotacao_id: cotacaoIdNum, proposta_email: propostaEmail, status: 'rascunho', versao: 1 })
                    .select()
                    .single();
                if (error) {
                    return res.status(500).json({ success: false, message: 'Erro ao criar relatório com proposta de email', error: error.message });
                }
                resultado = data;
            }
            else if (relatorioExistente) {
                const { data, error } = await connect_1.default
                    .from('relatorios')
                    .update({ proposta_email: propostaEmail, atualizado_em: new Date().toISOString() })
                    .eq('id', relatorioExistente.id)
                    .select()
                    .single();
                if (error) {
                    return res.status(500).json({ success: false, message: 'Erro ao atualizar proposta de email', error: error.message });
                }
                resultado = data;
            }
            else {
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
        }
    }
    static async obterPropostaEmail(req, res) {
        const { cotacaoId } = req.params;
        if (!cotacaoId) {
            return res.status(400).json({ success: false, message: 'ID da cotação é obrigatório' });
        }
        const cotacaoIdNum = parseInt(cotacaoId);
        if (isNaN(cotacaoIdNum)) {
            return res.status(400).json({ success: false, message: 'ID da cotação deve ser um número válido' });
        }
        const { data: relatorio, error: buscaError } = await connect_1.default
            .from('relatorios')
            .select('id, proposta_email')
            .eq('cotacao_id', cotacaoIdNum)
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
}
exports.default = RelatoriosController;
//# sourceMappingURL=RelatoriosController.js.map