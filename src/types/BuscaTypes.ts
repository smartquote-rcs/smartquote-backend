/**
 * Tipos e interfaces para o sistema de busca automática
 */

export interface Product {
  name: string;
  price: string;
  image_url: string;
  description: string;
  product_url: string;
}

export interface ProductsResponse {
  products: Product[];
}

export interface SearchParams {
  searchTerm: string;
  website: string;
  numResults: number;
}

export interface SearchResult {
  success: boolean;
  data?: ProductsResponse;
  error?: string;
}

export interface SearchFilters {
  precoMin?: number;
  precoMax?: number;
  categoria?: string;
  marca?: string;
}

export interface BuscaResponse {
  produtos: Product[];
  total: number;
  sites_pesquisados: string[];
  tempo_busca?: number;
  filtros_aplicados?: SearchFilters;
}
