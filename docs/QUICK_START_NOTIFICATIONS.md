# 🚀 Guia Rápido - Sistema de Notificações

## ⚡ Instalação e Configuração

### 1. Configuração do Banco de Dados

Execute no seu Supabase:

```sql
-- Criar tabela de notificações
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  url_redir VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para performance
CREATE INDEX idx_notifications_subject_type ON notifications(subject, type);

-- Inserir dados de exemplo (opcional)
INSERT INTO notifications (title, subject, type, url_redir) VALUES
('Estoque Baixo', 'Mouse Gamer está com estoque baixo (2 unidades)', 'estoque_baixo', '/produtos/1'),
('Nova Cotação', 'Cotação criada para Teclado Mecânico', 'cotacao_criada', '/cotacoes/1'),
('Cotação Aprovada', 'Cotação aprovada para Monitor 24"', 'cotacao_aprovada', '/cotacoes/2');
```

### 2. Variáveis de Ambiente

No seu `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Inicialização Automática

O sistema já está configurado para inicializar automaticamente quando o servidor subir.

## 🎯 Teste Rápido

### 1. Testar API Básica

```bash
# Listar notificações
curl -X GET http://localhost:3333/api/notifications

# Criar notificação
curl -X POST http://localhost:3333/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Teste",
    "subject": "Notificação de teste",
    "type": "test"
  }'
```

### 2. Testar Monitoramento de Estoque

```bash
# Forçar verificação de estoque baixo
curl -X GET http://localhost:3333/api/notifications/estoque-baixo

# Limpar notificações obsoletas
curl -X DELETE http://localhost:3333/api/notifications/obsoletas
```

### 3. Testar Notificações de Cotações

As notificações de cotações são criadas automaticamente quando você:
- Criar uma cotação: `POST /api/cotacoes`
- Deletar uma cotação: `DELETE /api/cotacoes/:id`
- Atualizar aprovação: `PATCH /api/cotacoes/:id` com `{"aprovacao": true/false}`

## 📋 Checklist de Funcionamento

- [ ] Tabela `notifications` criada no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Servidor iniciado (logs de monitoramento aparecendo)
- [ ] API respondendo em `/api/notifications`
- [ ] Notificações sendo criadas automaticamente

## 🔧 Troubleshooting

### Problema: Notificações duplicadas
**Solução**: O sistema já previne duplicatas automaticamente via database constraints.

### Problema: Monitoramento não funciona
**Solução**: Verifique se há produtos cadastrados com estoque baixo e se o serviço está importado no `server.ts`.

### Problema: Erro de conexão com Supabase
**Solução**: Verifique as credenciais no `.env` e conectividade com o banco.

## 📊 Status do Sistema

Para verificar se tudo está funcionando, observe estes logs no console:

```
🔍 [ESTOQUE-MONITOR] Sistema de monitoramento inicializado. Próxima verificação em 30 minutos
📋 [NOTIF-SERVICE] NotificationService inicializado
✅ Servidor rodando na porta 3333
```

---

**Sistema pronto para uso! 🎉**
