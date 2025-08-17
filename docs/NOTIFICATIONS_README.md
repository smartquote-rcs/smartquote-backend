# Sistema de Notificações - Monitoramento de Estoque

Este módulo implementa um sistema completo de notificações com foco especial no monitoramento automático de estoque baixo.

## Funcionalidades

### 1. CRUD Básico de Notificações
- Criar notificações
- Listar todas as notificações
- Buscar notificação por ID
- Atualizar notificações
- Deletar notificações

### 2. Monitoramento Automático de Estoque
- Verificação periódica automática de produtos com estoque baixo
- Criação automática de notificações para produtos com estoque crítico
- Limpeza automática de notificações obsoletas (produtos reabastecidos)

## Endpoints da API

### Notificações Básicas

```
POST   /api/notifications              - Criar notificação
GET    /api/notifications              - Listar todas notificações
GET    /api/notifications/:id          - Buscar notificação por ID
PATCH  /api/notifications/:id          - Atualizar notificação
DELETE /api/notifications/:id          - Deletar notificação
```

### Monitoramento de Estoque

```
POST   /api/notifications/verificar-estoque     - Verificar estoque e criar notificações
POST   /api/notifications/verificacao-automatica - Executar verificação automática
DELETE /api/notifications/limpar-obsoletas      - Limpar notificações obsoletas
```

## Exemplos de Uso

### 1. Criar Notificação Manual

```bash
curl -X POST http://localhost:2000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Alerta Importante",
    "subject": "Sistema requer atenção",
    "type": "alert",
    "url_redir": "/dashboard"
  }'
```

### 2. Verificar Estoque Baixo

```bash
curl -X POST "http://localhost:2000/api/notifications/verificar-estoque?estoqueMinimo=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Listar Todas as Notificações

```bash
curl -X GET http://localhost:2000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Monitoramento Automático

O sistema inicia automaticamente quando o servidor é iniciado com as seguintes configurações padrão:

- **Estoque Mínimo**: 10 unidades
- **Intervalo de Verificação**: 30 minutos
- **Tipos de Notificação**: `estoque_baixo`

### Configuração Personalizada

Para personalizar o monitoramento, você pode usar os endpoints da API:

```javascript
// Exemplo de verificação manual com limite personalizado
fetch('/api/notifications/verificar-estoque?estoqueMinimo=15', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

## Estrutura de Dados

### Notification
```typescript
interface Notification {
  title: string;        // Título da notificação
  subject: string;      // Assunto/descrição
  type: string;         // Tipo (estoque_baixo, alert, info, etc.)
  url_redir?: string;   // URL de redirecionamento (opcional)
}
```

### NotificationDTO
```typescript
interface NotificationDTO extends Notification {
  id: number;           // ID único
  created_at: string;   // Data de criação
}
```

## Logs do Sistema

O sistema gera logs informativos:

```
📦 [ESTOQUE-MONITOR] Iniciando monitoramento automático (limite: 10, intervalo: 1800s)
📦 [ESTOQUE-MONITOR] 2 nova(s) notificação(ões) de estoque baixo criada(s)
📦 [ESTOQUE-MONITOR] 5 produto(s) com estoque baixo detectado(s)
```

## Exemplo de Resposta da API

### Verificação de Estoque
```json
{
  "message": "Verificação de estoque concluída.",
  "data": {
    "produtosComEstoqueBaixo": 3,
    "notificacoesCriadas": 2,
    "notificacoesJaExistentes": 1,
    "limiteUtilizado": 10,
    "produtos": [
      {
        "id": 1,
        "nome": "Parafuso M6",
        "estoque": 5,
        "codigo": "PAR001"
      },
      {
        "id": 2,
        "nome": "Porca M6",
        "estoque": 3,
        "codigo": "POR001"
      }
    ]
  }
}
```

## Integração com Frontend

Para integrar com o frontend, você pode:

1. **Polling**: Fazer requisições periódicas para `/api/notifications`
2. **WebSockets**: Implementar notificações em tempo real (futuro enhancement)
3. **Badge de Notificações**: Mostrar contador de notificações não lidas

### Exemplo React
```jsx
useEffect(() => {
  const fetchNotifications = async () => {
    const response = await fetch('/api/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setNotifications(data.data);
  };

  fetchNotifications();
  const interval = setInterval(fetchNotifications, 60000); // 1 minuto
  
  return () => clearInterval(interval);
}, []);
```

## Manutenção

### Limpeza de Notificações
É recomendado executar periodicamente a limpeza de notificações obsoletas:

```bash
curl -X DELETE "http://localhost:2000/api/notifications/limpar-obsoletas" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Monitoramento do Sistema
- Verificar logs do servidor para acompanhar o funcionamento
- Monitorar quantidade de notificações criadas vs. produtos com estoque baixo
- Ajustar limites de estoque conforme necessário
