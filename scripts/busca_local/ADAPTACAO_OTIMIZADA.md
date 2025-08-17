# Adaptação OTIMIZADA do Sistema de Busca Local para Schema2
### ✅ Vantagens:
- **Semântica clara** - Campo `categoria` é mais claro que usar `modelo`
- **Flexibilidade** - `categoria` pode ser diferente de `modelo` no futuro
- **Mínima intervenção na DB** - Apenas 6 campos novos essenciais
- **Zero duplicação** - Campos únicos para cada conceito
- **Compatibilidade total** - Sistema existente não é afetado
- **Performance melhor** - Poucos campos = queries mais rápidas
- **Manutenção simples** - Estrutura clara e lógicalosofia da Adaptação

Esta versão **otimizada** segue o princípio de **mínima intervenção na base de dados** e **máxima adaptação no código**. Em vez de duplicar campos, o código foi adaptado para usar os campos existentes do schema2.sql.

## Mudanças na Base de Dados (MÍNIMAS)

### Script SQL: `migration_script_otimizado.sql`

Execute no Supabase SQL Editor para aplicar **apenas** as mudanças essenciais:

#### Tabela `cotacoes` - Mudanças Essenciais:
- ✅ **Campos tornados opcionais**: `aprovacao`, `motivo`, `aprovado_por`
- ✅ **Novos campos essenciais**:
  - `status` (varchar, essential para workflow)
  - `orcamento_geral` (numeric, essential para cálculos)
- ✅ **Campo alterado**: `faltantes` de ARRAY para jsonb (essential para flexibilidade)

#### Tabela `produtos` - Apenas Campos Essenciais:
- ✅ **`tags`** (text[], essential para busca)
- ✅ **`categoria`** (varchar, campo semântico dedicado)
- ✅ **`disponibilidade`** (varchar, essential para lógica de negócio)
- ✅ **`especificacoes_tecnicas`** (jsonb, essential para dados estruturados)

#### Tabela `cotacoes_itens`:
- ✅ **`quantidade`** (integer, essential)

#### Nova tabela:
- ✅ **`cotacoes_produtos`** (many-to-many relationship)

## Adaptações no Código (PRINCIPAIS)

### Mapeamento de Campos:

| Campo Novo (busca_local) | Campo Usado (schema2) | Justificativa |
|-------------------------|----------------------|---------------|
| `categoria` | Nova coluna `categoria` | Campo semântico dedicado (população inicial: modelo) |
| `descricao_geral` → | `descricao` | Usar campo original de descrição |
| ~~`codigo_sku`~~ | `codigo` | Usar campo existente diretamente |

### Arquivos Modificados:

1. **`cotacao_manager.py`**:
   - Usa nova coluna `categoria` com fallback para `modelo`
   - Usa diretamente `descricao` do schema original

2. **`search_engine.py`**:
   - Funções de relevância adaptadas para nova coluna `categoria`
   - Filtros do Weaviate atualizados para `categoria`
   - Busca BM25 usa campos corretos com fallbacks

3. **`main.py`**:
   - Exibição de resultados usa nova coluna `categoria`
   - Agregação por produto usa `categoria` como chave

4. **`weaviate_client.py`**:
   - Schema atualizado com campo `categoria`
   - Indexação usa nova coluna com fallback
   - População automática: categoria = modelo (inicial)

## Benefícios da Abordagem Otimizada

### ✅ Vantagens:
- **Mínima intervenção na DB** - Apenas 5 campos novos essenciais
- **Zero duplicação** - Não há campos redundantes
- **Compatibilidade total** - Sistema existente não é afetado
- **Performance melhor** - Menos campos = queries mais rápidas
- **Manutenção simpler** - Menos campos para sincronizar

### 🎯 Campos Preservados e Usados:
- `nome` → usado para busca principal
- `descricao` → usado como descrição principal
- `modelo` → usado como categoria
- `codigo` → usado diretamente (não duplicado)
- `preco`, `estoque` → usados diretamente
- Todos os campos de relacionamento mantidos

## Execução

### Passo 1: Migração Mínima
```sql
-- Execute migration_script_otimizado.sql no Supabase
-- Adiciona apenas 5 campos essenciais
```

### Passo 2: Teste de Compatibilidade
```bash
# Sistema deve funcionar imediatamente
python main.py --help
```

### Passo 3: População Inicial (Recomendado)
```sql
-- Popular categoria baseado em modelo (inicial)
UPDATE produtos SET categoria = modelo WHERE categoria IS NULL;

-- Popular tags baseado em modelo (exemplo)
UPDATE produtos SET tags = ARRAY[modelo] WHERE tags = ARRAY[]::text[];

-- Definir disponibilidade padrão
UPDATE produtos SET disponibilidade = 'imediata' WHERE disponibilidade IS NULL;
```

## Comparação com Versão Anterior

| Aspecto | Versão Anterior | Versão Otimizada |
|---------|----------------|------------------|
| Campos DB novos | 12 campos | 6 campos |
| Campo categoria | Usar `modelo` | Nova coluna `categoria` |
| Semântica | Confusa | Clara |
| Duplicação | Sim | Não |
| Compatibilidade | 100% | 100% |
| Performance | Boa | Melhor |
| Manutenção | Complexa | Simples |

## Estrutura Final

### Tabela `produtos` (campos principais):
```sql
-- Existentes (usados diretamente):
nome, descricao, modelo, codigo, preco, estoque

-- Novos (essenciais):
categoria, tags[], disponibilidade, especificacoes_tecnicas
```

### Busca Local (mapeamento):
```python
# No código:
categoria = produto.get('categoria') or produto.get('modelo')  # fallback
descricao = produto.get('descricao')   # campo original
codigo = produto.get('codigo')         # diretamente
```

## Resultado

Sistema de busca local **totalmente funcional** com **mínima intervenção** na base de dados existente, aproveitando ao máximo os campos já disponíveis e adicionando apenas o que é estritamente necessário para as funcionalidades avançadas.
