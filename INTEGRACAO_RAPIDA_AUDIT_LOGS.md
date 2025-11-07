# 🎯 Guia de Integração Rápida - Audit Logs

## 🚀 3 Formas de Usar

### 1️⃣ **Forma Simples - Usando o Helper** (RECOMENDADO)

```typescript
import { auditLog } from '../utils/AuditLogHelper';

// Em qualquer controller
async create(req, res) {
    const userId = req.user.id;
    const newRecord = await db.create(req.body);
    
    // ✅ Uma linha registra tudo!
    await auditLog.logCreate(userId, 'produtos', newRecord.id, req.body);
    
    return res.json(newRecord);
}
```

### 2️⃣ **Forma Completa - Usando o Service**

```typescript
import { AuditLogService } from '../services/AuditLogService';

const auditLogService = new AuditLogService();

await auditLogService.create({
    user_id: userId,
    action: 'CREATE_QUOTE',
    tabela_afetada: 'cotacoes',
    registo_id: 123,
    detalhes_alteracao: { ... }
});
```

### 3️⃣ **Forma Automática - Via Middleware** (FUTURO)

```typescript
// TODO: Implementar middleware automático
app.use(auditLogMiddleware);
```

## 📦 Métodos do Helper Disponíveis

```typescript
// CRUD Básico
await auditLog.logCreate(userId, tableName, recordId, data);
await auditLog.logUpdate(userId, tableName, recordId, oldData, newData);
await auditLog.logDelete(userId, tableName, recordId, data);

// Autenticação
await auditLog.logLogin(userId, ip, userAgent);
await auditLog.logLogout(userId);
await auditLog.logPasswordChange(userId, method);

// Operações Especiais
await auditLog.logExport(userId, reportType, format, recordCount);
await auditLog.logEmailSent(userId, to, subject, success);
await auditLog.logBulkUpdate(userId, tableName, count, field, details);
await auditLog.logBulkDelete(userId, tableName, count, reason);
await auditLog.logStatusChange(userId, tableName, id, oldStatus, newStatus);
await auditLog.logImport(userId, tableName, count, source);

// Sistema
await auditLog.logAccessDenied(userId, resource, reason);
await auditLog.logError(userId, errorType, message, stack);

// Personalizado
await auditLog.log(userId, action, tableName, recordId, details);
```

## 📋 Checklist de Integração

### Para CADA Controller:

- [ ] **CREATE**: Adicionar `auditLog.logCreate()` após criar registro
- [ ] **UPDATE**: Adicionar `auditLog.logUpdate()` após atualizar
- [ ] **DELETE**: Adicionar `auditLog.logDelete()` antes de deletar
- [ ] **STATUS**: Adicionar `auditLog.logStatusChange()` ao mudar status
- [ ] **BULK**: Adicionar `auditLog.logBulk*()` em operações em lote

### Controllers Críticos (Prioridade Alta):

```typescript
✅ CotacoesController     → CREATE, UPDATE, DELETE, STATUS_CHANGE
✅ ProdutosController     → CREATE, UPDATE, DELETE, BULK_UPDATE
✅ FornecedoresController → CREATE, UPDATE, DELETE
✅ UserController         → CREATE, UPDATE, DELETE, PASSWORD_CHANGE
✅ AuthController         → LOGIN, LOGOUT, PASSWORD_RESET
✅ RelatoriosController   → EXPORT_REPORT
✅ EmailController        → SEND_EMAIL
```

## 💡 Exemplos Práticos

### ✅ Cotações Controller

```typescript
import { auditLog } from '../utils/AuditLogHelper';

export class CotacoesController {
    
    // CREATE
    async create(req, res) {
        const userId = req.user.id;
        const cotacao = await cotacaoService.create(req.body);
        
        await auditLog.logCreate(userId, 'cotacoes', cotacao.id, {
            descricao: req.body.descricao,
            valor_total: req.body.valor_total
        });
        
        return res.status(201).json(cotacao);
    }
    
    // UPDATE
    async update(req, res) {
        const userId = req.user.id;
        const id = req.params.id;
        const old = await cotacaoService.findById(id);
        const updated = await cotacaoService.update(id, req.body);
        
        await auditLog.logUpdate(userId, 'cotacoes', id, old, req.body);
        
        return res.json(updated);
    }
    
    // DELETE
    async delete(req, res) {
        const userId = req.user.id;
        const id = req.params.id;
        const cotacao = await cotacaoService.findById(id);
        
        await cotacaoService.delete(id);
        await auditLog.logDelete(userId, 'cotacoes', id, cotacao);
        
        return res.status(204).send();
    }
    
    // STATUS CHANGE
    async updateStatus(req, res) {
        const userId = req.user.id;
        const id = req.params.id;
        const { status, motivo } = req.body;
        const old = await cotacaoService.findById(id);
        
        await cotacaoService.updateStatus(id, status);
        await auditLog.logStatusChange(
            userId,
            'cotacoes',
            id,
            old.status,
            status,
            motivo
        );
        
        return res.json({ status });
    }
}
```

### ✅ Auth Controller

```typescript
import { auditLog } from '../utils/AuditLogHelper';

export class AuthController {
    
    async login(req, res) {
        const { email, password } = req.body;
        const user = await authService.authenticate(email, password);
        
        if (user) {
            await auditLog.logLogin(
                user.id,
                req.ip,
                req.get('user-agent')
            );
            
            return res.json({ token: generateToken(user) });
        }
        
        return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    async logout(req, res) {
        await auditLog.logLogout(req.user.id);
        return res.json({ message: 'Logout realizado' });
    }
    
    async changePassword(req, res) {
        const userId = req.user.id;
        await userService.updatePassword(userId, req.body.new_password);
        await auditLog.logPasswordChange(userId, 'manual');
        return res.json({ message: 'Senha alterada' });
    }
}
```

### ✅ Relatórios Controller

```typescript
import { auditLog } from '../utils/AuditLogHelper';

export class RelatoriosController {
    
    async exportToExcel(req, res) {
        const userId = req.user.id;
        const { tipo, filtros } = req.body;
        
        const dados = await relatorioService.generate(tipo, filtros);
        const file = await excelService.create(dados);
        
        await auditLog.logExport(
            userId,
            tipo,
            'XLSX',
            dados.length
        );
        
        return res.download(file);
    }
}
```

## ⚡ Dicas de Performance

1. **Não aguarde o log** (opcional):
```typescript
// Não bloqueia a resposta
auditLog.logCreate(userId, table, id, data).catch(console.error);

return res.json(data); // Responde imediatamente
```

2. **Use try-catch** nos logs críticos:
```typescript
try {
    await auditLog.logCreate(userId, table, id, data);
} catch (error) {
    console.error('Erro ao registrar audit log:', error);
    // Não interrompe o fluxo principal
}
```

3. **Limite o tamanho dos detalhes**:
```typescript
// ❌ Ruim - muito grande
await auditLog.logCreate(userId, table, id, hugeObject);

// ✅ Bom - apenas campos relevantes
await auditLog.logCreate(userId, table, id, {
    campo1: data.campo1,
    campo2: data.campo2
});
```

## 🔍 Consultando Logs

### Via API REST:
```bash
# Logs de um usuário
GET /audit-logs/user/{userId}

# Logs de uma ação
GET /audit-logs/action/CREATE_QUOTE

# Histórico de um registro
GET /audit-logs/record/cotacoes/123

# Estatísticas
GET /audit-logs/statistics
```

### Via Service:
```typescript
import { AuditLogService } from '../services/AuditLogService';

const service = new AuditLogService();

// Por usuário
const { data } = await service.findByUserId('user-id');

// Por ação
const { data } = await service.findByAction('CREATE_QUOTE');

// Por registro
const { data } = await service.findByRecord('cotacoes', 123);

// Estatísticas
const stats = await service.getStatistics();
```

## 🎯 Próximos Passos

1. **Instalar**: Execute `migrations/create_audit_logs_system.sql`
2. **Compilar**: `npm run build`
3. **Integrar**: Adicione logs nos controllers principais
4. **Testar**: Use `test-audit-logs.http`
5. **Monitorar**: Acompanhe via `/audit-logs/statistics`

## 📚 Documentação

- **Completa**: `docs/AUDIT_LOGS_README.md`
- **Instalação**: `INSTALACAO_AUDIT_LOGS.md`
- **Resumo**: `RESUMO_AUDIT_LOGS.md`
- **Exemplos Helper**: `src/examples/ExemploAuditLogHelper.ts`
- **Exemplos Service**: `src/examples/ExemploAuditLogs.ts`

## ✅ Pronto!

Agora você pode rastrear TODAS as ações do seu sistema! 🎉
