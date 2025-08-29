/**
 * Serviço de interpretação de emails usando Google Gemini AI
 * Analisa o conteúdo dos emails e extrai informações estruturadas
 */
import type { RelatorioData } from './relatorio/types';
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
    dados_bruto?: any;
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
export interface EmailReformulationResult {
    originalEmail: string;
    reformulatedEmail: string;
    prompt: string;
    confidence: number;
    processedAt: string;
    rawGeminiResponse?: string;
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
    private buildContext;
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
    /**
     * Reformula um email usando Gemini AI com base em um prompt de modificação
     */
    gerarTemplateEmailTextoIA(relatorioData: RelatorioData, emailOriginal: string, promptModificacao: string): Promise<EmailReformulationResult>;
    /**
     * Constrói o prompt para reformulação de email
     */
    private buildEmailReformulationPrompt;
    /**
     * Constrói o contexto para reformulação de email
     */
    private buildEmailReformulationContext;
    /**
     * Extrai os itens principais escolhidos das análises
     */
    private extractSelectedItems;
    /**
     * Formata os dados do cliente de forma estruturada
     */
    private formatClientData;
    /**
     * Parse da resposta de reformulação do Gemini AI
     */
    private parseEmailReformulationResponse;
    /**
     * Cria resultado de reformulação básico em caso de erro
     */
    private createFallbackEmailReformulation;
}
export default GeminiInterpretationService;
//# sourceMappingURL=GeminiInterpretationService.d.ts.map