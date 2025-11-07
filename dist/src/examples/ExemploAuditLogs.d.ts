export declare function exemploCreateQuote(): Promise<void>;
export declare function exemploUpdateProduct(): Promise<void>;
export declare function exemploDeleteSupplier(): Promise<void>;
export declare function exemploUserLogin(): Promise<void>;
export declare function exemploStatusChange(): Promise<void>;
export declare function exemploConsultarLogsPorUsuario(): Promise<void>;
export declare function exemploConsultarLogsPorAcao(): Promise<void>;
export declare function exemploHistoricoRegistro(): Promise<void>;
export declare function exemploFiltrosAvancados(): Promise<void>;
export declare function exemploEstatisticas(): Promise<void>;
export declare function logAction(userId: string, action: string, tableName?: string, recordId?: number, details?: Record<string, any>): Promise<void>;
export declare class ExemploIntegracaoController {
    createQuote(req: any, res: any): Promise<any>;
    updateQuote(req: any, res: any): Promise<any>;
    private createQuoteInDB;
    private getQuoteById;
    private updateQuoteInDB;
}
//# sourceMappingURL=ExemploAuditLogs.d.ts.map