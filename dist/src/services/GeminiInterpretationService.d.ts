/**
 * Serviço de interpretação de emails usando Google Gemini AI
 * Analisa o conteúdo dos emails e extrai informações estruturadas
 */
export interface EmailInterpretation {
    id: string;
    emailId: string;
    tipo: 'pedido' | 'outro';
    prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
    solicitacao: string;
    cliente: ClientInfo;
    confianca: number;
    interpretedAt: string;
    rawGeminiResponse?: string;
}
export interface ProductInfo {
    nome: string;
    descricao?: string;
    quantidade?: number;
    unidade?: string;
    preco?: number;
    moeda?: string;
    codigo?: string;
    categoria?: string;
}
export interface ClientInfo {
    nome?: string;
    empresa?: string;
    email?: string;
    telefone?: string;
    website?: string;
    localizacao?: string;
}
export interface EmailData {
    id: string;
    from: string;
    subject: string;
    content: string;
    date: string;
}
declare class GeminiInterpretationService {
    private genAI;
    private model;
    constructor();
    /**
     * Interpreta o conteúdo de um email usando Gemini AI
     */
    interpretEmail(emailData: EmailData): Promise<EmailInterpretation>;
    /**
     * Constrói o prompt para o Gemini AI
     */
    private buildPrompt;
    /**
     * Parse da resposta do Gemini AI
     */
    private parseGeminiResponse;
    /**
     * Cria interpretação básica em caso de erro
     */
    private createFallbackInterpretation;
    /**
     * Salva a interpretação em arquivo JSON e processa com Python
     */
    private saveInterpretation;
    /**
     * Gera ID único para interpretação
     */
    private generateInterpretationId;
    /**
     * Lista interpretações salvas
     */
    listInterpretations(): Promise<EmailInterpretation[]>;
    /**
     * Busca interpretação por email ID
     */
    getInterpretationByEmailId(emailId: string): Promise<EmailInterpretation | null>;
}
export default GeminiInterpretationService;
//# sourceMappingURL=GeminiInterpretationService.d.ts.map