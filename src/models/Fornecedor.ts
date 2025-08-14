export interface Fornecedor {
  id?: number;
  nome: string;
  contato_email: string;
  contato_telefone?: string;
  site?: string;
  observacoes?: string;
  ativo: boolean;
  cadastrado_em: string;
  cadastrado_por: number;
  atualizado_em: string;
  atualizado_por: number;
}
