# Funcionalidade de Remoção de Faltantes

## Visão Geral

Este documento descreve as novas funcionalidades implementadas para gerenciar automaticamente o campo `faltantes` das cotações e permitir a remoção manual de elementos específicos.

## Funcionalidades Implementadas

### 1. Remoção Automática de Faltantes

Quando produtos são inseridos em uma cotação através do método `insertJobResultsInCotacao`, o sistema automaticamente:

- Identifica os produtos inseridos
- Remove os itens correspondentes do campo `faltantes`
- Atualiza o status da cotação para `completa` se não houver mais faltantes
- Mantém o status como `incompleta` se ainda existirem faltantes

#### Como Funciona

```typescript
// No WebBuscaJobService.insertJobResultsInCotacao()
for (const resultadoJob of resultadosCompletos) {
  const adicionados = await CotacoesItensService.insertJobResultItems(cotacaoId, resultadoJob);
  
  if (adicionados > 0 && resultadoJob.produtos) {
    for (const produto of resultadoJob.produtos) {
      // Busca e remove o faltante correspondente
      const indexToRemove = novosFaltantes.findIndex((faltante: any) => {
        return (faltante.nome && produto.name && 
                faltante.nome.toLowerCase().includes(produto.name.toLowerCase())) ||
               (faltante.query_sugerida && produto.name && 
                produto.name.toLowerCase().includes(faltante.query_sugerida.toLowerCase()));
      });
      
      if (indexToRemove !== -1) {
        novosFaltantes.splice(indexToRemove, 1);
      }
    }
  }
}

// Atualiza status se necessário
const novoStatus = novosFaltantes.length === 0 ? 'completa' : 'incompleta';
```

### 2. Rota para Remoção Manual de Faltantes

Nova rota: `POST /api/cotacoes/:id/remove-faltante`

#### Parâmetros

- **id** (path): ID da cotação
- **body**: Objeto com um dos seguintes campos:
  - `index`: Índice do elemento no array faltantes
  - `query`: Query sugerida para identificar o elemento
  - `nome`: Nome do produto para identificar o elemento

#### Exemplos de Uso

```typescript
// Remover por índice
POST /api/cotacoes/123/remove-faltante
{
  "index": 0
}

// Remover por query
POST /api/cotacoes/123/remove-faltante
{
  "query": "servidor"
}

// Remover por nome
POST /api/cotacoes/123/remove-faltante
{
  "nome": "Servidor Dell"
}
```

#### Resposta

```json
{
  "message": "Elemento removido dos faltantes com sucesso.",
  "data": {
    "elementoRemovido": { /* elemento removido */ },
    "faltantesRestantes": 2,
    "novoStatus": "incompleta",
    "cotacao": { /* cotação atualizada */ }
  }
}
```

## Implementação Técnica

### Arquivos Modificados

1. **`src/services/WebBuscaJobService.ts`**
   - Método `insertJobResultsInCotacao` atualizado para remover faltantes automaticamente
   - Atualização automática do status da cotação

2. **`src/controllers/CotacoesController.ts`**
   - Novo método `removeFaltante` para remoção manual
   - Validação de parâmetros
   - Atualização automática do status

3. **`src/routers/cotacoes.routes.ts`**
   - Nova rota `POST /:id/remove-faltante`

4. **`src/swagger.json`**
   - Documentação da nova rota na API

### Lógica de Atualização de Status

```typescript
// Se não há mais faltantes, marca como completa
const novoStatus = novosFaltantes.length === 0 ? 'completa' : 'incompleta';

await supabase
  .from('cotacoes')
  .update({ 
    faltantes: novosFaltantes,
    status: novoStatus
  })
  .eq('id', cotacaoId);
```

## Casos de Uso

### 1. Fluxo Automático (Recomendado)

```typescript
// Produtos são inseridos automaticamente
const inseridos = await webBuscaService.insertJobResultsInCotacao(cotacaoId, resultadosCompletos);

// Faltantes são removidos automaticamente
// Status é atualizado automaticamente
```

### 2. Remoção Manual

```typescript
// Remover um faltante específico
const response = await fetch(`/api/cotacoes/${cotacaoId}/remove-faltante`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'servidor' })
});

const result = await response.json();
console.log(`Status atualizado para: ${result.data.novoStatus}`);
```

## Benefícios

1. **Automatização**: Faltantes são removidos automaticamente quando produtos são inseridos
2. **Consistência**: Status da cotação é sempre atualizado corretamente
3. **Flexibilidade**: Permite remoção manual de faltantes específicos
4. **Rastreabilidade**: Logs detalhados de todas as operações
5. **API RESTful**: Interface padronizada e bem documentada

## Considerações de Segurança

- Validação de parâmetros de entrada
- Verificação de existência da cotação
- Tratamento de erros robusto
- Logs de auditoria para todas as operações

## Testes

Para testar as funcionalidades:

1. **Teste Automático**: Insira produtos via `insertJobResultsInCotacao`
2. **Teste Manual**: Use a rota `/remove-faltante` com diferentes parâmetros
3. **Verificação**: Confirme que o status é atualizado corretamente

## Exemplos de Código

Veja o arquivo `src/examples/ExemploRemoveFaltantes.ts` para exemplos completos de uso.

## Suporte

Para dúvidas ou problemas, consulte:
- Logs do sistema para detalhes das operações
- Documentação da API no Swagger
- Exemplos de código fornecidos

