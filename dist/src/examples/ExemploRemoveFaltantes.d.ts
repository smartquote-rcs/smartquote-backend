/**
 * Exemplo de uso da rota para remover elementos faltantes
 *
 * Este arquivo demonstra como usar a nova funcionalidade de remoção
 * de elementos do campo faltantes das cotações.
 */
export declare function exemploUso(): Promise<void>;
export declare function exemploComAxios(): Promise<void>;
export declare function removerFaltanteRobusto(cotacaoId: number, criterios: {
    index?: number;
    query?: string;
    nome?: string;
}): Promise<{
    elementoRemovido: any;
    faltantesRestantes: number;
    novoStatus: "completa" | "incompleta";
    cotacao: any;
}>;
//# sourceMappingURL=ExemploRemoveFaltantes.d.ts.map