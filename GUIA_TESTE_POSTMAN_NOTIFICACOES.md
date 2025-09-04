# Guia Completo: Testando Notificações com Postman

## ✅ Configuração do Ambiente

**Base URL:** `http://localhost:2000` ou `http://localhost:2001`

**Cabeçalhos padrão para todas as requisições:**
```
Content-Type: application/json
```

## 🔧 Passo 1: Obter ou Criar um User ID

### Opção A: Criar um usuário (se necessário)
```
POST /api/users
Body:
{
  "name": "Usuario Teste",
  "email": "teste@example.com", 
  "password": "123456"
}
```

### Opção B: Fazer login para obter token JWT
```
POST /api/auth/login
Body:
{
  "email": "teste@example.com",
  "password": "123456"
}
```

**Resposta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-12345",
    "name": "Usuario Teste", 
    "email": "teste@example.com"
  }
}
```

⚠️ **IMPORTANTE:** Anote o `user.id` da resposta - você precisará dele!

## 🔔 Passo 2: Testar Notificações

### 1. Criar Notificação de Teste
```
POST /api/notifications
Headers:
  Content-Type: application/json

Body:
{
  "title": "Teste de Notificação",
  "message": "Esta é uma notificação para testar a funcionalidade de lida/não lida",
  "type": "info",
  "user_id": "user-12345"  // ← Use o ID real aqui
}
```

**Resposta esperada:**
```json
{
  "message": "Notificação criada com sucesso",
  "data": {
    "id": 1,
    "title": "Teste de Notificação",
    "is_read": false,
    "read_at": null,
    "user_id": "user-12345"
  }
}
```

### 2. Listar Todas as Notificações
```
GET /api/notifications
```

### 3. Marcar Notificação como Lida (Individual)
```
PATCH /api/notifications/1/read
Headers:
  Content-Type: application/json
  Authorization: Bearer SEU_TOKEN_JWT_AQUI

Body:
{
  "user_id": "user-12345"
}
```

### 4. Listar Notificações Não Lidas
```
GET /api/notifications/unread
Headers:
  Authorization: Bearer SEU_TOKEN_JWT_AQUI
```

### 5. Contar Notificações Não Lidas
```
GET /api/notifications/unread/count  
Headers:
  Authorization: Bearer SEU_TOKEN_JWT_AQUI
```

### 6. Marcar Múltiplas como Lidas
```
PATCH /api/notifications/read/multiple
Headers:
  Content-Type: application/json
  Authorization: Bearer SEU_TOKEN_JWT_AQUI

Body:
{
  "ids": [1, 2, 3]
}
```

### 7. Marcar Todas como Lidas
```
PATCH /api/notifications/read/all
Headers:
  Authorization: Bearer SEU_TOKEN_JWT_AQUI
```

## 🧪 Sequência de Teste Recomendada

### 1. Preparação
1. ✅ **Criar usuário** ou fazer login
2. ✅ **Anotar user_id** da resposta
3. ✅ **Anotar token JWT** (se aplicável)

### 2. Teste Básico  
1. 🔔 **Criar 3-4 notificações** com o mesmo `user_id`
2. 📋 **Listar todas** - verificar que `is_read = false`
3. ✅ **Marcar uma como lida** 
4. 📋 **Listar novamente** - verificar que uma tem `is_read = true`

### 3. Teste Avançado
1. 🔢 **Contar não lidas** - deve retornar o número correto
2. 📱 **Listar apenas não lidas**
3. ✅ **Marcar múltiplas como lidas**
4. 🔄 **Marcar todas como lidas**
5. 📊 **Verificar contador** - deve ser 0

## 🛠️ Troubleshooting

### Erro: "user_id é obrigatório"
- ✅ Certifique-se de incluir `user_id` no body da requisição
- ✅ Use o ID real do usuário que você criou/logou

### Erro: "Token inválido"  
- ✅ Certifique-se de incluir o header `Authorization: Bearer TOKEN`
- ✅ Use o token JWT válido obtido no login
- ✅ Verifique se o token não expirou

### Erro: "Notificação não encontrada"
- ✅ Verifique se o ID da notificação existe
- ✅ Use o ID correto retornado na criação

### Servidor não responde
- ✅ Certifique-se que o servidor está rodando na porta correta
- ✅ Verifique se não há erros no terminal do servidor

## 📋 Checklist Final

- [ ] Servidor rodando em `localhost:2000` ou `2001`
- [ ] Usuário criado e `user_id` anotado  
- [ ] Token JWT obtido (para rotas protegidas)
- [ ] Primeira notificação criada com sucesso
- [ ] Funcionalidade de "marcar como lida" testada
- [ ] Contador de não lidas funcionando
- [ ] Múltiplas operações testadas

---

## 🎯 Resultado Esperado

Ao final dos testes, você deve conseguir:
- ✅ Criar notificações com `is_read = false`
- ✅ Marcar como lidas individualmente  
- ✅ Ver `is_read = true` e `read_at` preenchido
- ✅ Contar notificações não lidas corretamente
- ✅ Listar apenas não lidas
- ✅ Marcar múltiplas/todas como lidas

Se todos esses pontos funcionarem, a implementação da funcionalidade de notificações lidas/não lidas está completa! 🎉
