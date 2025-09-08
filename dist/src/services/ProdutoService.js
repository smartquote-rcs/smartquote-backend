"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutosService = void 0;
const connect_1 = __importDefault(require("../infra/supabase/connect"));
class ProdutosService {
    table = "produtos";
    async create(produto) {
        const { data, error } = await connect_1.default
            .from(this.table)
            .insert([produto])
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async getAll() {
        const { data, error } = await connect_1.default
            .from(this.table)
            .select('*');
        if (error)
            throw new Error(error.message);
        return data;
    }
    async getById(id) {
        const { data, error } = await connect_1.default
            .from(this.table)
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async delete(id) {
        const { error } = await connect_1.default
            .from(this.table)
            .delete()
            .eq('id', id);
        if (error)
            throw new Error(error.message);
    }
    async updatePartial(id, produto) {
        const { data, error } = await connect_1.default
            .from(this.table)
            .update(produto)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    // ===== MÉTODOS PARA BUSCA AUTOMÁTICA =====
    /**
     * Converte preço de string para float
     */
    // Simular as funções corrigidas
    parseNumero(precoStr) {
        if (!precoStr)
            return null;
        try {
            // Remove tudo que não seja dígito, ponto ou vírgula
            let numeroLimpo = precoStr.replace(/[^\d.,]/g, '');
            // Normalizar separadores decimais
            // Se tem vírgula, assumir que é separador decimal
            if (numeroLimpo.includes(',')) {
                // Se tem ponto E vírgula, ponto é separador de milhar
                if (numeroLimpo.includes('.')) {
                    numeroLimpo = numeroLimpo.replace(/\./g, '').replace(',', '.');
                }
                else {
                    // Só vírgula, converter para ponto decimal
                    numeroLimpo = numeroLimpo.replace(',', '.');
                }
            }
            // Se só tem pontos, verificar se é separador de milhar ou decimal
            else if (numeroLimpo.includes('.')) {
                const partes = numeroLimpo.split('.');
                if (partes.length > 2 || (partes.length === 2 && partes[1] && partes[1].length === 3)) {
                    // Múltiplos pontos ou último tem 3 dígitos = separador de milhar
                    numeroLimpo = numeroLimpo.replace(/\./g, '');
                }
                // Senão, assumir que é separador decimal
            }
            const n = parseFloat(numeroLimpo);
            return isNaN(n) ? null : n;
        }
        catch {
            return null;
        }
    }
    /**
     * Gera código único para o produto baseado no nome
     */
    gerarCodigoProduto(nome, fornecedorId) {
        // Remove caracteres especiais e espaços, pega primeiras palavras
        const nomeClean = nome
            .replace(/[^\w\s]/g, '')
            .split(' ')
            .slice(0, 3)
            .map(palavra => palavra.substring(0, 4).toUpperCase())
            .join('-');
        // Adiciona timestamp para unicidade
        const timestamp = Date.now().toString().slice(-6);
        return `F${fornecedorId}-${nomeClean}-${timestamp}`;
    }
    /**
     * Extrai modelo do nome do produto
     */
    extrairModelo(nome) {
        // Tenta extrair informações como "15.6\"", "i5", "8GB", etc.
        const modelos = nome.match(/\d+[\.,]?\d*["''`´]?|\bi[3579]\b|\d+GB|\d+TB/gi);
        return modelos ? modelos.join(' ') : 'Padrão';
    }
    /**
     * Converte um produto da busca para o formato da base de dados
     */
    converterProdutoParaBD(produto, fornecedorId, usuarioId = 1) {
        const agora = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
        return {
            fornecedor_id: fornecedorId,
            codigo: this.gerarCodigoProduto(produto.name, fornecedorId),
            nome: produto.name.substring(0, 250), // limite do CHAR(255)
            modelo: this.extrairModelo(produto.name).substring(0, 250),
            descricao: produto.description || 'Produto encontrado via busca automática',
            preco: this.parseNumero(produto.price) || 0,
            estoque: 200, // produtos da busca começam com estoque 200
            origem: 'externo',
            image_url: produto.image_url || undefined, // URL da imagem do produto
            produto_url: produto.product_url || undefined, // URL da fonte/página do produto
            cadastrado_por: usuarioId,
            cadastrado_em: agora,
            atualizado_por: usuarioId,
            atualizado_em: agora,
            categoria: produto.categoria
        };
    }
    /**
     * Salva produtos encontrados na busca automática
     */
    async salvarProdutosDaBusca(produtos, fornecedorId, usuarioId = 1) {
        const resultado = {
            salvos: 0,
            erros: 0,
            detalhes: []
        };
        if (!produtos || produtos.length === 0) {
            return resultado;
        }
        console.log(`💾 Iniciando salvamento de ${produtos.length} produtos do fornecedor ${fornecedorId}`);
        for (const produto of produtos) {
            try {
                // Verifica se já existe produto similar
                const produtoExistente = await this.verificarProdutoExistente(produto.name, fornecedorId);
                if (produtoExistente) {
                    console.log(`⚠️  Produto já existe: ${produto.name}`);
                    resultado.salvos++;
                    resultado.detalhes.push({
                        produto: produto.name,
                        status: 'existe',
                        id: produtoExistente.id
                    });
                    continue;
                }
                // Converte para formato da BD (sem ID, deixa o auto-increment cuidar)
                const produtoParaSalvar = this.converterProdutoParaBD(produto, fornecedorId, usuarioId);
                // Salva na base de dados
                const { data, error } = await connect_1.default
                    .from(this.table)
                    .insert([produtoParaSalvar])
                    .select('id, nome, preco')
                    .single();
                if (error) {
                    console.error(`❌ Erro ao salvar produto ${produto.name}:`, error);
                    resultado.erros++;
                    resultado.detalhes.push({
                        produto: produto.name,
                        status: 'erro',
                        erro: error.message
                    });
                }
                else {
                    console.log(`✅ Produto salvo: ${data.nome} (ID: ${data.id})`);
                    resultado.salvos++;
                    resultado.detalhes.push({
                        produto: produto.name,
                        status: 'salvo',
                        id: data.id,
                        preco_centavos: data.preco
                    });
                }
            }
            catch (error) {
                console.error(`💥 Erro ao processar produto ${produto.name}:`, error);
                resultado.erros++;
                resultado.detalhes.push({
                    produto: produto.name,
                    status: 'erro',
                    erro: error instanceof Error ? error.message : 'Erro desconhecido'
                });
            }
        }
        console.log(`📊 Resultado: ${resultado.salvos} salvos, ${resultado.erros} erros`);
        return resultado;
    }
    /**
     * Verifica se produto similar já existe
     */
    async verificarProdutoExistente(nomeProduto, fornecedorId) {
        try {
            // Busca por nome similar no mesmo fornecedor
            const { data, error } = await connect_1.default
                .from('produtos')
                .select('*')
                .eq('fornecedor_id', fornecedorId)
                .ilike('nome', `%${nomeProduto.substring(0, 50)}%`)
                .limit(1)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.warn('Erro ao verificar produto existente:', error);
            }
            return data || null;
        }
        catch (error) {
            console.warn('Erro na verificação de produto existente:', error);
            return null;
        }
    }
    /**
     * Busca produtos salvos de um fornecedor
     */
    async getProdutosPorFornecedor(fornecedorId) {
        try {
            const { data, error } = await connect_1.default
                .from('produtos')
                .select('*')
                .eq('fornecedor_id', fornecedorId)
                .order('cadastrado_em', { ascending: false });
            if (error) {
                console.error('Erro ao buscar produtos do fornecedor:', error);
                throw new Error(`Erro na consulta: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            console.error('Erro no serviço de produtos:', error);
            throw error;
        }
    }
}
exports.ProdutosService = ProdutosService;
//# sourceMappingURL=ProdutoService.js.map