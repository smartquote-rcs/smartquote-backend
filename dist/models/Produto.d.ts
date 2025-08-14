export interface Produto {
    id?: number;
    nome: string;
    descricao: string;
    preco: number;
    quantidade: number;
    categoriaId: number;
    cadastradoEm: string;
    cadastradoPor: number;
    atualizadoEm: string;
    atualizadoPor: number;
    ativo?: boolean;
}
export interface ProdutoDTO {
    id: number;
    nome: string;
    descricao: string;
    preco: number;
    quantidade: number;
    categoriaId: number;
    cadastradoEm: string;
    cadastradoPor: number;
    atualizadoEm: string;
    atualizadoPor: number;
    ativo: boolean;
}
//# sourceMappingURL=Produto.d.ts.map