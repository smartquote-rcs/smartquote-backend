import { Produto, ProdutoDTO } from '../models/Produto';
import type { Product } from '../types/BuscaTypes';
export declare class ProdutosService {
    private table;
    create(produto: Produto): Promise<ProdutoDTO | null>;
    getAll(): Promise<ProdutoDTO[]>;
    getById(id: number): Promise<ProdutoDTO | null>;
    delete(id: number): Promise<void>;
    updatePartial(id: number, produto: Partial<Produto>): Promise<ProdutoDTO | null>;
    /**
     * Converte preço de string para float
     */
    private parseNumero;
    /**
     * Gera código único para o produto baseado no nome
     */
    private gerarCodigoProduto;
    /**
     * Extrai modelo do nome do produto
     */
    private extrairModelo;
    /**
     * Converte um produto da busca para o formato da base de dados
     */
    private converterProdutoParaBD;
    /**
     * Salva produtos encontrados na busca automática
     */
    salvarProdutosDaBusca(produtos: Product[], fornecedorId: number, usuarioId?: number): Promise<{
        salvos: number;
        erros: number;
        detalhes: any[];
    }>;
    /**
     * Verifica se produto similar já existe
     */
    private verificarProdutoExistente;
    /**
     * Busca produtos salvos de um fornecedor
     */
    getProdutosPorFornecedor(fornecedorId: number): Promise<ProdutoDTO[]>;
}
//# sourceMappingURL=ProdutoService.d.ts.map