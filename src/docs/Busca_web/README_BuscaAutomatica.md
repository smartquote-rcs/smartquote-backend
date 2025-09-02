# BuscaAutomatica - Sistema de Busca Web com Firecrawl

Esta classe fornece funcionalidades para busca automática de produtos em websites usando a API Firecrawl.

## Configuração

### 1. Variáveis de Ambiente

Certifique-se de configurar a variável `FIRECRAWL_API_KEY` no seu arquivo `.env`:

```env
FIRECRAWL_API_KEY=sua_chave_da_api_firecrawl
```

### 2. Dependências

A classe utiliza as seguintes dependências que já estão instaladas:
- `@mendable/firecrawl-js` - Cliente da API Firecrawl
- `zod` - Validação de schemas
- `dotenv` - Gerenciamento de variáveis de ambiente

## Uso Básico

### Importação

```typescript
import { BuscaAutomatica } from 'src/services/BuscaAtomatica';
```

### Instanciação

```typescript
const busca = new BuscaAutomatica();
```

### Busca Simples

```typescript
const resultado = await busca.buscarProdutos({
  searchTerm: "HP PROBOOK",
  website: "https://itec.co.ao/*",
  numResults: 5
});

if (resultado.success) {
  console.log("Produtos encontrados:", resultado.data?.products);
} else {
  console.error("Erro:", resultado.error);
}
```

### Busca em Múltiplos Sites

```typescript
const websites = [
  "https://site1.com/*",
  "https://site2.com/*"
];

const resultados = await busca.buscarProdutosMultiplosSites(
  "notebook",
  websites,
  3 // 3 resultados por site
);

// Combinar todos os resultados
const todosProdutos = busca.combinarResultados(resultados);
```

### Filtros por Preço

```typescript
// Filtrar produtos entreAOA$ 1000 eAOA$ 5000
const produtosFiltrados = busca.filtrarPorPreco(
  produtos,
  1000,  // preço mínimo
  5000   // preço máximo
);
```

## Métodos Disponíveis

### `buscarProdutos(params: SearchParams): Promise<SearchResult>`

Realiza busca em um único website.

**Parâmetros:**
- `searchTerm`: Termo de busca
- `website`: URL do website (pode usar wildcards como *)
- `numResults`: Número de resultados desejados

### `buscarProdutosMultiplosSites(searchTerm, websites, numResultsPerSite): Promise<SearchResult[]>`

Realiza busca em múltiplos websites simultaneamente.

### `combinarResultados(results: SearchResult[]): Product[]`

Combina resultados de múltiplas buscas em um único array.

### `filtrarPorPreco(produtos, precoMin?, precoMax?): Product[]`

Filtra produtos por faixa de preço.

### `criarRespostaBusca(produtos, sites, filtros?, tempoBusca?): BuscaResponse`

Cria uma resposta estruturada da busca.

## Tipos de Dados

### Product
```typescript
interface Product {
  name: string;
  price: string;
  image_url: string;
  description: string;
  product_url: string;
  currency_unit
}
```

### SearchParams
```typescript
interface SearchParams {
  searchTerm: string;
  website: string;
  numResults: number;
}
```

### SearchResult
```typescript
interface SearchResult {
  success: boolean;
  data?: ProductsResponse;
  error?: string;
}
```

## Exemplo Completo

```typescript
import { BuscaAutomatica } from './controllers/BuscaAtomatica';

async function exemploCompleto() {
  const busca = new BuscaAutomatica();
  
  try {
    // Buscar em múltiplos sites
    const websites = ["https://itec.co.ao/*"];
    const resultados = await busca.buscarProdutosMultiplosSites(
      "notebook HP",
      websites,
      5
    );
    
    // Combinar resultados
    const produtos = busca.combinarResultados(resultados);
    
    // Aplicar filtros
    const produtosFiltrados = busca.filtrarPorPreco(produtos, 1000, 5000);
    
    // Criar resposta estruturada
    const resposta = busca.criarRespostaBusca(
      produtosFiltrados,
      websites,
      { precoMin: 1000, precoMax: 5000 }
    );
    
    console.log(`Encontrados ${resposta.total} produtos`);
    
    return resposta;
  } catch (error) {
    console.error("Erro na busca:", error);
    return null;
  }
}
```

## Tratamento de Erros

A classe possui tratamento robusto de erros:
- Validação da API key do Firecrawl
- Validação dos dados retornados usando Zod
- Tratamento de falhas de rede/API
- Logs detalhados para debugging

## Considerações

1. **Rate Limiting**: A API Firecrawl possui limites de uso. Considere implementar delays entre requisições para sites múltiplos.

2. **Websites Suportados**: Nem todos os websites podem ser "crawled". Verifique a documentação do Firecrawl para limitações.

3. **Precisão dos Dados**: A qualidade dos dados extraídos depende da estrutura HTML do site alvo.

4. **Performance**: Buscas em múltiplos sites podem ser demoradas. Considere usar loading states na interface.
