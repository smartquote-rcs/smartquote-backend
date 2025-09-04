# Testes de Notificações com Postman

## Base URL
```
http://localhost:2000
```

## 1. Criar uma Notificação
**POST** `/api/notifications`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "Teste de Notificação",
  "message": "Esta é uma notificação para testar a funcionalidade de lida/não lida",
  "type": "info",
  "user_id": "user-123"
}
```

## 2. Listar Todas as Notificações
**GET** `/api/notifications`

## 3. Marcar Notificação como Lida (Individual)
**PATCH** `/api/notifications/{id}/read`

Exemplo: `http://localhost:2000/api/notifications/1/read`

**Headers:**
```
Authorization: Bearer {seu-token-jwt}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "user_id": "user-123"
}
```

## 4. Marcar Múltiplas Notificações como Lidas
**PATCH** `/api/notifications/read/multiple`

**Headers:**
```
Authorization: Bearer {seu-token-jwt}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "ids": [1, 2, 3]
}
```

## 5. Listar Notificações Não Lidas
**GET** `/api/notifications/unread`

**Headers:**
```
Authorization: Bearer {seu-token-jwt}
```

## 6. Contar Notificações Não Lidas
**GET** `/api/notifications/unread/count`

**Headers:**
```
Authorization: Bearer {seu-token-jwt}
```

## 7. Marcar Todas as Notificações como Lidas
**PATCH** `/api/notifications/read/all`

**Headers:**
```
Authorization: Bearer {seu-token-jwt}
```

---

## Sequência de Teste Recomendada:

1. **Criar algumas notificações** usando o endpoint POST
2. **Listar todas** para ver o estado inicial (is_read = false)
3. **Marcar uma como lida** usando o endpoint individual
4. **Listar novamente** para ver a mudança
5. **Criar mais notificações**
6. **Marcar múltiplas como lidas**
7. **Usar os endpoints de contagem e listagem de não lidas**
8. **Marcar todas como lidas**

---

## Observações:
- As rotas que requerem autenticação precisam do token JWT no header Authorization
- O user_id deve ser passado nos requests autenticados (será extraído do token JWT)
- O campo is_read será automaticamente definido como true quando marcar como lida
- O campo read_at será preenchido com o timestamp atual
