# Adaptação do Sistema de Busca Local para Schema Original

## Resumo das Modificações

### 1. Alterações na Base de Dados (migration_script.sql)

Execute o script `migration_script.sql` no Supabase SQL Editor para aplicar as seguintes mudanças:

#### Tabela `cotacoes`:
- **Campos tornados opcionais**: `aprovacao`, `motivo`, `aprovado_por`
- **Novos campos adicionados**:
  - `data_aprovacao` (timestamp)
  - `data_solicitacao` (timestamp, NOT NULL, default CURRENT_TIMESTAMP)
  - `prazo_validade` (date)
  - `status` (varchar, NOT NULL, default 'incompleta', CHECK completa/incompleta)
  - `observacoes` (text)
  - `condicoes` (jsonb, default '{}')
  - `orcamento_geral` (numeric, NOT NULL, default 0)
- **Campo alterado**: `faltantes` de ARRAY para jsonb (default '[]')

#### Tabela `produtos`:
- **Novos campos adicionados** (mantendo compatibilidade com campos existentes):
  - `codigo_sku` (varchar, UNIQUE)
  - `tags` (text[], default ARRAY[])
  - `descricao_geral` (text)
  - `categoria_geral` (varchar)
  - `disponibilidade` (varchar, default 'imediata', CHECK imediata/por encomenda/limitada)
  - `especificacoes_tecnicas` (jsonb, default '{}')
  - `dias_de_entrega` (integer)
  - `data_cadastro` (timestamp, default CURRENT_TIMESTAMP)
  - `status` (boolean, default true)

#### Tabela `cotacoes_itens`:
- **Novo campo**: `quantidade` (integer, NOT NULL, default 1, CHECK >= 1)

#### Nova tabela `cotacoes_produtos`:
- Relacionamento many-to-many entre cotações e produtos
- Chaves: `cotacao_id`, `produto_id`

### 2. Adaptações no Código

#### Compatibilidade com Schema Original:
O código foi adaptado para funcionar com ambos os schemas:
- **Campos de fallback**: Se `categoria_geral` não existir, usa `modelo`
- **Campos de fallback**: Se `descricao_geral` não existir, usa `descricao`
- **Migração de dados**: Copia automaticamente `codigo` para `codigo_sku` e `descricao` para `descricao_geral`

#### Arquivos Modificados:
1. **`cotacao_manager.py`**: Adaptado para trabalhar com campos opcionais e fallbacks
2. **`search_engine.py`**: Atualizado para usar campos de fallback na busca
3. **`main.py`**: Adaptado para exibir campos corretos nos resultados
4. **`weaviate_client.py`**: Atualizado schema do Weaviate para incluir campos de compatibilidade

### 3. Benefícios da Abordagem

#### Vantagens:
- ✅ **Compatibilidade total** com sistema existente
- ✅ **Migração incremental** sem quebrar funcionalidades
- ✅ **Flexibilidade** para usar campos novos ou antigos
- ✅ **Extensibilidade** futura mantida

#### Campos Mantidos do Schema Original:
- `codigo`, `modelo`, `descricao`, `unidade`, `image_url`, `produto_url`
- `cadastrado_por`, `atualizado_por` (relacionamentos com users)
- Estrutura de fornecedores existente

## Como Aplicar

### Passo 1: Executar Migração
```sql
-- Execute o conteúdo de migration_script.sql no Supabase SQL Editor
```

### Passo 2: Testar Sistema
```bash
# Execute testes para verificar compatibilidade
python main.py --help
```

### Passo 3: Popular Novos Campos (Opcional)
```sql
-- Exemplo: popular categoria_geral baseado em modelo
UPDATE produtos SET categoria_geral = modelo WHERE categoria_geral IS NULL;

-- Exemplo: popular tags baseado em alguma lógica existente
UPDATE produtos SET tags = ARRAY[modelo] WHERE tags = ARRAY[]::text[];
```

## Observações Importantes

1. **Campos obrigatórios preservados**: Todos os campos NOT NULL do schema original foram mantidos
2. **Foreign Keys mantidas**: Relacionamentos com `fornecedores` e `users` preservados
3. **Busca híbrida**: Funciona com campos antigos e novos automaticamente
4. **Dados existentes**: Não são perdidos, apenas enriquecidos com novos campos

## Próximos Passos

1. Executar o script de migração
2. Testar funcionalidades existentes
3. Configurar população automática dos novos campos via triggers ou scripts
4. Atualizar frontend para usar novos campos quando disponíveis
