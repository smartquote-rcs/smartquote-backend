"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ProdutoService_1 = require("../services/ProdutoService");
const ProdutoSchema_1 = require("../schemas/ProdutoSchema");
const connect_1 = __importDefault(require("../infra/supabase/connect"));
const AuditLogHelper_1 = require("../utils/AuditLogHelper");
const produtosService = new ProdutoService_1.ProdutosService();
class ProdutosController {
    async create(req, res) {
        // normaliza fornecedorId -> fornecedor_id para compatibilidade
        const body = { ...req.body };
        if (body.fornecedorId && !body.fornecedor_id)
            body.fornecedor_id = body.fornecedorId;
        const parsed = ProdutoSchema_1.produtoSchema.safeParse(body);
        if (!parsed.success) {
            const errors = parsed.error.format();
            return res.status(400).json({ errors });
        }
        try {
            const produto = await produtosService.create(parsed.data);
            // Log de auditoria: Criação de produto
            const userId = req.user?.id || 'system';
            if (produto) {
                AuditLogHelper_1.auditLog.logCreate(userId, 'produtos', produto.id, {
                    nome: produto.nome,
                    preco: produto.preco,
                    fornecedor_id: produto.fornecedor_id
                }).catch(console.error);
            }
            return res.status(201).json({
                message: 'Produto cadastrado com sucesso.',
                data: produto,
            });
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    async getAll(req, res) {
        try {
            const produtos = await produtosService.getAll();
            return res.status(200).json({
                message: 'Lista de produtos.',
                data: produtos,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const produto = await produtosService.getById(Number(id));
            return res.status(200).json({
                message: 'Produto encontrado.',
                data: produto,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || 'system';
            // Buscar produto antes de deletar
            let produtoParaDeletar;
            try {
                produtoParaDeletar = await produtosService.getById(Number(id));
            }
            catch (error) {
                console.warn('Produto não encontrado para log:', id);
            }
            await produtosService.delete(Number(id));
            // Log de auditoria: Deleção de produto
            AuditLogHelper_1.auditLog.logDelete(userId, 'produtos', Number(id), produtoParaDeletar ? {
                nome: produtoParaDeletar.nome,
                preco: produtoParaDeletar.preco
            } : undefined).catch(console.error);
            return res.status(200).json({ message: 'Produto deletado com sucesso.' });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async patch(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || 'system';
            const updates = { ...req.body };
            if (updates.fornecedorId && !updates.fornecedor_id)
                updates.fornecedor_id = updates.fornecedorId;
            // Buscar dados antigos
            let oldData;
            try {
                oldData = await produtosService.getById(Number(id));
            }
            catch (error) {
                console.warn('Produto não encontrado para log de update:', id);
            }
            const produtoAtualizado = await produtosService.updatePartial(Number(id), updates);
            // Log de auditoria: Atualização de produto
            AuditLogHelper_1.auditLog.logUpdate(userId, 'produtos', Number(id), oldData ? {
                nome: oldData.nome,
                preco: oldData.preco,
                estoque: oldData.estoque
            } : undefined, updates).catch(console.error);
            return res.status(200).json({
                message: 'Produto atualizado com sucesso.',
                data: produtoAtualizado,
            });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    /**
     * Upload de imagem de produto para o bucket do Supabase Storage.
     * Campo do formulário: 'imagem'
     * Retorna: { url: string }
     */
    async uploadImagem(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Arquivo não enviado (campo esperado: imagem).' });
            }
            const bucket = process.env.SUPABASE_BUCKET_PRODUTOS || 'produtos';
            const file = req.file;
            // validações simples
            const mimeOk = /^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype);
            if (!mimeOk) {
                return res.status(400).json({ error: 'Tipo de arquivo inválido. Use png, jpg, jpeg, webp ou gif.' });
            }
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSize) {
                return res.status(400).json({ error: 'Arquivo excede 2MB.' });
            }
            // gera caminho único
            const ext = file.originalname.split('.').pop()?.toLowerCase() || 'png';
            const nomeSeguro = file.originalname
                .replace(/[^a-zA-Z0-9_.-]/g, '_')
                .replace(/_{2,}/g, '_')
                .slice(0, 40);
            const path = `produtos/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${nomeSeguro}.${ext}`;
            const { error: uploadError } = await connect_1.default.storage
                .from(bucket)
                .upload(path, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });
            if (uploadError) {
                return res.status(500).json({ error: 'Falha ao enviar imagem', detalhe: uploadError.message });
            }
            const { data: publicData } = connect_1.default.storage.from(bucket).getPublicUrl(path);
            if (!publicData || !publicData.publicUrl) {
                return res.status(500).json({ error: 'Não foi possível obter URL pública.' });
            }
            return res.status(201).json({ url: publicData.publicUrl });
        }
        catch (err) {
            return res.status(500).json({ error: err.message || 'Erro interno no upload.' });
        }
    }
}
exports.default = new ProdutosController();
//# sourceMappingURL=ProdutosController.js.map