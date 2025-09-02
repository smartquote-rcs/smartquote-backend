/**
 * Serviço para calcular ponderação de busca externa usando LLM
 */

type Faltante = {
  id?: number;
  query_sugerida?: string;
  nome?: string;
  categoria?: string;
  quantidade?: number;
  custo_beneficio?: any;
  rigor?: any;
  ponderacao_busca_externa?: number;
};

export class PonderacaoWebService {
  /**
   * Adiciona ponderação de busca externa para cada faltante usando LLM
   */
  static async ponderarWebLLM(faltantes: Faltante[]): Promise<Faltante[]> {
    if (!faltantes || faltantes.length === 0) {
      return faltantes;
    }

    try {
      console.log(`🧠 [PONDERACAO-WEB] Iniciando ponderação LLM para ${faltantes.length} faltantes`);

      // Usar Groq para calcular ponderação
      const { Groq } = require('groq-sdk');
      const apiKey = process.env.GROQ_API_KEY;
      
      if (!apiKey) {
        console.log('❌ [PONDERACAO-WEB] GROQ_API_KEY não encontrada - usando ponderação padrão');
        return this.ponderacaoPadrao(faltantes);
      }

      const client = new Groq({ apiKey });

      // Processar todos os faltantes em uma única chamada
      const prompt = `
Analise os itens fornecidos e retorne um objeto JSON com as ponderações de busca externa para cada item.

ESCALA DE PONDERAÇÃO (0.0 a 1.0):
- 0.0 → busca externa impossível/inviável (ex.: serviços locais, itens baratos e urgentes).
- 0.1–0.4 → baixa prioridade (somente se não houver opção local).
- 0.5–0.7 → média prioridade (buscar em paralelo com fornecedores locais).
- 0.8–1.0 → alta prioridade (item de nicho, difícil de encontrar localmente ou com potencial de economia alto).

REGRAS DE INTERPRETAÇÃO:
1. Serviços:
   - Se exigem presença física em Angola (instalação, manutenção, consultoria presencial) → 0.0.
   - Se podem ser prestados remotamente (desenvolvimento, SOC as a service, gestão de cloud) → 0.8–0.9.

2. Software:
   - Se precisa estar em conformidade com leis/regulamentos locais (ex.: fiscal, RH, contabilidade) → 0.1–0.2.
   - Se exige integrações fortes com sistemas locais (bancos, pagamentos, ERP com parceiros locais) → 0.3–0.4.
   - Se é de propósito geral e transportável (Microsoft 365, Adobe, cloud genérica) → 0.8–0.9.

3. Hardware:
   - Se valor < 50.000 Kz (cabos, ratos, itens baratos) → 0.1.
   - Se é altamente especializado/nicho (equipamento médico raro, sensores IoT específicos) → 0.9–1.0.
   - Caso geral: base 0.5, ajustar e limitar entre 0.0 e 1.0:
     - Pequeno/leve → +0.20 ; Grande/pesado → −0.20.
     - Frágil → −0.15.
     - Urgente → −0.40 ; Planeado (>3 meses) → +0.20.
     - Sem suporte local → −0.20.
     - Importação com restrição/regulação → −0.15.

FORMATO DE SAÍDA:
Retorne APENAS um objeto JSON válido no formato:
{
  "ponderacoes": [
    {"id": 1, "ponderacao_busca_externa": 0.75},
    {"id": 2, "ponderacao_busca_externa": 0.25},
    ...
  ]
}

ATENÇÃO:
        - Respeite os nomes dos campos exatamente como estão.
        - Retorne somente um JSON válido conforme as instruções. Nenhum texto adicional.
        - Todos os valores devem estar entre 0.0 e 1.0, arredondados para duas casas decimais.
`;

      // Preparar lista de itens para análise
      const itensParaAnalise = faltantes.map((faltante, index) => ({
        id: faltante.id || index,
        nome: faltante.nome || 'N/A',
        categoria: faltante.categoria || 'N/A',
        query_sugerida: faltante.query_sugerida || 'N/A',
        quantidade: faltante.quantidade || 'N/A',
        custo_beneficio: faltante.custo_beneficio || {},
      }));

      const itemInfo = `
ITENS PARA ANÁLISE:
${JSON.stringify(itensParaAnalise, null, 2)}

Analise cada item e retorne as ponderações no formato JSON especificado.
`;

      const resp = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: itemInfo }
        ],
        temperature: 0,
        max_tokens: 2000,
        stream: false
      });

      const content = (resp.choices[0].message.content || '').trim();
      console.log(`🧠 [PONDERACAO-WEB] Resposta LLM: ${content.substring(0, 200)}...`);

      // Extrair JSON da resposta
      let ponderacoes: { id: number; ponderacao_busca_externa: number }[] = [];
      try {
        let cleanedContent = content;
        if (!content.startsWith('{')) {
          const jsonMatch = content.match(/\{.*\}/s);
          if (jsonMatch) {
            cleanedContent = jsonMatch[0];
          }
        }
        
        const data = JSON.parse(cleanedContent);
        ponderacoes = data.ponderacoes || [];
        
        console.log(`🧠 [PONDERACAO-WEB] Ponderações extraídas: ${ponderacoes.length} de ${faltantes.length}`);
        
      } catch (e) {
        console.log(`🧠 [PONDERACAO-WEB] Erro no parse JSON: ${e} - usando ponderação padrão`);
        return this.ponderacaoPadrao(faltantes);
      }

      // Aplicar ponderações aos faltantes
      const faltantesComPonderacao = faltantes.map((faltante, index) => {
        const ponderacaoItem = ponderacoes.find(p => 
          p.id === faltante.id || p.id === index
        );
        
        let ponderacao = 0.5; // valor padrão
        if (ponderacaoItem && 
            typeof ponderacaoItem.ponderacao_busca_externa === 'number' &&
            ponderacaoItem.ponderacao_busca_externa >= 0.0 && 
            ponderacaoItem.ponderacao_busca_externa <= 1.0) {
          ponderacao = Math.round(ponderacaoItem.ponderacao_busca_externa * 100) / 100;
        }

        return {
          ...faltante,
          ponderacao_busca_externa: ponderacao
        };
      });

      console.log(`🧠 [PONDERACAO-WEB] Ponderação concluída para ${faltantesComPonderacao.length} faltantes`);
      return faltantesComPonderacao;

    } catch (error) {
      console.error(`❌ [PONDERACAO-WEB] Erro no serviço de ponderação: ${error}`);
      return this.ponderacaoPadrao(faltantes);
    }
  }

  /**
   * Ponderação padrão quando LLM não está disponível
   */
  static ponderacaoPadrao(faltantes: Faltante[]): Faltante[] {
    return faltantes.map(faltante => {
      let ponderacao = 0.5; // valor base

      const nome = (faltante.nome || '').toLowerCase();
      const categoria = (faltante.categoria || '').toLowerCase();
      const query = (faltante.query_sugerida || '').toLowerCase();

      // Regras básicas baseadas em palavras-chave
      if (nome.includes('serviço') || nome.includes('instalação') || nome.includes('manutenção')) {
        ponderacao = 0.1; // serviços locais
      } else if (nome.includes('software') || nome.includes('licença') || categoria.includes('software')) {
        ponderacao = 0.7; // software geralmente pode ser internacional
      } else if (nome.includes('cabo') || nome.includes('mouse') || nome.includes('teclado')) {
        ponderacao = 0.2; // itens baratos
      } else if (categoria.includes('especializado') || nome.includes('médico') || nome.includes('industrial')) {
        ponderacao = 0.9; // equipamentos especializados
      }

      return {
        ...faltante,
        ponderacao_busca_externa: Math.round(ponderacao * 100) / 100
      };
    });
  }
}

export default PonderacaoWebService;
