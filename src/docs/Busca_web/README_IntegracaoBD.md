# Integração com Base de Dados - Busca Automática

A API de busca automática agora está totalmente integrada com a base de dados PostgreSQL/Supabase, eliminando a necessidade de dados simulados.

## 🗄️ **Estrutura da Base de Dados**

### Tabela `Fornecedores`
```sql
CREATE TABLE "Fornecedores"(
    "id" BIGINT NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "contato_email" VARCHAR(255) NOT NULL,
    "contato_telefone" VARCHAR(255) NOT NULL,
    "site" VARCHAR(255) NOT NULL,           -- URL do site para busca
    "observacoes" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT '1',   -- Controla se deve buscar neste site
    "cadastrado_em" DATE NOT NULL,
    "cadastrado_por" BIGINT NOT NULL,
    "atualizado_em" DATE NOT NULL,
    "atualizado_por" BIGINT NOT NULL
);
```

### Tabela `sistema` (opcional)
Pode ser usada para armazenar configurações globais do sistema.

## 🔄 **Como Funciona**

### 1. **Busca de Sites Ativos**
```typescript
// O sistema busca automaticamente fornecedores ativos com sites válidos
const sitesAtivos = await FornecedorService.getFornecedoresAtivos();
```

**Query SQL executada:**
```sql
SELECT id, nome, site, ativo 
FROM "Fornecedores" 
WHERE ativo = true 
  AND site IS NOT NULL 
  AND site != '';
```

### 2. **Formatação de URLs**
O sistema automaticamente formata as URLs para busca:
- `https://exemplo.com` → `https://exemplo.com/*`
- `https://exemplo.com/` → `https://exemplo.com/*`
- `https://exemplo.com/*` → `https://exemplo.com/*` (já correto)

### 3. **Configurações do Sistema**
```typescript
// Busca configurações da tabela sistema (com fallback para padrões)
const config = await FornecedorService.getConfiguracoesSistema();
```

## 📋 **Dados de Exemplo**

Baseando nos dados do seed fornecido:

```sql
INSERT INTO "Fornecedores" (
  "id","nome","contato_email","contato_telefone","site","ativo"
) VALUES
  (1,'Capas Brasil','contato@capasbrasil.com','+55 11 3333-3333','https://capasbrasil.com',TRUE),
  (2,'TechCase Imports','sales@techcaseimports.com','+1 650 555-0101','https://techcaseimports.com',TRUE),
  (3,'Protege Acessórios','hello@protege.com.br','+55 21 2222-2222','https://protege.com.br',TRUE);
```

## 🚀 **Exemplo de Requisição**

```bash
POST /busca-automatica
{
  "produto": "iPhone 13"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Busca realizada com sucesso. 9 produtos encontrados.",
  "data": {
    "produtos": [...],
    "total": 9,
    "sites_pesquisados": [
      "https://capasbrasil.com/*",
      "https://techcaseimports.com/*",
      "https://protege.com.br/*"
    ],
    "tempo_busca": 5432
  },
  "configuracoes_utilizadas": {
    "sites_pesquisados": ["Capas Brasil", "TechCase Imports", "Protege Acessórios"],
    "total_fornecedores": 3,
    "resultados_por_site": 3,
    "filtros_preco": {
      "minimo": null,
      "maximo": null
    }
  }
}
```

## ⚙️ **Configurações**

### Configurações Padrão (Hardcoded)
```typescript
{
  numResultadosPorSite: 3,
  precoMinimo: null,
  precoMaximo: null,
  sitesAtivos: true,
  timeout: 30000,
  retentativas: 2
}
```

### Para Usar Configurações da BD
Adicione dados na tabela `sistema` e o `FornecedorService.getConfiguracoesSistema()` irá buscá-los automaticamente.

## 🔧 **Administração**

### Para Adicionar Novo Site
```sql
INSERT INTO "Fornecedores" (
  "nome", "site", "ativo", ...
) VALUES (
  'Novo Fornecedor', 'https://novofornecedor.com', TRUE, ...
);
```

### Para Desativar Site
```sql
UPDATE "Fornecedores" 
SET "ativo" = FALSE 
WHERE "id" = 1;
```

### Para Listar Sites Ativos
```bash
GET /busca-automatica/sites
```

## 🔒 **Variáveis de Ambiente Necessárias**

```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
FIRECRAWL_API_KEY=sua_chave_firecrawl
```

## 🚨 **Tratamento de Erros**

- **Nenhum fornecedor ativo**: Retorna erro 400
- **Erro de conexão BD**: Retorna erro 500 com fallback para configurações padrão
- **Erro de validação**: Retorna erro 400 com detalhes do Zod

## 📈 **Benefícios da Integração**

- ✅ **Dinâmico**: Adicionar/remover sites sem alterar código
- ✅ **Controle granular**: Ativar/desativar sites individualmente
- ✅ **Auditoria**: Registro de quem cadastrou/atualizou fornecedores
- ✅ **Escalabilidade**: Suporte a quantos fornecedores forem necessários
- ✅ **Configurabilidade**: Configurações centralizadas na BD
