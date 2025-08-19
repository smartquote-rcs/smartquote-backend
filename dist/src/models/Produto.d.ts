export interface Produto {
    id?: number;
    fornecedor_id: number;
    codigo?: string;
    nome: string;
    modelo?: string;
    descricao: string;
    preco: number;
    unidade?: string;
    estoque: number;
    origem?: string;
    image_url?: string;
    produto_url?: string;
    tags?: string[];
    categoria?: string | null;
    disponibilidade?: 'imediata' | 'por encomenda' | 'limitada';
    especificacoes_tecnicas?: any;
    cadastrado_por: number;
    cadastrado_em: string;
    atualizado_por: number;
    atualizado_em: string;
}
export interface ProdutoDTO extends Produto {
    id: number;
}
//# sourceMappingURL=Produto.d.ts.map