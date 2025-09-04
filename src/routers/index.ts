import {Router} from "express";
import authRouter from "./auth.route";
import { authMiddleware } from "../middleware/authMiddleware";
import produtosRoutes from "./produtos.routes";
import fornecedoresRoutes from "./fornecedores.routes";
import cotacoesRoutes from "./cotacoes.routes";
import userRouter from "./users.route";
import buscaRouter from "./busca.routes";
import testRouter from "./test.routes";
import emailRouter from "./email.routes";
import geminiRouter from "./gemini.routes";
import notificationsRouter from "./notifications.routes";
import dynamicsRouter from "./dynamics.routes";
import { ProdutosService } from '../services/ProdutoService';
import supabase from '../infra/supabase/connect';
import buscaLocalRouter from './buscaLocal.routes';
import promptsRouter from './prompts.routes';
import cotacoesItensRouter from './cotacoesItens.routes';
import relatorioRouter from './relatorios.routes';
import usersUpsertRouter from './usersUpsert.routes';
import sistemaRouter from './sistema.routes';
const routers = Router();
const produtosService = new ProdutosService();

routers.get("/",(req, res)=>{
    res.status(200).json("APi SmartQuote ON...");
});
routers.head("/",(req, res)=>{
    res.status(200).json("APi SmartQuote ON...");
});
routers.use("/test", testRouter);
routers.use("/auth", authRouter);
routers.use("/sistema", sistemaRouter);
routers.use("/users",authMiddleware, userRouter);
routers.use('/produtos',authMiddleware, produtosRoutes);
routers.use('/fornecedores', fornecedoresRoutes);
routers.use('/suppliers', fornecedoresRoutes);
//routers.use('/cotacoes',authMiddleware, cotacoesRoutes);
routers.use('/cotacoes', cotacoesRoutes);
routers.use('/cotacoes-itens', cotacoesItensRouter);
//routers.use('/busca-automatica',authMiddleware, buscaRouter);
routers.use('/busca-automatica', buscaRouter);
routers.use('/email', emailRouter);
routers.use('/gemini', geminiRouter);
routers.use('/busca-local', buscaLocalRouter);
routers.use('/busca', buscaLocalRouter); // Mantém ambas as rotas para compatibilidade
routers.use('/notifications', notificationsRouter); // Removido authMiddleware temporariamente para testes
routers.use('/dynamics', dynamicsRouter); // Remove authMiddleware para permitir testes diretos
routers.use('/prompts', promptsRouter);
routers.use('/relatorios', relatorioRouter);
routers.use('/users-public', usersUpsertRouter); // rota pública para upsert mínimo

// Rotas públicas RESTful para products (compatível com frontend)
// GET /api/products
routers.get('/products', async (req, res) => {
    try {
        const produtos = await produtosService.getAll();
        res.status(200).json({ data: produtos });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        res.status(500).json({ error: errorMsg });
    }
});
// GET /api/products/:id
routers.get('/products/:id', async (req, res) => {
    try {
        const produto = await produtosService.getById(Number(req.params.id));
        if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
        res.status(200).json({ data: produto });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        res.status(500).json({ error: errorMsg });
    }
});
// POST /api/products
routers.post('/products', async (req, res) => {
    try {
        const body = { ...req.body } as any;
        // Normaliza campo fornecedorId -> fornecedor_id e remove a chave original
        if (body.fornecedorId && !body.fornecedor_id) {
            body.fornecedor_id = body.fornecedorId;
            delete body.fornecedorId; // evita erro: column "fornecedorId" does not exist
        }
    // Fallback de auditoria: se não veio ou veio inválido, usa 1 (admin padrão)
    if (!body.cadastrado_por || isNaN(Number(body.cadastrado_por))) body.cadastrado_por = 1;
    if (!body.atualizado_por || isNaN(Number(body.atualizado_por))) body.atualizado_por = body.cadastrado_por;
    console.log('🛠️ [POST /products] Payload normalizado:', body);
    const novo = await produtosService.create(body);
        res.status(201).json({ data: novo });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        res.status(500).json({ error: errorMsg });
    }
});
// PATCH /api/products/:id
routers.patch('/products/:id', async (req, res) => {
    try {
        const updates = { ...req.body } as any;
        if (updates.fornecedorId && !updates.fornecedor_id) {
            updates.fornecedor_id = updates.fornecedorId;
            delete updates.fornecedorId; // remove chave não existente na tabela
        }
    if (updates.cadastrado_por && isNaN(Number(updates.cadastrado_por))) delete updates.cadastrado_por; // não permitir inválido
    if (!updates.atualizado_por || isNaN(Number(updates.atualizado_por))) updates.atualizado_por = 1;
        const atualizado = await produtosService.updatePartial(Number(req.params.id), updates);
        res.status(200).json({ data: atualizado });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        res.status(500).json({ error: errorMsg });
    }
});
// DELETE /api/products/:id
routers.delete('/products/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        console.log(`🗑️  [DELETE /products/${id}] Iniciando exclusão`);
        // Verifica existência para retornar 404 corretamente
        try {
            const existente = await produtosService.getById(id);
            if (!existente) {
                console.log(`⚠️  Produto ${id} não encontrado para exclusão`);
                return res.status(404).json({ error: 'Produto não encontrado' });
            }
        } catch (e) {
            // getById já lança se erro supabase real; continuar se simplesmente não encontrou
        }

        await produtosService.delete(id);
        console.log(`✅  Produto ${id} excluído com sucesso`);
        return res.status(200).json({ success: true, id });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('❌ Erro ao deletar produto:', errorMsg);
        if (errorMsg.toLowerCase().includes('foreign key') || errorMsg.includes('cotacoes_itens_produto_id_fkey')) {
            return res.status(409).json({
                error: 'Produto vinculado a cotações/itens e não pode ser removido. Remova dependências primeiro.',
                code: 'FK_CONSTRAINT'
            });
        }
        res.status(500).json({ error: errorMsg });
    }
});

// DELETE force (remove dependências e depois o produto)
routers.delete('/products/:id/force', async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    console.log(`🗑️  [DELETE /products/${id}/force] Iniciando exclusão forçada`);
    try {
        // Remove itens de cotações vinculados
        const { error: itensErr } = await supabase
            .from('cotacoes_itens')
            .delete()
            .eq('produto_id', id);
        if (itensErr) throw new Error(`Erro ao remover itens vinculados: ${itensErr.message}`);

        // Desvincula produto de cotacoes (set null)
        const { error: cotErr } = await supabase
            .from('cotacoes')
            .update({ produto_id: null })
            .eq('produto_id', id);
        if (cotErr) throw new Error(`Erro ao desvincular cotações: ${cotErr.message}`);

        // Agora exclui produto
        await produtosService.delete(id);
        console.log(`✅  Produto ${id} excluído com sucesso (forçado)`);
        return res.status(200).json({ success: true, id, forced: true });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('❌ Erro na exclusão forçada:', errorMsg);
        return res.status(500).json({ error: errorMsg });
    }
});
export default routers;