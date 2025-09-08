export interface RelatorioData {
  cotacaoId: number;
  promptId: number;
  solicitacao: string;
  orcamentoGeral: number;
  cliente?: any;
  propostaEmail?: string;
  numProdutosEscolhidos?: number;
  // Análise de cache (estrutura similar à analiseLocal). Opcional para retrocompatibilidade
  analiseCache?: any[];
  // Análise web externa (estrutura semelhante à analiseWeb). Opcional
  analiseExterna?: any[];
  analiseLocal: Array<{
    score: number;
    query_id: string;
    alternativa: boolean;
    llm_relatorio: {
      top_ranking: Array<{
        nome: string;
        id: number;
        preco: string;
        posicao: number;
        justificativa: string;
        pontos_fortes: string[];
        pontos_fracos: string[];
        score_estimado: number;
      }>;
      escolha_principal: string;
      criterios_avaliacao: {
        especificacoes: string;
        custo_beneficio: string;
        disponibilidade: string;
        correspondencia_tipo: string;
      };
      justificativa_escolha: string;
      query: string;
    };
  }>;
  analiseWeb: Array<{
    query: {
      id: string;
      nome: string;
      tipo: string;
      categoria: string;
      quantidade: number;
      palavras_chave?: string;
      query_sugerida: string;
      custo_beneficio: any;
    };
    top_ranking: Array<{
      url: string;
      nome: string;
      preco: string;
      posicao: number;
      justificativa: string;
      pontos_fortes: string[];
      pontos_fracos: string[];
      score_estimado: number;
    }>;
    id_item_cotacao: number;
    escolha_principal?: string;
    criterios_avaliacao: {
      especificacoes: string;
      custo_beneficio: string;
      disponibilidade: string;
      correspondencia_tipo: string;
    };
    justificativa_escolha: string;
  }>;
}

export interface RankingItem {
  nome: string;
  preco: string;
  posicao: number;
  justificativa: string;
  pontos_fortes: string[];
  pontos_fracos: string[];
  score_estimado: number;
  url?: string;
  id?: number;
}

export interface CriteriosAvaliacao {
  especificacoes: string;
  custo_beneficio: string;
  disponibilidade: string;
  correspondencia_tipo: string;
  confiabilidade?: string;
  reputacao_vendedor?: string;
}
