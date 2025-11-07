# 🚀 Instalação Rápida - Sistema de Audit Logs

## Passo 1: Executar a Migration no Banco de Dados

Execute o arquivo SQL no seu banco de dados PostgreSQL/Supabase:

```bash
# Localização do arquivo
migrations/create_audit_logs_system.sql
```

Ou via psql:
```bash
psql -U seu_usuario -d seu_banco -f migrations/create_audit_logs_system.sql
```

## Passo 2: Verificar se os Arquivos Foram Criados

Arquivos criados automaticamente:

```
✅ src/models/AuditLog.ts
✅ src/services/AuditLogService.ts
✅ src/controllers/AuditLogController.ts
✅ src/routers/auditLogs.routes.ts
✅ src/routers/index.ts (atualizado)
✅ src/examples/ExemploAuditLogs.ts
✅ docs/AUDIT_LOGS_README.md
✅ migrations/create_audit_logs_system.sql
✅ test-audit-logs.http
```

## Passo 3: Compilar o Projeto

```bash
npm run build
```

## Passo 4: Reiniciar o Servidor

```bash
npm start
# ou
npm run dev
```

## Passo 5: Testar as Rotas

Use o arquivo `test-audit-logs.http` no VS Code com a extensão REST Client, ou via curl:

```bash
# Criar um log
curl -X POST http://localhost:3000/audit-logs \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "seu-user-uuid",
    "action": "CREATE_QUOTE",
    "tabela_afetada": "cotacoes",
    "registo_id": 123,
    "detalhes_alteracao": {
      "descricao": "Teste"
    }
  }'

# Listar logs
curl -X GET "http://localhost:3000/audit-logs?limit=20" \
  -H "Authorization: Bearer SEU_TOKEN"

# Ver estatísticas
curl -X GET "http://localhost:3000/audit-logs/statistics" \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 📋 Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/audit-logs` | Criar log |
| GET | `/audit-logs` | Listar logs com filtros |
| GET | `/audit-logs/:id` | Buscar log por ID |
| GET | `/audit-logs/user/:userId` | Logs de um usuário |
| GET | `/audit-logs/action/:action` | Logs por ação |
| GET | `/audit-logs/table/:tableName` | Logs por tabela |
| GET | `/audit-logs/record/:tableName/:recordId` | Histórico de um registro |
| GET | `/audit-logs/statistics` | Estatísticas |
| DELETE | `/audit-logs/cleanup/:days` | Limpar logs antigos (min 30 dias) |

## 🔒 Autenticação

Todas as rotas requerem autenticação via header:
```
Authorization: Bearer SEU_TOKEN_JWT
```

## 📚 Documentação Completa

Consulte: `docs/AUDIT_LOGS_README.md`

## 💡 Exemplo de Uso no Código

```typescript
import { AuditLogService } from '../services/AuditLogService';

const auditLogService = new AuditLogService();

// Registrar uma ação
await auditLogService.create({
    user_id: req.user.id,
    action: 'CREATE_QUOTE',
    tabela_afetada: 'cotacoes',
    registo_id: newQuote.id,
    detalhes_alteracao: {
        descricao: quoteData.descricao
    }
});
```

## ✅ Checklist de Verificação

- [ ] Migration executada no banco
- [ ] Projeto compilado sem erros
- [ ] Servidor reiniciado
- [ ] Teste de criação de log funcionando
- [ ] Teste de listagem de logs funcionando
- [ ] Teste de estatísticas funcionando

## 🆘 Solução de Problemas

### Erro: "relation audit_logs does not exist"
→ Execute a migration: `migrations/create_audit_logs_system.sql`

### Erro: "Cannot find module auditLogs.routes"
→ Execute: `npm run build`

### Erro de autenticação
→ Certifique-se de enviar o token JWT no header Authorization

## 📞 Suporte

Para mais informações, consulte:
- `docs/AUDIT_LOGS_README.md` - Documentação completa
- `src/examples/ExemploAuditLogs.ts` - Exemplos de código
- `test-audit-logs.http` - Testes das rotas
