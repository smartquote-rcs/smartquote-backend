/**
 * Serviço de interpretação de emails usando Google Gemini AI
 * Analisa o conteúdo dos emails e extrai informações estruturadas
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface EmailInterpretation {
  id: string;
  emailId: string;
  tipo: 'cotacao' | 'pedido' | 'informacao' | 'resposta' | 'promocao' | 'outro';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  produtos: ProductInfo[];
  cliente: ClientInfo;
  resumo: string;
  acoes_sugeridas: string[];
  confianca: number; // 0-100%
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

class GeminiInterpretationService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não encontrada nas variáveis de ambiente');
    }

    console.log(`🧠 [GEMINI] Inicializando com modelo: ${model}`);
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model });
  }

  /**
   * Interpreta o conteúdo de um email usando Gemini AI
   */
  async interpretEmail(emailData: EmailData): Promise<EmailInterpretation> {
    try {
      console.log(`🧠 [GEMINI] Interpretando email: ${emailData.id}`);
      
      const prompt = this.buildPrompt(emailData);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log(`🧠 [GEMINI] Resposta recebida para email ${emailData.id}`);
      
      // Parse da resposta JSON do Gemini
      const interpretation = this.parseGeminiResponse(text, emailData);
      
      // Salvar interpretação
      await this.saveInterpretation(interpretation);
      
      console.log(`✅ [GEMINI] Email ${emailData.id} interpretado com sucesso`);
      
      return interpretation;

    } catch (error: any) {
      console.error(`❌ [GEMINI] Erro ao interpretar email ${emailData.id}:`, error.message);
      
      // Retornar interpretação básica em caso de erro
      return this.createFallbackInterpretation(emailData, error.message);
    }
  }

  /**
   * Constrói o prompt para o Gemini AI
   */
  private buildPrompt(emailData: EmailData): string {
    return `
Você é um assistente especializado em análise de emails comerciais. Analise o email abaixo e extraia informações estruturadas.

DADOS DO EMAIL:
- De: ${emailData.from}
- Assunto: ${emailData.subject}
- Data: ${emailData.date}
- Conteúdo: ${emailData.content}

INSTRUÇÕES:
1. Identifique o tipo de email (cotacao, pedido, informacao, resposta, promocao, outro)
2. Determine a prioridade (baixa, media, alta, urgente)
3. Extraia informações sobre produtos mencionados
4. Identifique dados do cliente/remetente
5. Crie um resumo conciso
6. Sugira ações a serem tomadas
7. Avalie sua confiança na análise (0-100%)

RESPOSTA EM JSON:
{
  "tipo": "string",
  "prioridade": "string", 
  "produtos": [
    {
      "nome": "string",
      "descricao": "string",
      "quantidade": number,
      "unidade": "string",
      "preco": number,
      "moeda": "string",
      "codigo": "string",
      "categoria": "string"
    }
  ],
  "cliente": {
    "nome": "string",
    "empresa": "string",
    "email": "string",
    "telefone": "string",
    "website": "string",
    "localizacao": "string"
  },
  "resumo": "string",
  "acoes_sugeridas": ["string"],
  "confianca": number
}

Responda APENAS com o JSON válido, sem texto adicional.
`;
  }

  /**
   * Parse da resposta do Gemini AI
   */
  private parseGeminiResponse(response: string, emailData: EmailData): EmailInterpretation {
    try {
      // Limpar resposta e extrair JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      return {
        id: this.generateInterpretationId(),
        emailId: emailData.id,
        tipo: parsedResponse.tipo || 'outro',
        prioridade: parsedResponse.prioridade || 'media',
        produtos: parsedResponse.produtos || [],
        cliente: parsedResponse.cliente || {},
        resumo: parsedResponse.resumo || 'Resumo não disponível',
        acoes_sugeridas: parsedResponse.acoes_sugeridas || [],
        confianca: parsedResponse.confianca || 50,
        interpretedAt: new Date().toISOString(),
        rawGeminiResponse: response
      };

    } catch (error) {
      console.error('❌ [GEMINI] Erro ao fazer parse da resposta:', error);
      return this.createFallbackInterpretation(emailData, `Parse error: ${error}`);
    }
  }

  /**
   * Cria interpretação básica em caso de erro
   */
  private createFallbackInterpretation(emailData: EmailData, errorMessage: string): EmailInterpretation {
    return {
      id: this.generateInterpretationId(),
      emailId: emailData.id,
      tipo: 'outro',
      prioridade: 'media',
      produtos: [],
      cliente: {
        email: emailData.from
      },
      resumo: `Email de ${emailData.from} sobre: ${emailData.subject}`,
      acoes_sugeridas: ['Revisar manualmente'],
      confianca: 0,
      interpretedAt: new Date().toISOString(),
      rawGeminiResponse: `ERROR: ${errorMessage}`
    };
  }

  /**
   * Salva a interpretação em arquivo JSON
   */
  private async saveInterpretation(interpretation: EmailInterpretation): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const interpretationsDir = path.join(__dirname, '../data/interpretations');
      
      // Criar diretório se não existir
      try {
        await fs.mkdir(interpretationsDir, { recursive: true });
      } catch (error) {
        // Diretório já existe
      }
      
      const filename = `${interpretation.interpretedAt.split('T')[0]}_${interpretation.id}_${interpretation.emailId}.json`;
      const filepath = path.join(interpretationsDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(interpretation, null, 2), 'utf8');
      
      console.log(`💾 [GEMINI] Interpretação salva: ${filename}`);
      
    } catch (error) {
      console.error('❌ [GEMINI] Erro ao salvar interpretação:', error);
    }
  }

  /**
   * Gera ID único para interpretação
   */
  private generateInterpretationId(): string {
    return `interp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Lista interpretações salvas
   */
  async listInterpretations(): Promise<EmailInterpretation[]> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const interpretationsDir = path.join(__dirname, '../data/interpretations');
      
      try {
        const files = await fs.readdir(interpretationsDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const interpretations: EmailInterpretation[] = [];
        
        for (const file of jsonFiles) {
          const filepath = path.join(interpretationsDir, file);
          const content = await fs.readFile(filepath, 'utf8');
          const interpretation = JSON.parse(content);
          interpretations.push(interpretation);
        }
        
        // Ordenar por data de interpretação (mais recente primeiro)
        return interpretations.sort((a, b) => 
          new Date(b.interpretedAt).getTime() - new Date(a.interpretedAt).getTime()
        );
        
      } catch (error) {
        console.log('📁 [GEMINI] Nenhuma interpretação encontrada');
        return [];
      }
      
    } catch (error) {
      console.error('❌ [GEMINI] Erro ao listar interpretações:', error);
      return [];
    }
  }

  /**
   * Busca interpretação por email ID
   */
  async getInterpretationByEmailId(emailId: string): Promise<EmailInterpretation | null> {
    try {
      const interpretations = await this.listInterpretations();
      return interpretations.find(interp => interp.emailId === emailId) || null;
    } catch (error) {
      console.error('❌ [GEMINI] Erro ao buscar interpretação:', error);
      return null;
    }
  }
}

export default GeminiInterpretationService;
