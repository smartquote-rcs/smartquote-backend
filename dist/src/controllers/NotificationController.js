"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NotificationService_1 = require("../services/NotificationService");
const ProdutoService_1 = require("../services/ProdutoService");
class NotificationController {
    notificationService = new NotificationService_1.NotificationService();
    produtosService = new ProdutoService_1.ProdutosService();
    // Limiar padrão para considerar estoque baixo
    ESTOQUE_MINIMO_PADRAO = 10;
    async create(req, res) {
        try {
            const notification = req.body;
            const result = await this.notificationService.create(notification);
            return res.status(201).json({
                message: 'Notificação criada com sucesso.',
                data: result,
            });
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    async getAll(req, res) {
        try {
            const notifications = await this.notificationService.getAll();
            return res.status(200).json({
                message: 'Lista de notificações.',
                data: notifications,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const notification = await this.notificationService.getById(Number(id));
            return res.status(200).json({
                message: 'Notificação encontrada.',
                data: notification,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.notificationService.delete(Number(id));
            return res.status(200).json({ message: 'Notificação deletada com sucesso.' });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const notification = await this.notificationService.updatePartial(Number(id), updates);
            return res.status(200).json({
                message: 'Notificação atualizada com sucesso.',
                data: notification,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    /**
     * Verifica estoque baixo e cria notificações automaticamente
     */
    async verificarEstoqueBaixo(req, res) {
        try {
            const { estoqueMinimo } = req.query;
            const limiteEstoque = estoqueMinimo ? Number(estoqueMinimo) : this.ESTOQUE_MINIMO_PADRAO;
            const resultado = await this.processarEstoqueBaixo(limiteEstoque);
            return res.status(200).json({
                message: 'Verificação de estoque concluída.',
                data: {
                    produtosComEstoqueBaixo: resultado.produtosComEstoqueBaixo,
                    notificacoesCriadas: resultado.notificacoesCriadas,
                    notificacoesJaExistentes: resultado.notificacoesJaExistentes,
                    limiteUtilizado: limiteEstoque
                }
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    /**
     * Endpoint para verificação automática de estoque (para uso em cron jobs)
     */
    async verificacaoAutomatica(req, res) {
        try {
            const resultado = await this.processarEstoqueBaixo(this.ESTOQUE_MINIMO_PADRAO);
            return res.status(200).json({
                message: 'Verificação automática executada.',
                data: resultado
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    /**
     * Lógica principal para processar produtos com estoque baixo
     */
    async processarEstoqueBaixo(limiteEstoque) {
        // 1. Buscar todos os produtos
        const todosProdutos = await this.produtosService.getAll();
        // 2. Filtrar produtos com estoque baixo
        const produtosComEstoqueBaixo = todosProdutos.filter(produto => produto.estoque <= limiteEstoque);
        // 3. Buscar notificações existentes de estoque baixo
        const notificacoesExistentes = await this.notificationService.getAll();
        const notificacoesEstoque = notificacoesExistentes.filter(notif => notif.type === 'estoque_baixo');
        let notificacoesCriadas = 0;
        let notificacoesJaExistentes = 0;
        // 4. Para cada produto com estoque baixo, verificar se já existe notificação
        for (const produto of produtosComEstoqueBaixo) {
            const jaExisteNotificacao = notificacoesEstoque.some(notif => notif.subject.includes(`Produto ID: ${produto.id}`) ||
                notif.subject.includes(produto.nome));
            if (!jaExisteNotificacao) {
                // Criar nova notificação
                const novaNotificacao = {
                    title: 'Alerta: Estoque Baixo',
                    subject: `Estoque baixo - ${produto.nome} (ID: ${produto.id})`,
                    type: 'estoque_baixo',
                    url_redir: `/produtos/${produto.id}`
                };
                await this.notificationService.create(novaNotificacao);
                notificacoesCriadas++;
                console.log(`🔔 Notificação criada para produto: ${produto.nome} (Estoque: ${produto.estoque})`);
            }
            else {
                notificacoesJaExistentes++;
            }
        }
        return {
            produtosComEstoqueBaixo: produtosComEstoqueBaixo.length,
            notificacoesCriadas,
            notificacoesJaExistentes,
            produtos: produtosComEstoqueBaixo.map(p => ({
                id: p.id,
                nome: p.nome,
                estoque: p.estoque,
                codigo: p.codigo
            }))
        };
    }
    /**
     * Limpar notificações antigas de estoque baixo (produtos que já foram reabastecidos)
     */
    async limparNotificacoesObsoletas(req, res) {
        try {
            const { estoqueMinimo } = req.query;
            const limiteEstoque = estoqueMinimo ? Number(estoqueMinimo) : this.ESTOQUE_MINIMO_PADRAO;
            // Buscar todas as notificações de estoque baixo
            const todasNotificacoes = await this.notificationService.getAll();
            const notificacoesEstoque = todasNotificacoes.filter(notif => notif.type === 'estoque_baixo');
            // Buscar todos os produtos
            const todosProdutos = await this.produtosService.getAll();
            let notificacoesRemovidas = 0;
            // Para cada notificação de estoque, verificar se o produto ainda tem estoque baixo
            for (const notificacao of notificacoesEstoque) {
                // Extrair ID do produto da notificação
                const matchId = notificacao.subject.match(/ID:\s*(\d+)/);
                if (matchId) {
                    const produtoId = Number(matchId[1]);
                    const produto = todosProdutos.find(p => p.id === produtoId);
                    // Se produto não existe ou estoque foi normalizado
                    if (!produto || produto.estoque > limiteEstoque) {
                        await this.notificationService.delete(notificacao.id);
                        notificacoesRemovidas++;
                        console.log(`🗑️ Notificação removida para produto ID: ${produtoId}`);
                    }
                }
            }
            return res.status(200).json({
                message: 'Limpeza de notificações concluída.',
                data: {
                    notificacoesRemovidas,
                    limiteUtilizado: limiteEstoque
                }
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}
exports.default = new NotificationController();
//# sourceMappingURL=NotificationController.js.map