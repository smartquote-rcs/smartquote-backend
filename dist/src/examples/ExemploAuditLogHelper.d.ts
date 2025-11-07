import { Request, Response } from 'express';
/**
 * Exemplos práticos de como usar o AuditLogHelper nos seus controllers
 */
export declare class CotacoesControllerExample {
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    update(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    delete(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    private createInDB;
    private findById;
    private updateInDB;
    private deleteFromDB;
}
export declare class ProdutosControllerExample {
    bulkUpdatePrices(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    import(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    private updatePricesInDB;
    private importToDB;
}
export declare class AuthControllerExample {
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    logout(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    changePassword(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    private authenticateUser;
    private updatePasswordInDB;
}
export declare class RelatoriosControllerExample {
    exportToExcel(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    private generateReport;
    private saveToExcel;
}
export declare class EmailControllerExample {
    sendEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    private sendEmailService;
}
export declare function errorMiddleware(err: any, req: Request, res: Response, next: any): Response<any, Record<string, any>>;
export declare function accessDeniedMiddleware(resource: string): (req: Request, res: Response, next: any) => Promise<Response<any, Record<string, any>> | undefined>;
export declare function exemploUsoDirecto(): Promise<void>;
//# sourceMappingURL=ExemploAuditLogHelper.d.ts.map