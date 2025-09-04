export interface Cotacao {
  id?: number;
  // chaves de relação
  prompt_id: number;

  // campos de aprovação agora opcionais
  aprovacao?: boolean;
  motivo?: string;
  aprovado_por?: number;

  // datas e auditoria (mantemos opcionais pois o BD pode preencher)
  cadastrado_em?: string;
  atualizado_em?: string;
  data_aprovacao?: string;
  data_solicitacao?: string;
  prazo_validade?: string;

  // novos campos essenciais do script de migração
  status?: 'completa' | 'incompleta';
  orcamento_geral?: number; // numeric no BD
  // DEPRECATED: itens faltantes agora são representados por registros em cotacoes_itens com status=false e campo pedido
  faltantes?: any; // jsonb no BD (legado)

  // campos diversos (se existirem na tabela)
  observacao?: string;
  observacoes?: string; // manter compatibilidade caso a coluna exista
  condicoes?: any;
}

export interface CotacaoDTO extends Cotacao {
  id: number;
  // relacionamentos expandido pelo select
  prompt?: {
    id: number;
    texto_original: string;
  };
  produto_id:number;
  produto?: {
    id: number;
    nome: string;
  };
}
