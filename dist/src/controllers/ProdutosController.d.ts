import { Request, Response } from 'express';
interface MulterRequest extends Request {
    file?: any;
}
declare class ProdutosController {
    create(req: Request, res: Response): Promise<Response>;
    getAll(req: Request, res: Response): Promise<Response>;
    getById(req: Request, res: Response): Promise<Response>;
    delete(req: Request, res: Response): Promise<Response>;
    patch(req: Request, res: Response): Promise<Response>;
    /**
     * Upload de imagem de produto para o bucket do Supabase Storage.
     * Campo do formulário: 'imagem'
     * Retorna: { url: string }
     */
    uploadImagem(req: MulterRequest, res: Response): Promise<Response>;
}
declare const _default: ProdutosController;
export default _default;
//# sourceMappingURL=ProdutosController.d.ts.map