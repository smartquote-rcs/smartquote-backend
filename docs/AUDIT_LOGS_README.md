# Sistema de Auditoria - Audit Logs

Sistema completo de auditoria para rastreamento de ações no SmartQuote Backend.

## 📋 Tabela no Banco de Dados

```sql
CREATE TABLE public.audit_logs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(auth_id),
    action varchar NOT NULL,
    tabela_afetada varchar,
    registo_id bigint,
    detalhes_alteracao jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);
```

## 🚀 Endpoints da API

### Base URL
```
/audit-logs
```

### 1. Criar Log de Auditoria
**POST** `/audit-logs`

**Body:**
```json
{
  "user_id": "uuid-do-usuario",
  "action": "CREATE_QUOTE",
  "tabela_afetada": "cotacoes",
  "registo_id": 123,
  "detalhes_alteracao": {
    "campo_alterado": "status",
    "valor_anterior": "pending",
    "valor_novo": "approved"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": "uuid-do-usuario",
  "action": "CREATE_QUOTE",
  "tabela_afetada": "cotacoes",
  "registo_id": 123,
  "detalhes_alteracao": {...},
  "created_at": "2025-11-07T10:00:00Z"
}
```

### 2. Listar Logs com Filtros
**GET** `/audit-logs?user_id=xxx&action=CREATE_QUOTE&limit=50&offset=0`

**Query Parameters:**
- `user_id` (opcional): UUID do usuário
- `action` (opcional): Tipo de ação
- `tabela_afetada` (opcional): Nome da tabela
- `registo_id` (opcional): ID do registro
- `start_date` (opcional): Data inicial (ISO 8601)
- `end_date` (opcional): Data final (ISO 8601)
- `limit` (opcional): Limite de resultados (padrão: 50)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Response:**
```json
{
  "data": [...],
  "count": 100,
  "limit": 50,
  "offset": 0
}
```

### 3. Buscar Log por ID
**GET** `/audit-logs/:id`

### 4. Buscar Logs de um Usuário
**GET** `/audit-logs/user/:userId?limit=50&offset=0`

### 5. Buscar Logs por Ação
**GET** `/audit-logs/action/:action?limit=50&offset=0`

### 6. Buscar Logs por Tabela
**GET** `/audit-logs/table/:tableName?limit=50&offset=0`

### 7. Buscar Logs de um Registro Específico
**GET** `/audit-logs/record/:tableName/:recordId?limit=50&offset=0`

### 8. Obter Estatísticas
**GET** `/audit-logs/statistics?start_date=2025-01-01&end_date=2025-12-31`

**Response:**
```json
{
  "total": 1500,
  "byAction": {
    "CREATE_QUOTE": 500,
    "UPDATE_PRODUCT": 300,
    "DELETE_SUPPLIER": 100
  },
  "byTable": {
    "cotacoes": 600,
    "produtos": 400,
    "fornecedores": 200
  },
  "byUser": {
    "user-uuid-1": 800,
    "user-uuid-2": 700
  },
  "byDate": {
    "2025-11-01": 50,
    "2025-11-02": 75
  }
}
```

### 9. Limpar Logs Antigos (Usar com Cuidado!)
**DELETE** `/audit-logs/cleanup/:days`

⚠️ **Atenção**: Mínimo de 30 dias. Deleta logs mais antigos que o número de dias especificado.

## 📝 Tipos de Ações Recomendadas

```typescript
// Ações CRUD básicas
'CREATE_QUOTE'
'UPDATE_QUOTE'
'DELETE_QUOTE'
'CREATE_PRODUCT'
'UPDATE_PRODUCT'
'DELETE_PRODUCT'
'CREATE_SUPPLIER'
'UPDATE_SUPPLIER'
'DELETE_SUPPLIER'

// Ações de autenticação
'USER_LOGIN'
'USER_LOGOUT'
'USER_REGISTER'
'PASSWORD_RESET'

// Ações especiais
'EXPORT_REPORT'
'SEND_EMAIL'
'PRICE_UPDATE'
'STATUS_CHANGE'
'BULK_DELETE'
'IMPORT_DATA'
```

## 💻 Exemplo de Uso no Código

```typescript
import { AuditLogService } from '../services/AuditLogService';

const auditLogService = new AuditLogService();

// Exemplo 1: Registrar criação de cotação
async function createQuote(userId: string, quoteData: any) {
  // Criar a cotação
  const newQuote = await createQuoteInDB(quoteData);
  
  // Registrar no audit log
  await auditLogService.create({
    user_id: userId,
    action: 'CREATE_QUOTE',
    tabela_afetada: 'cotacoes',
    registo_id: newQuote.id,
    detalhes_alteracao: {
      descricao: quoteData.descricao,
      valor_total: quoteData.valor_total
    }
  });
  
  return newQuote;
}

// Exemplo 2: Registrar atualização de produto
async function updateProduct(userId: string, productId: number, oldData: any, newData: any) {
  // Atualizar o produto
  await updateProductInDB(productId, newData);
  
  // Registrar no audit log
  await auditLogService.create({
    user_id: userId,
    action: 'UPDATE_PRODUCT',
    tabela_afetada: 'produtos',
    registo_id: productId,
    detalhes_alteracao: {
      campos_alterados: Object.keys(newData),
      valores_anteriores: oldData,
      valores_novos: newData
    }
  });
}

// Exemplo 3: Registrar login
async function onUserLogin(userId: string, loginDetails: any) {
  await auditLogService.create({
    user_id: userId,
    action: 'USER_LOGIN',
    detalhes_alteracao: {
      ip: loginDetails.ip,
      user_agent: loginDetails.userAgent,
      timestamp: new Date().toISOString()
    }
  });
}
```

## 🔒 Autenticação

Todas as rotas requerem autenticação via middleware `authMiddleware`.

**Header obrigatório:**
```
Authorization: Bearer <seu-token-jwt>
```

## 📊 Casos de Uso

### 1. Auditoria de Segurança
Rastrear todas as ações de um usuário específico:
```
GET /audit-logs/user/{userId}
```

### 2. Histórico de Alterações
Ver todas as mudanças em um registro específico:
```
GET /audit-logs/record/cotacoes/123
```

### 3. Análise de Atividades
Obter estatísticas para relatórios gerenciais:
```
GET /audit-logs/statistics?start_date=2025-01-01&end_date=2025-12-31
```

### 4. Conformidade (Compliance)
Exportar logs para auditoria externa:
```
GET /audit-logs?start_date=2025-01-01&end_date=2025-12-31&limit=1000
```

## ⚠️ Boas Práticas

1. **Sempre registre ações críticas**: criação, atualização, exclusão
2. **Inclua detalhes relevantes**: valores antigos e novos
3. **Use ações padronizadas**: mantenha consistência nos nomes das ações
4. **Não armazene dados sensíveis**: senhas, tokens, etc.
5. **Implemente rotação de logs**: use o endpoint de cleanup periodicamente
6. **Monitore o crescimento**: a tabela pode crescer rapidamente

## 🔧 Manutenção

### Limpar logs antigos (executar mensalmente)
```bash
# Deletar logs com mais de 90 dias
curl -X DELETE http://localhost:3000/audit-logs/cleanup/90 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Monitorar tamanho da tabela
```sql
SELECT 
    pg_size_pretty(pg_total_relation_size('audit_logs')) as tamanho_total,
    count(*) as total_registros
FROM audit_logs;
```

## 📈 Performance

Os seguintes índices são criados automaticamente para otimizar consultas:
- `idx_audit_logs_user_id` - Consultas por usuário
- `idx_audit_logs_action` - Consultas por ação
- `idx_audit_logs_tabela` - Consultas por tabela
- `idx_audit_logs_registo` - Consultas por registro específico

## 🐛 Troubleshooting

### Erro: "user_id e action são obrigatórios"
Certifique-se de enviar ambos os campos no body da requisição POST.

### Erro: "Por segurança, só é permitido deletar logs com mais de 30 dias"
O sistema impede a exclusão acidental de logs recentes. Use um valor >= 30 dias.

### Performance lenta em consultas
Verifique se os índices estão criados corretamente e considere adicionar filtros de data nas consultas.
