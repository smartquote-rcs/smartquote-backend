import Firecrawl from "@mendable/firecrawl-js";
import { z } from "zod";
import dotenv from "dotenv";
import { 
  Product, 
  ProductsResponse, 
  SearchParams, 
  SearchResult, 
  SearchFilters, 
  BuscaResponse 
} from "../types/BuscaTypes";

dotenv.config();

const app = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });
// Schema para validação dos produtos extraídos
const ProductSchema = z.object({
  name: z.string(),
  price: z.string().nullable().transform(val => val || "Preço não disponível"),
  image_url: z.string().nullable().transform(val => val || ""),
  description: z.string().nullable().transform(val => val || "Descrição não disponível"),
  product_url: z.string()
});

const ProductsResponseSchema = z.object({
  products: z.array(ProductSchema)
});

export class BuscaAutomatica {
  private firecrawlApp: Firecrawl;
  
  constructor() {
    if (!process.env.FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY não está definida nas variáveis de ambiente");
    }
    
    this.firecrawlApp = new Firecrawl({
      apiKey: process.env.FIRECRAWL_API_KEY
    });
  }

  //Schema para extração de produtos
  private getProductSchema() {
    return {
      type: "object",
      properties: {
        products: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              price: { type: ["string", "null"] },
              image_url: { type: ["string", "null"] },
              description: { type: ["string", "null"] },
              product_url: { type: "string" }
            },
            required: ["name", "product_url"]
          }
        }
      },
      required: ["products"]
    };
  }

  /**
   * Realiza busca automática de produtos em um website
   * @param params Parâmetros de busca
   * @returns Resultado da busca com produtos encontrados
   */
  async buscarProdutos(params: SearchParams): Promise<SearchResult> {
    try {
      const { searchTerm, website, numResults } = params;
      
      console.log(`Iniciando busca por "${searchTerm}" em ${website} (${numResults} resultados)`);
      
      const scrapeResult = await this.firecrawlApp.extract({
        urls: [website],
        
        // A tarefa específica
        prompt: `Extract EXACTLY ${numResults} products that match "${searchTerm}".`,

        // O "contrato" de saída
        schema: this.getProductSchema(),

        // As regras não negociáveis e o "código de conduta" da IA
        systemPrompt: `You are a precise data extraction agent.
                      If you cannot find the requested information, you MUST return an empty 'products' array. 
                      DO NOT invent or fabricate data.`,

        // A "válvula de segurança" para evitar contaminação externa
        enableWebSearch: false,
      });

      if (!scrapeResult.success) {
        return {
          success: false,
          error: `Falha ao fazer scraping: ${scrapeResult.error}`
        };
      }

      // Validar os dados usando Zod
      console.log("Validando dados extraídos...");
      const validatedData = ProductsResponseSchema.parse(scrapeResult.data);
      
      // FORÇAR o limite de produtos aqui também
      const produtosLimitados = validatedData.products.slice(0, numResults);
      
      console.log(`Busca concluída. ${produtosLimitados.length} produtos encontrados (limitado a ${numResults})`);
      
      return {
        success: true,
        data: {
          products: produtosLimitados
        }
      };

    } catch (error) {
      console.error("Erro durante a busca automática:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      };
    }
  }

  /**
   * Busca produtos em múltiplos websites
   * @param searchTerm Termo de busca
   * @param websites Array de websites para buscar
   * @param numResultsPerSite Número de resultados por site
   * @returns Array com resultados de cada site
   */
  async buscarProdutosMultiplosSites(
    searchTerm: string, 
    websites: string[], 
    numResultsPerSite: number = 5
  ): Promise<SearchResult[]> {
    const promises = websites.map(website => 
      this.buscarProdutos({
        searchTerm,
        website,
        numResults: numResultsPerSite
      })
    );

    return Promise.all(promises);
  }

  /**
   * Combina resultados de múltiplos sites em um único array
   * @param results Array de resultados de busca
   * @returns Array combinado de produtos
   */
  combinarResultados(results: SearchResult[]): Product[] {
    const produtos: Product[] = [];
    
    results.forEach((result, index) => {
      if (result.success && result.data) {
        console.log(`Site ${index + 1}: ${result.data.products.length} produtos encontrados`);
        produtos.push(...result.data.products);
      } else {
        console.log(`Site ${index + 1}: Falha na busca - ${result.error}`);
      }
    });

    console.log(`Total combinado: ${produtos.length} produtos de ${results.length} sites`);
    return produtos;
  }

  /**
   * Filtra produtos por faixa de preço
   * @param produtos Array de produtos
   * @param precoMin Preço mínimo (opcional)
   * @param precoMax Preço máximo (opcional)
   * @returns Array de produtos filtrados
   */
  filtrarPorPreco(produtos: Product[], precoMin?: number, precoMax?: number): Product[] {
    return produtos.filter(produto => {
      // Extrair valor numérico do preço (assumindo formato como "R$ 1.500,00" ou "$1500")
      const precoNumerico = this.extrairPrecoNumerico(produto.price);
      
      if (precoNumerico === null) return true; // Se não conseguir extrair, inclui o produto
      
      if (precoMin !== undefined && precoNumerico < precoMin) return false;
      if (precoMax !== undefined && precoNumerico > precoMax) return false;
      
      return true;
    });
  }

  /**
   * Extrai valor numérico de uma string de preço
   * @param precoString String do preço
   * @returns Valor numérico ou null se não conseguir extrair
   */
  private extrairPrecoNumerico(precoString: string): number | null {
    try {
      // Remove símbolos de moeda e espaços, mantém apenas números, vírgulas e pontos
      const numeroLimpo = precoString.replace(/[^\d.,]/g, '');
      
      // Converte vírgula para ponto (formato brasileiro)
      const numeroFormatado = numeroLimpo.replace(',', '.');
      
      const numero = parseFloat(numeroFormatado);
      
      return isNaN(numero) ? null : numero;
    } catch {
      return null;
    }
  }

  /**
   * Cria uma resposta estruturada da busca
   * @param produtos Array de produtos encontrados
   * @param sites Array de sites pesquisados
   * @param filtros Filtros aplicados (opcional)
   * @param tempoBusca Tempo de busca em milissegundos (opcional)
   * @returns Resposta estruturada
   */
  criarRespostaBusca(
    produtos: Product[], 
    sites: string[], 
    filtros?: SearchFilters,
    tempoBusca?: number
  ): BuscaResponse {
    return {
      produtos,
      total: produtos.length,
      sites_pesquisados: sites,
      tempo_busca: tempoBusca,
      filtros_aplicados: filtros
    };
  }
}
