# API de Busca Automática

Esta API permite realizar buscas automáticas de produtos em websites configurados usando a tecnologia Firecrawl.

## Endpoints Disponíveis

### 1. POST `/busca-automatica`

Realiza busca automática de produtos. O usuário envia apenas o produto, todas as outras configurações são controladas pelo sistema.

#### Request Body:
```json
{
  "produto": "HP PROBOOK"    // Obrigatório: nome do produto
}
```

#### Response (Sucesso):
```json
{
  "success": true,
  "message": "Busca realizada com sucesso. 15 produtos encontrados.",
  "data": {
    "produtos": [
      {
        "name": "HP ProBook 450 G10",
        "price": "R$ 3.500,00",
        "image_url": "https://...",
        "description": "Notebook HP ProBook...",
        "product_url": "https://..."
        currency_unit: "R$"
      },
      }
    ],
    "total": 15,
    "sites_pesquisados": [
      "https://itec.co.ao/*"
    ],
    "tempo_busca": 5432,
    "filtros_aplicados": {
      "precoMin": null,
      "precoMax": null
    }
  },
  "configuracoes_utilizadas": {
    "sites_pesquisados": ["ITEC Angola"],
    "resultados_por_site": 3,
    "filtros_preco": {
      "minimo": null,
      "maximo": null
    }
  }
}
```

#### Response (Erro):
```json
{
  "success": false,
  "message": "O campo 'produto' é obrigatório"
}
```

### 2. GET `/busca-automatica/sites`

Retorna lista de sites disponíveis para busca.

#### Response:
```json
{
  "success": true,
  "message": "Sites disponíveis para busca",
  "data": {
    "sites_ativos": [
      {
        "id": 1,
        "nome": "ITEC Angola",
        "url": "https://itec.co.ao/*",
        "ativo": true
      }
    ],
    "total_sites": 1,
    "configuracoes": {
      "numResultadosPorSite": 3,
      "precoMinimo": null,
      "precoMaximo": null,
      "sitesAtivos": true
    }
  }
}
```

### 3. GET `/busca-automatica/config`

Retorna configurações padrão do sistema.

#### Response:
```json
{
  "success": true,
  "data": {
    "numResultadosPorSite": 3,
    "precoMinimo": null,
    "precoMaximo": null,
    "sitesAtivos": true
  }
}
```

## Exemplos de Uso

### Busca Simples (Única forma de uso)

```bash
curl -X POST http://localhost:3000/busca-automatica \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "produto": "notebook HP"
  }'
```

O sistema automaticamente:
- Usa todos os sites ativos da base de dados
- Busca 3 produtos por site (configuração padrão)
- Aplica filtros de preço configurados no sistema (se houver)
- Retorna resultados combinados de todos os sites

## Configuração da Base de Dados

Atualmente, a API usa um array simulado para os sites:

```typescript
const sitesDatabase = [
  {
    id: 1,
    nome: "ITEC Angola",
    url: "https://itec.co.ao/*",
    ativo: true
  }
];
```

Para integrar com uma base de dados real, substitua este array por consultas à sua BD.

## Autenticação

Todas as rotas de busca requerem autenticação via middleware `authMiddleware`. Certifique-se de incluir o token de autorização no header das requisições.

## Variáveis de Ambiente

Certifique-se de que a variável `FIRECRAWL_API_KEY` está configurada no arquivo `.env`:

```env
FIRECRAWL_API_KEY=sua_chave_da_api_firecrawl
```

## Códigos de Status

- `200` - Sucesso
- `400` - Dados inválidos ou parâmetros obrigatórios em falta
- `401` - Não autorizado (token inválido/ausente)
- `500` - Erro interno do servidor

## Limitações

1. **Rate Limiting**: A API Firecrawl possui limites de uso
2. **Timeout**: Buscas podem demorar dependendo do número de sites
3. **Qualidade dos Dados**: Depende da estrutura HTML dos sites alvo
