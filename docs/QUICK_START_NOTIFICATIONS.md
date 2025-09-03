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

### 1. Primeiro, faça login para obter o token

```bash
# Criar uma conta (se não tiver)
curl -X POST http://localhost:3333/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Seu Nome",
    "email": "seu_email@example.com", 
    "password": "sua_senha_segura"
  }'

# Fazer login para obter token
curl -X POST http://localhost:3333/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu_email@example.com",
    "password": "sua_senha_segura"
  }'
```

**Importante**: Copie o `token` da resposta do login. Você precisará dele para os próximos comandos!

### 2. Testar API de Notificações (Com Token)

```bash
# Substitua SEU_TOKEN_AQUI pelo token obtido no login

# Listar notificações
curl -X GET http://localhost:3333/api/notifications \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Criar notificação
curl -X POST http://localhost:3333/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "title": "Teste",
    "subject": "Notificação de teste",
    "type": "test"
  }'
```

### 3. Testar Monitoramento de Estoque

```bash
# Forçar verificação de estoque baixo
curl -X GET http://localhost:3333/api/notifications/estoque-baixo \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Limpar notificações obsoletas
curl -X DELETE http://localhost:3333/api/notifications/obsoletas \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 4. Testar Notificações de Cotações

As notificações de cotações são criadas automaticamente quando você:
- Criar uma cotação: `POST /api/cotacoes` (precisa do token)
- Deletar uma cotação: `DELETE /api/cotacoes/:id` (precisa do token)  
- Atualizar aprovação: `PATCH /api/cotacoes/:id` com `{"aprovacao": true/false}` (precisa do token)

**Exemplo:**
```bash
# Criar uma cotação (gerará notificação automática)
curl -X POST http://localhost:3333/api/cotacoes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "produto_id": 1,
    "fornecedor_id": 1,
    "preco": 99.90,
    "quantidade": 10
  }'
```

## 📋 Checklist de Funcionamento

- [ ] Tabela `notifications` criada no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Usuário criado via `/api/auth/signup`
- [ ] Token obtido via `/api/auth/signin`
- [ ] Servidor iniciado (logs de monitoramento aparecendo)
- [ ] API respondendo em `/api/notifications` (com token)
- [ ] Notificações sendo criadas automaticamente

## 🔧 Troubleshooting

### Problema: "401 Unauthorized"
**Solução**: Verifique se você está enviando o header `Authorization: Bearer SEU_TOKEN` nos requests.

### Problema: Token expirado
**Solução**: Faça login novamente em `/api/auth/signin` para obter um novo token.

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
