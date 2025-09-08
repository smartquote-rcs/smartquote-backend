export interface Sistema {
    id?: number;
    nome_empresa: string;
    idioma: string;
    fuso_horario: string;
    moeda: string;
    backup: string;
    manutencao: boolean;
    tempo_de_sessao: number;
    politica_senha: 'forte' | 'medio';
    log_auditoria: boolean;
    ip_permitidos: string;
    criado_em?: string;
    atualizado_em?: string;
}
export interface SistemaDTO {
    id: number;
    nome_empresa: string;
    idioma: string;
    fuso_horario: string;
    moeda: string;
    backup: string;
    manutencao: boolean;
    tempo_de_sessao: number;
    politica_senha: 'forte' | 'medio';
    log_auditoria: boolean;
    ip_permitidos: string;
    criado_em: string;
    atualizado_em: string;
}
//# sourceMappingURL=Sistema.d.ts.map