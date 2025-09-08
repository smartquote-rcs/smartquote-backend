interface Fornecedor {
    id: number;
    nome: string;
    contato_email: string;
    contato_telefone: string;
    site: string;
    observacoes: string;
    ativo: boolean;
    cadastrado_em: string;
    cadastrado_por: number;
    atualizado_em: string;
    atualizado_por: number;
}
interface SiteForBusca {
    id: number;
    nome: string;
    url: string;
    ativo: boolean;
    escala_mercado: string;
}
declare class FornecedorService {
    /**
     * Busca todos os fornecedores ativos com sites válidos
     */
    getFornecedoresAtivos(): Promise<SiteForBusca[]>;
    /**
     * Busca fornecedor por ID
     */
    getFornecedorById(id: number): Promise<Fornecedor | null>;
    /**
     * Formata URL para busca (adiciona wildcard se necessário)
     */
    private formatarUrlParaBusca;
    /**
     * Busca configurações do sistema
     */
    getConfiguracoesSistema(): Promise<any>;
}
declare const _default: FornecedorService;
export default _default;
export type { SiteForBusca, Fornecedor };
//# sourceMappingURL=FornecedorService.d.ts.map