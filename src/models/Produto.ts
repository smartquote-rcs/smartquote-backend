


export interface Produto {
  id?: number;
  fornecedorId: number; // agora obrigatório
  codigo?: string;
  nome: string;
  modelo?: string;
  descricao: string;
  preco: number;
  unidade?: string;
  estoque: number;
  origem?: string;
  cadastrado_por: number;
  cadastrado_em: string;
  atualizado_por: number;
  atualizado_em: string;
}

export interface ProdutoDTO extends Produto {
  id: number;
}
