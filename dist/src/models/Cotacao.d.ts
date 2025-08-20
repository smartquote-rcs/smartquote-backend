export interface Cotacao {
    id?: number;
    prompt_id: number;
    aprovacao?: boolean;
    motivo?: string;
    aprovado_por?: number;
    cadastrado_em?: string;
    atualizado_em?: string;
    data_aprovacao?: string;
    data_solicitacao?: string;
    prazo_validade?: string;
    status?: 'completa' | 'incompleta';
    orcamento_geral?: number;
    faltantes?: any;
    observacao?: string;
    observacoes?: string;
    condicoes?: any;
}
export interface CotacaoDTO extends Cotacao {
    id: number;
    prompt?: {
        id: number;
        texto_original: string;
    };
    produto?: {
        id: number;
        nome: string;
    };
}
//# sourceMappingURL=Cotacao.d.ts.map