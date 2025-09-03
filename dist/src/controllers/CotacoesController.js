"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CotacoesService_1 = __importDefault(require("../services/CotacoesService"));
const CotacaoSchema_1 = require("../schemas/CotacaoSchema");
const CotacaoNotificationService_1 = __importDefault(require("../services/CotacaoNotificationService"));
class CotacoesController {
    async create(req, res) {
        // compat: aceitar camelCase e converter
        const body = { ...req.body };
        if (body.promptId && !body.prompt_id)
            body.prompt_id = body.promptId;
        if (body.aprovadoPor && !body.aprovado_por)
            body.aprovado_por = body.aprovadoPor;
        if (body.orcamentoGeral && !body.orcamento_geral)
            body.orcamento_geral = body.orcamentoGeral;
        if (body.dataAprovacao && !body.data_aprovacao)
            body.data_aprovacao = body.dataAprovacao;
        if (body.dataSolicitacao && !body.data_solicitacao)
            body.data_solicitacao = body.dataSolicitacao;
        if (body.prazoValidade && !body.prazo_validade)
            body.prazo_validade = body.prazoValidade;
        // mapear status antigo -> novo
        if (body.status && ['pendente', 'aceite', 'recusado'].includes(body.status)) {
            body.status = body.status === 'aceite' ? 'completa' : 'incompleta';
        }
        const parsed = CotacaoSchema_1.cotacaoSchema.safeParse(body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({ errors });
        }
        try {
            const cotacao = await CotacoesService_1.default.create(parsed.data);
            // Criar notificação para nova cotação
            try {
                await CotacaoNotificationService_1.default.processarNotificacaoCotacao(cotacao, 'criada');
            }
            catch (notifError) {
                console.error('Erro ao criar notificação de cotação criada:', notifError);
                // Não quebra o fluxo principal, apenas loga o erro
            }
            return res.status(201).json({
                message: 'Cotação cadastrada com sucesso.',
                data: cotacao,
            });
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    async getAll(req, res) {
        try {
            const cotacoes = await CotacoesService_1.default.getAll();
            return res.status(200).json({
                message: 'Lista de cotações.',
                data: cotacoes,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const cotacao = await CotacoesService_1.default.getById(Number(id));
            return res.status(200).json({
                message: 'Cotação encontrada.',
                data: cotacao,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            // Buscar cotação antes de deletar para notificações
            let cotacaoParaDeletar;
            try {
                cotacaoParaDeletar = await CotacoesService_1.default.getById(Number(id));
            }
            catch (error) {
                // Se não encontrou a cotação, continua com a deleção
                console.warn('Cotação não encontrada para notificação de deleção:', id);
            }
            await CotacoesService_1.default.delete(Number(id));
            // Criar notificação de deleção se conseguiu buscar a cotação
            if (cotacaoParaDeletar) {
                try {
                    await CotacaoNotificationService_1.default.processarNotificacaoCotacao(cotacaoParaDeletar, 'deletada');
                }
                catch (notifError) {
                    console.error('Erro ao criar notificação de cotação deletada:', notifError);
                    // Não quebra o fluxo principal, apenas loga o erro
                }
            }
            return res.status(200).json({ message: 'Cotação deletada com sucesso.' });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async patch(req, res) {
        try {
            const { id } = req.params;
            const updates = { ...req.body };
            if (updates.promptId && !updates.prompt_id)
                updates.prompt_id = updates.promptId;
            if (updates.aprovadoPor && !updates.aprovado_por)
                updates.aprovado_por = updates.aprovadoPor;
            if (updates.orcamentoGeral && !updates.orcamento_geral)
                updates.orcamento_geral = updates.orcamentoGeral;
            if (updates.dataAprovacao && !updates.data_aprovacao)
                updates.data_aprovacao = updates.dataAprovacao;
            if (updates.dataSolicitacao && !updates.data_solicitacao)
                updates.data_solicitacao = updates.dataSolicitacao;
            if (updates.prazoValidade && !updates.prazo_validade)
                updates.prazo_validade = updates.prazoValidade;
            if (updates.status && ['pendente', 'aceite', 'recusado'].includes(updates.status)) {
                updates.status = updates.status === 'aceite' ? 'completa' : 'incompleta';
            }
            // Lógica de aprovação baseada em boolean "aprovacao" com regra de permissões por perfil
            if (Object.prototype.hasOwnProperty.call(updates, 'aprovacao')) {
                const aprov = updates.aprovacao === true || updates.aprovacao === 'true';
                // Capturar usuário logado (enviado pelo frontend via aprovado_por ou em middleware futuro)
                const usuarioId = updates.aprovado_por || req.user?.id || req.userId;
                let usuarioRole = req.user?.role || req.userRole || updates.user_role;
                const usuarioPosition = req.user?.position;
                // fallback adicional: se não veio role, tentar extrair de posição/position enviada ou armazenada
                if (!usuarioRole) {
                    usuarioRole = updates.position || updates.posicao || updates.perfil;
                }
                // Se ainda não temos role e temos usuarioId, tentar buscar usuário (best-effort, sem quebrar se falhar)
                if (!usuarioRole && usuarioId) {
                    try {
                        // lazy import para evitar ciclo
                        const userSvc = require('../services/UserService').default;
                        const u = await userSvc.getById(String(usuarioId));
                        usuarioRole = u?.position || u?.role || u?.function;
                    }
                    catch { }
                }
                const LIMITE_MANAGER = 50_000_000;
                // Obter valor referência da cotação (para qualquer decisão) se necessário
                let valorReferencia = updates.orcamento_geral;
                if (valorReferencia == null) {
                    try {
                        const atual = await CotacoesService_1.default.getById(Number(id));
                        valorReferencia = atual?.orcamento_geral ?? atual?.valor;
                    }
                    catch { }
                }
                const numeroValor = Number(valorReferencia) || 0;
                const acao = aprov ? 'aprovar' : 'rejeitar';
                let permitido = false;
                if (usuarioRole === 'admin') {
                    permitido = true;
                }
                else if (usuarioRole === 'manager') {
                    permitido = numeroValor < LIMITE_MANAGER;
                }
                else {
                    permitido = false;
                }
                console.log('[CotacoesController.patch] decisão de aprovação/rejeição', { id, usuarioId, usuarioRole, usuarioPosition, numeroValor, aprov });
                if (!permitido) {
                    console.warn('Permissão negada aprovação/rejeição', {
                        cotacaoId: id,
                        usuarioId,
                        usuarioRole,
                        usuarioPosition,
                        numeroValor,
                        limite: LIMITE_MANAGER,
                        acao
                    });
                    return res.status(403).json({ error: `Usuário sem permissão para ${acao} esta cotação (perfil ou valor excede limite para manager).` });
                }
                if (aprov) {
                    updates.status = 'completa';
                    updates.data_aprovacao = new Date().toISOString();
                    if (usuarioId)
                        updates.aprovado_por = usuarioId;
                }
                else {
                    updates.status = 'incompleta';
                    updates.data_aprovacao = null;
                    if (usuarioId && !updates.aprovado_por)
                        updates.aprovado_por = usuarioId;
                }
            }
            // Buscar cotação antes de atualizar para comparação
            let cotacaoAnterior;
            try {
                cotacaoAnterior = await CotacoesService_1.default.getById(Number(id));
            }
            catch (error) {
                console.warn('Cotação não encontrada para comparação de mudanças:', id);
            }
            const cotacaoAtualizada = await CotacoesService_1.default.updatePartial(Number(id), updates);
            // Processar notificações baseadas em mudanças
            if (cotacaoAnterior && cotacaoAtualizada) {
                try {
                    await CotacaoNotificationService_1.default.analisarENotificarMudancas(cotacaoAnterior, cotacaoAtualizada);
                }
                catch (notifError) {
                    console.error('Erro ao processar notificações de mudanças na cotação:', notifError);
                    // Não quebra o fluxo principal, apenas loga o erro
                }
            }
            return res.status(200).json({
                message: 'Cotação atualizada com sucesso.',
                data: cotacaoAtualizada,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    /**
     * Remove um elemento específico do campo faltantes da cotação
     */
    async removeFaltante(req, res) {
        try {
            const { id } = req.params;
            const { index, query, nome } = req.body;
            if (index === undefined && !query && !nome) {
                return res.status(400).json({
                    error: 'É necessário fornecer index, query ou nome para identificar o elemento a ser removido'
                });
            }
            const cotacao = await CotacoesService_1.default.getById(Number(id));
            if (!cotacao) {
                return res.status(404).json({ error: 'Cotação não encontrada' });
            }
            const faltantesAtuais = Array.isArray(cotacao.faltantes) ? cotacao.faltantes : [];
            let novosFaltantes = [...faltantesAtuais];
            let elementoRemovido = null;
            if (index !== undefined) {
                // Remover por índice
                if (index >= 0 && index < novosFaltantes.length) {
                    elementoRemovido = novosFaltantes.splice(index, 1)[0];
                }
                else {
                    return res.status(400).json({ error: 'Índice inválido' });
                }
            }
            else if (query) {
                // Remover por query sugerida
                const indexToRemove = novosFaltantes.findIndex((faltante) => faltante.query_sugerida && faltante.query_sugerida.toLowerCase().includes(query.toLowerCase()));
                if (indexToRemove !== -1) {
                    elementoRemovido = novosFaltantes.splice(indexToRemove, 1)[0];
                }
            }
            else if (nome) {
                // Remover por nome
                const indexToRemove = novosFaltantes.findIndex((faltante) => faltante.nome && faltante.nome.toLowerCase().includes(nome.toLowerCase()));
                if (indexToRemove !== -1) {
                    elementoRemovido = novosFaltantes.splice(indexToRemove, 1)[0];
                }
            }
            if (!elementoRemovido) {
                return res.status(404).json({ error: 'Elemento não encontrado nos faltantes' });
            }
            // Atualizar status se necessário
            const novoStatus = novosFaltantes.length === 0 ? 'completa' : 'incompleta';
            const cotacaoAtualizada = await CotacoesService_1.default.updatePartial(Number(id), {
                faltantes: novosFaltantes,
                status: novoStatus
            });
            return res.status(200).json({
                message: 'Elemento removido dos faltantes com sucesso.',
                data: {
                    elementoRemovido,
                    faltantesRestantes: novosFaltantes.length,
                    novoStatus,
                    cotacao: cotacaoAtualizada
                }
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}
exports.default = new CotacoesController();
//# sourceMappingURL=CotacoesController.js.map