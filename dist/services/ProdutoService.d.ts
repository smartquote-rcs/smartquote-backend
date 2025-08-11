import { Produto, ProdutoDTO } from '../models/Produto';
export declare class ProdutosService {
    create(produto: Produto): Promise<ProdutoDTO | null>;
    getAll(): Promise<ProdutoDTO[]>;
    getById(id: number): Promise<ProdutoDTO | null>;
    delete(id: number): Promise<void>;
    updatePartial(id: number, produto: Partial<Produto>): Promise<ProdutoDTO | null>;
}
//# sourceMappingURL=ProdutoService.d.ts.map