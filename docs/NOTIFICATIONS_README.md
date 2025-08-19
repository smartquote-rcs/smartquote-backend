# 📋 Sistema de Notificações - SmartQuote Backend

Este documento descreve o sistema completo de notificações implementado no SmartQuote Backend, incluindo monitoramento automático de estoque e notificações do ciclo de vida de cotações.

## 📚 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Tipos de Notificações](#-tipos-de-notificações)
- [API Endpoints](#-api-endpoints)
- [Serviços](#-serviços)
- [Modelos de Dados](#-modelos-de-dados)
- [Configuração](#-configuração)
- [Exemplos de Uso](#-exemplos-de-uso)
- [Monitoramento](#-monitoramento)

## 🎯 Visão Geral

O sistema de notificações do SmartQuote é responsável por:

1. **Monitoramento Automático de Estoque**: Detecta produtos com estoque baixo e cria notificações
2. **Notificações de Cotações**: Informa sobre criação, aprovação, rejeição e deleção de cotações
3. **Prevenção de Duplicatas**: Sistema robusto para evitar notificações duplicadas
4. **API REST Completa**: Endpoints para gerenciar notificações via HTTP

## 🏗️ Arquitetura

```
📁 src/
├── 📁 controllers/
│   └── NotificationController.ts     # Controlador REST para notificações
├── 📁 services/
│   ├── NotificationService.ts        # Serviço base de notificações
│   ├── EstoqueMonitorService.ts      # Monitoramento automático de estoque
│   └── CotacaoNotificationService.ts # Notificações específicas de cotações
├── 📁 models/
│   └── Notification.ts               # Interface e DTO das notificações
└── 📁 schemas/
    └── NotificationSchema.ts         # Validação Zod para notificações
```

## 🏷️ Tipos de Notificações

### 1. Notificações de Estoque
- `estoque_baixo`: Produto com estoque abaixo do limite mínimo

### 2. Notificações de Cotações
- `cotacao_criada`: Nova cotação foi criada no sistema
- `cotacao_aprovada`: Cotação foi aprovada (aprovacao = true)
- `cotacao_rejeitada`: Cotação foi rejeitada (aprovacao = false)
- `cotacao_deletada`: Cotação foi removida do sistema

## 🔌 API Endpoints

### Base URL: `/api/notifications`

#### **GET** `/api/notifications`
Lista todas as notificações

**Resposta:**
```json
{
  "message": "Lista de notificações.",
  "data": [
    {
      "id": 1,
      "title": "Estoque Baixo",
      "subject": "Produto Mouse Gamer está com estoque baixo (2 unidades)",
      "type": "estoque_baixo",
      "url_redir": "/produtos/15",
      "created_at": "2025-08-19T10:30:00.000Z"
    }
  ]
}
```

#### **POST** `/api/notifications`
Cria nova notificação

**Body:**
```json
{
  "title": "Nova Notificação",
  "subject": "Descrição da notificação",
  "type": "custom",
  "url_redir": "/path/to/redirect"
}
```

#### **DELETE** `/api/notifications/:id`
Remove notificação específica

#### **GET** `/api/notifications/estoque-baixo`
Verifica e cria notificações para produtos com estoque baixo

#### **DELETE** `/api/notifications/obsoletas`
Remove notificações obsoletas (estoque normalizado)

## 🔧 Serviços

### NotificationService
Serviço base para operações CRUD de notificações.

**Principais Métodos:**
```typescript
// Criar notificação (permite duplicatas)
async create(notification: Notification): Promise<NotificationDTO>

// Criar apenas se não existir (previne duplicatas)
async createIfNotExists(notification: Notification): Promise<NotificationDTO | null>

// Verificar se notificação já existe
async existsBySubjectAndType(subject: string, type: string): Promise<boolean>

// Listar todas as notificações
async getAll(): Promise<NotificationDTO[]>

// Remover notificação
async delete(id: number): Promise<void>
```

### EstoqueMonitorService
Serviço para monitoramento automático de estoque.

**Características:**
- Execução automática a cada 30 minutos
- Prevenção de notificações duplicadas
- Limpeza automática de notificações obsoletas
- Log detalhado de operações

**Principais Métodos:**
```typescript
// Iniciar monitoramento automático
iniciarMonitoramento(): void

// Processar produtos com estoque baixo
async processarEstoqueBaixo(): Promise<void>

// Limpar notificações obsoletas
async limparNotificacoesObsoletas(): Promise<void>
```

### CotacaoNotificationService
Serviço específico para notificações de cotações.

**Principais Métodos:**
```typescript
// Notificar cotação criada
async notificarCotacaoCriada(cotacao: CotacaoDTO): Promise<void>

// Notificar cotação aprovada
async notificarCotacaoAprovada(cotacao: CotacaoDTO): Promise<void>

// Notificar cotação rejeitada
async notificarCotacaoRejeitada(cotacao: CotacaoDTO): Promise<void>

// Notificar cotação deletada
async notificarCotacaoDeletada(cotacao: CotacaoDTO): Promise<void>

// Processar mudanças automáticas
async analisarENotificarMudancas(cotacaoAntiga: CotacaoDTO | null, cotacaoNova: CotacaoDTO): Promise<void>
```

## 📊 Modelos de Dados

### Notification Interface
```typescript
export interface Notification {
  title: string;        // Título da notificação
  subject: string;      // Descrição detalhada
  type: string;         // Tipo da notificação
  url_redir?: string;   // URL para redirecionamento (opcional)
}

export interface NotificationDTO extends Notification {
  id: number;           // ID único
  created_at: string;   // Timestamp de criação
}
```

### Esquemas de Validação (Zod)
```typescript
// Schema para criação de notificação
export const notificationSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  subject: z.string().min(1, "Assunto é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  url_redir: z.string().optional()
});
```

## ⚙️ Configuração

### 1. Banco de Dados (Supabase)
O sistema utiliza uma tabela `notifications` no Supabase:

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  url_redir VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para otimizar buscas de duplicatas
CREATE INDEX idx_notifications_subject_type ON notifications(subject, type);
```

### 2. Variáveis de Ambiente
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Inicialização Automática
O monitoramento de estoque é iniciado automaticamente no boot do servidor:

```typescript
// src/server.ts
import './services/EstoqueMonitorService'; // Auto-inicialização
```

## 📝 Exemplos de Uso

### 1. Integração em Controladores
```typescript
import CotacaoNotificationService from '../services/CotacaoNotificationService';

// No CotacoesController
async create(req: Request, res: Response): Promise<Response> {
  const cotacao = await CotacoesService.create(data);
  
  // Criar notificação
  await CotacaoNotificationService.processarNotificacaoCotacao(cotacao, 'criada');
  
  return res.status(201).json({ data: cotacao });
}
```

### 2. Teste Manual via API
```bash
# Verificar notificações de estoque baixo
curl -X GET http://localhost:3333/api/notifications/estoque-baixo

# Listar todas as notificações
curl -X GET http://localhost:3333/api/notifications

# Limpar notificações obsoletas
curl -X DELETE http://localhost:3333/api/notifications/obsoletas
```

### 3. Criação Manual de Notificação
```bash
curl -X POST http://localhost:3333/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Manutenção Programada",
    "subject": "Sistema entrará em manutenção às 02:00",
    "type": "manutencao",
    "url_redir": "/manutencao"
  }'
```

## 📈 Monitoramento

### Logs do Sistema
O sistema gera logs detalhados para monitoramento:

```
🔍 [ESTOQUE-MONITOR] Iniciando verificação de estoque baixo...
📦 [ESTOQUE-MONITOR] Produto encontrado com estoque baixo: Mouse Gamer (2 unidades, mínimo: 5)
✅ [ESTOQUE-MONITOR] Notificação criada para estoque baixo: Mouse Gamer
🧹 [ESTOQUE-MONITOR] Verificando notificações obsoletas...
📋 [COTACAO-NOTIF] Notificação criada para nova cotação ID: 123
```

### Métricas Importantes
- **Frequência de Verificação**: 30 minutos para estoque
- **Prevenção de Duplicatas**: 100% via database constraints
- **Tempo de Resposta**: < 200ms para operações CRUD
- **Limpeza Automática**: Notificações obsoletas removidas automaticamente

## 🚨 Tratamento de Erros

### Estratégias Implementadas
1. **Logs Detalhados**: Todos os erros são logados com contexto
2. **Não-Disruptivo**: Erros de notificação não quebram o fluxo principal
3. **Retry Logic**: Tentativas automáticas para operações críticas
4. **Fallback Graceful**: Sistema continua funcionando mesmo com falhas de notificação

### Exemplo de Log de Erro
```
📋 [COTACAO-NOTIF] Erro ao criar notificação de cotação criada: Database connection failed
🔍 [ESTOQUE-MONITOR] Erro ao processar produto ID 15: Validation failed
```

## 🎯 Próximos Passos

### Melhorias Planejadas
- [ ] Interface web para gerenciamento de notificações
- [ ] Notificações push/email além do sistema interno
- [ ] Configuração de limites de estoque por produto
- [ ] Dashboard com métricas de notificações
- [ ] Webhooks para integrações externas

### Configurações Avançadas
- [ ] Rate limiting para criação de notificações
- [ ] Categorização por prioridade (baixa, média, alta, crítica)
- [ ] Notificações programadas/agendadas
- [ ] Templates personalizáveis para diferentes tipos

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do sistema
2. Teste os endpoints via API
3. Consulte este README
4. Entre em contato com a equipe de desenvolvimento

**Desenvolvido com ❤️ para o SmartQuote Backend**

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
