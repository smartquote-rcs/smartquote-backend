export interface Cotacao {
  id?: number;
  promptId: number;
  produtoId: number;
  aprovacao: boolean;
  motivo: string;
  aprovadoPor: number;
  cadastradoEm: string;
  atualizadoEm: string;
  dataAprovacao?: string;
  dataSolicitacao?: string;
  prazoValidade?: string;
  status?: 'pendente' | 'aceite' | 'recusado';
  observacoes?: string;
  condicoes?: any;
}

export interface CotacaoDTO {
  id: number;
  promptId: number;
  produtoId: number;
  aprovacao: boolean;
  motivo: string;
  aprovadoPor: number;
  cadastradoEm: string;
  atualizadoEm: string;
  dataAprovacao?: string;
  dataSolicitacao: string;
  prazoValidade?: string;
  status: 'pendente' | 'aceite' | 'recusado';
  observacoes?: string;
  condicoes?: any;
  prompt?: {
    id: number;
    texto_original: string;
  };
  produto?: {
    id: number;
    nome: string;
  };
}
