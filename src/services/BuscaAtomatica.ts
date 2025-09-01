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
  product_url: z.string(),
  currency_unit: z.string().nullable().transform(val => val || "AOA"),
  delivery_to_Angola: z.string().nullable().transform(val => val || "Entrega"),
  escala_mercado: z.string().nullable().transform(val => val || "Nacional")
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
              name: { 
                type: "string",
                description: "Product name or title as displayed on the page"
              },
              price: { 
                type: ["string", "null"],
                description: "Current selling price with currency symbol (e.g., 'R$ 1.299,99', '$299.99', '1500 AOA'). Set to null if price not found."
              },
              currency_unit: { 
                type: ["string", "null"],
                description: "ISO 4217 currency code (USD, EUR, BRL, AOA, etc.). Infer from price or website if not explicit."
              },
              image_url: { 
                type: ["string", "null"],
                description: "Product image URL if available"
              },
              description: { 
                type: ["string", "null"],
                description: "Brief product description or key features if available"
              },
              product_url: { 
                type: "string",
                description: "Direct link to the product page"
              },
              delivery_to_Angola: { 
                type: ["string", "null"],
                description: "Delivery information to Angola if mentioned"
              } 
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
      
      console.log(`Iniciando busca por "${searchTerm}" em ${website.url} (${numResults} resultados)`);
      if (!website.url) {
        return {
          success: false,
          error: "URL do website não fornecida"
        };
      }
      const scrapeResult = await this.firecrawlApp.extract({
        urls: [website.url],
        
        // A tarefa específica
        prompt: `Extract EXACTLY ${numResults} products that match "${searchTerm}". 
                 For each product, you MUST find:
                 - The product name
                 - The current price (look for price tags, currency symbols, numbers with currency)
                 - Product URL/link
                 - Image URL if available
                 - Brief description if available
                 
                 Focus on finding the actual displayed price on the page. Look for elements like:
                 - Price tags with currency symbols (R$, $, €, etc.)
                 - Numbers followed by currency codes
                 - Price containers, price displays, or cost information
                 - Promotional prices or regular prices`,

        // O "contrato" de saída
        schema: this.getProductSchema(),

        // As regras não negociáveis e o "código de conduta" da IA
        systemPrompt: `You are a precise e-commerce data extraction agent specialized in finding product prices.
                      
                      PRICE EXTRACTION RULES:
                      - Always look for visible price information on the page
                      - Extract prices with their currency symbols or codes
                      - If multiple prices exist (original/discounted), prefer the current selling price
                      - Common price patterns: "R$ 1.299,99", "$299.99", "€199,00", "1.500 AOA"
                      - Look in common price locations: product cards, price tags, cost displays
                      
                      GENERAL RULES:
                      - Only extract products that clearly match the search term
                      - If you cannot find a price for a product, set price to null
                      - DO NOT invent or fabricate data
                      - Currency unit must be in ISO 4217 format (USD, EUR, BRL, AOA, etc.)
                      - If no currency is found, try to infer from the website domain (.br = BRL, .com = USD, etc.)`,

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
      console.log("Dados brutos extraídos:", JSON.stringify(scrapeResult.data, null, 2));
      //Adicionar escala_mercado em cada produto
      (scrapeResult.data as ProductsResponse).products.forEach((product: Product) => {
        product.escala_mercado = website?.escala_mercado || "";
      });
      const validatedData = ProductsResponseSchema.parse(scrapeResult.data);
      
      // Debug: verificar quantos produtos têm preço
      const produtosComPreco = validatedData.products.filter(p => p.price && p.price !== "Preço não disponível").length;
      const totalProdutos = validatedData.products.length;
      console.log(`Produtos extraídos: ${totalProdutos}, com preço: ${produtosComPreco}, sem preço: ${totalProdutos - produtosComPreco}`);
      
      // FORÇAR o limite de produtos aqui também
      const produtosLimitados = validatedData.products.slice(0, numResults);
      // para todos os produtos com o preço diferente de "Preço não disponível" e currency diferente de AOA
        let cacheConversao: Record<string, number> = {};
        const produtosFiltrados = await Promise.all(produtosLimitados.map(async produto => {
          const precoValido = produto.price !== "Preço não disponível";
          const currencyValida = produto.currency_unit !== "AOA";
          let taxaConversao: number = 1;
          if(precoValido && currencyValida && produto.currency_unit) {
            if (typeof cacheConversao[produto.currency_unit] === "number") {
              taxaConversao = cacheConversao[produto.currency_unit] as number;
            } else {
              try {
                const apiKey = process.env.APP_EXCHANGERATE_API_KEY;
                const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${produto.currency_unit}`);
                const data = await response.json() as { conversion_rates?: Record<string, number> };
                taxaConversao = data.conversion_rates?.["AOA"] ?? 1;
                cacheConversao[produto.currency_unit] = taxaConversao;
              } catch (e) {
                taxaConversao = 1; // fallback: não converte
              }
            }
          }
          const precoNumerico = this.extrairPrecoNumerico(produto.price);
          if (precoNumerico !== null && taxaConversao) {
            produto.price = (precoNumerico * taxaConversao).toFixed(2) + " AOA";
            produto.currency_unit = "AOA";
          }
          return produto;
        }));
        console.log(`Busca concluída. ${produtosFiltrados.length} produtos encontrados (limitado a ${numResults})`);

        return {
          success: true,
          data: {
            products: produtosFiltrados
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
    websites: {url?: string, escala_mercado?: string}[], 
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
      // Remove símbolos que não são dígitos, ponto ou vírgula
      let numeroLimpo = precoString.replace(/[^\d.,]/g, '');
  
      // Verifica se existe separador decimal na antepenúltima posição
      const temDecimal =
        numeroLimpo.length > 2 &&
        (numeroLimpo[numeroLimpo.length - 3] === '.' ||
         numeroLimpo[numeroLimpo.length - 3] === ',');
  
      if (temDecimal) {
        // Converte vírgula em ponto (para parseFloat funcionar)
        numeroLimpo = numeroLimpo.replace(',', '.');
  
        // Se houver mais de um ponto, todos exceto o último são separadores de milhar → remove
        const partes = numeroLimpo.split('.');
        if (partes.length > 2) {
          const decimal = partes.pop(); // última parte é decimal
          numeroLimpo = partes.join('') + '.' + decimal;
        }
  
        return Math.round(parseFloat(numeroLimpo));
      } else {
        // Sem decimais → remove todos os separadores e retorna número inteiro direto
        numeroLimpo = numeroLimpo.replace(/[.,]/g, '');
        return parseInt(numeroLimpo, 10);
      }
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
