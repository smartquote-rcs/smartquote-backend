


export interface Produto {
  id?: number;
  // manter compat com services (usam fornecedor_id)
  fornecedor_id: number;
  codigo?: string;
  nome: string;
  modelo?: string;
  descricao: string;
  preco: number; // armazenado em centavos em algumas rotas
  estoque: number;
  origem?: string; // 'local' | 'externo'
  image_url?: string;
  produto_url?: string;
  // novos campos da migração
  tags?: string[];
  categoria?: string | null;
  disponibilidade?: 'imediata' | 'por encomenda' | 'limitada';
  especificacoes_tecnicas?: any; // jsonb
  // auditoria
  cadastrado_por: number;
  cadastrado_em: string;
  atualizado_por: number;
  atualizado_em: string;
}

export interface ProdutoDTO extends Produto {
  id: number;
}
