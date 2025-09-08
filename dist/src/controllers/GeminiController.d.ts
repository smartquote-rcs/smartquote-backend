/**
 * Controller para gerenciar interpretações de emails via Gemini AI
 */
import { Request, Response } from 'express';
export declare class GeminiController {
    private geminiService;
    constructor();
    /**
     * Lista todas as interpretações de emails
     */
    listarInterpretacoes(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Busca interpretação de um email específico
     */
    buscarInterpretacaoPorEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Força a interpretação de um email específico
     */
    interpretarEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Endpoint de teste para verificar conexão com Gemini
     */
    testarGemini(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Obtém estatísticas das interpretações
     */
    obterEstatisticas(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
export default GeminiController;
//# sourceMappingURL=GeminiController.d.ts.map