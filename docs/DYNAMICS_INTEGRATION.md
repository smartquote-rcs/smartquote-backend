# 🔗 Integração Dynamics 365 - SmartQuote Backend

Este documento descreve a integração completa do SmartQuote com Microsoft Dynamics 365 para sincronização automática de cotações aprovadas.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Configuração](#-configuração)
- [Funcionalidades](#-funcionalidades)
- [API Endpoints](#-api-endpoints)
- [Fluxo Automático](#-fluxo-automático)
- [Testes e Validação](#-testes-e-validação)
- [Troubleshooting](#-troubleshooting)

## 🎯 Visão Geral

A integração com Dynamics 365 permite:

1. **Envio Automático**: Cotações aprovadas são automaticamente enviadas para o Dynamics
2. **Mapeamento de Dados**: Transformação automática de dados do SmartQuote para formato Dynamics
3. **Gestão de Configuração**: Interface para gerenciar configurações de conexão
4. **Sincronização em Lote**: Opção de reenviar todas as cotações aprovadas
5. **Logs Detalhados**: Rastreamento completo das operações

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Adicione no seu arquivo `.env`:

```env
# Dynamics 365 Integration Configuration
DYNAMICS_ORGANIZATION_ID=your-organization-id-here
DYNAMICS_ENVIRONMENT_ID=your-environment-id-here
DYNAMICS_WEB_API_ENDPOINT=https://yourorg.api.crm.dynamics.com/api/data/v9.0
DYNAMICS_DISCOVERY_ENDPOINT=https://disco.crm.dynamics.com/api/discovery/v9.0
DYNAMICS_ACCESS_TOKEN=your-access-token-here
```

### 2. Como Obter as Configurações

#### Organization ID
- Acesse o Power Platform Admin Center
- Selecione seu ambiente
- Copie o "Organization ID" nas configurações

#### Environment ID  
- No Power Platform Admin Center
- Copie o "Environment ID" do ambiente desejado

#### Web API Endpoint
- Formato: `https://{yourorg}.api.crm{region}.dynamics.com/api/data/v9.0`
- Exemplo: `https://contoso.api.crm.dynamics.com/api/data/v9.0`

#### Discovery Endpoint
- Formato: `https://disco.crm{region}.dynamics.com/api/discovery/v9.0`
- Exemplo: `https://disco.crm.dynamics.com/api/discovery/v9.0`

#### Access Token
- Obtido via Azure AD OAuth 2.0
- Pode ser configurado via API posteriormente

### 3. Exemplo de Arquivo .env.dynamics.example

Um arquivo de exemplo foi criado em `.env.dynamics.example` com todas as configurações necessárias.

## 🚀 Funcionalidades

### DynamicsIntegrationService

#### Principais Métodos:
- `processarCotacaoAprovada(cotacao)`: Processa e envia cotação aprovada
- `testarConexao()`: Verifica conectividade com Dynamics
- `obterInformacoesAmbiente()`: Obtém metadados do ambiente
- `atualizarConfig(config)`: Atualiza configurações dinamicamente

#### Mapeamento de Dados:
```typescript
// Estrutura enviada para Dynamics
{
  name: "Cotação #123 - Produto XYZ",
  quotenumber: "COT-123",
  description: "Cotação aprovada para produto XYZ - Motivo: Melhor preço",
  productname: "Produto XYZ",
  totalamount: 99.90,
  quantity: 10,
  suppliername: "Fornecedor ABC",
  statuscode: "approved",
  externalsourceid: "123",
  externalsource: "SmartQuote"
}
```

## 🔌 API Endpoints

### Base URL: `/api/dynamics`

#### **GET** `/api/dynamics/test-connection`
Testa conexão com Dynamics 365

**Resposta de Sucesso:**
```json
{
  "message": "Conexão com Dynamics 365 estabelecida com sucesso!",
  "status": "conectado"
}
```

#### **GET** `/api/dynamics/environment-info`
Obtém informações do ambiente Dynamics

#### **GET** `/api/dynamics/config`
Obtém configurações atuais (sem dados sensíveis)

**Resposta:**
```json
{
  "message": "Configurações do Dynamics 365",
  "data": {
    "organizationId": "your-org-id",
    "environmentId": "your-env-id",
    "webApiEndpoint": "https://yourorg.api.crm.dynamics.com/api/data/v9.0",
    "discoveryEndpoint": "https://disco.crm.dynamics.com/api/discovery/v9.0"
  }
}
```

#### **PATCH** `/api/dynamics/config`
Atualiza configurações

**Body:**
```json
{
  "organizationId": "new-org-id",
  "webApiEndpoint": "https://neworg.api.crm.dynamics.com/api/data/v9.0",
  "accessToken": "new-token"
}
```

#### **POST** `/api/dynamics/send-cotacao/:id`
Envia cotação específica para Dynamics (teste manual)

**Exemplo:**
```bash
curl -X POST http://localhost:3333/api/dynamics/send-cotacao/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST** `/api/dynamics/sync-approved`
Sincroniza todas as cotações aprovadas em lote

**Resposta:**
```json
{
  "message": "Sincronização concluída",
  "total": 5,
  "enviadas": 4,
  "falharam": 1,
  "resultados": [
    {
      "id": 123,
      "status": "enviada",
      "produto": "Mouse Gamer"
    },
    {
      "id": 124,
      "status": "falhou",
      "produto": "Teclado Mecânico"
    }
  ]
}
```

## 🔄 Fluxo Automático

### Quando uma Cotação é Aprovada:

1. **Trigger**: Cotação tem `aprovacao` alterada para `true`
2. **Notificação**: Sistema cria notificação de aprovação
3. **Integração Dynamics**: Automaticamente envia dados para Dynamics 365
4. **Logs**: Registra sucesso/falha da operação
5. **Não-disruptivo**: Falhas não interrompem o fluxo principal

### Fluxo Detalhado:
```
Cotação Aprovada
       ↓
CotacaoNotificationService.notificarCotacaoAprovada()
       ↓
DynamicsIntegrationService.processarCotacaoAprovada()
       ↓
transformCotacaoToDynamics() → sendToDynamics()
       ↓
POST /api/data/v9.0/quotes (Dynamics API)
       ↓
Logs de Sucesso/Erro
```

## 🧪 Testes e Validação

### 1. Testar Configuração

```bash
# Verificar configurações atuais
curl -X GET http://localhost:3333/api/dynamics/config \
  -H "Authorization: Bearer YOUR_TOKEN"

# Testar conexão
curl -X GET http://localhost:3333/api/dynamics/test-connection \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Teste Manual de Envio

```bash
# Enviar cotação específica (ID 123)
curl -X POST http://localhost:3333/api/dynamics/send-cotacao/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Sincronização em Lote

```bash
# Sincronizar todas as cotações aprovadas
curl -X POST http://localhost:3333/api/dynamics/sync-approved \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Atualizar Configurações

```bash
curl -X PATCH http://localhost:3333/api/dynamics/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "accessToken": "new-token-here",
    "webApiEndpoint": "https://neworg.api.crm.dynamics.com/api/data/v9.0"
  }'
```

## 📊 Logs do Sistema

### Logs de Sucesso:
```
🔄 [COTACAO-NOTIF] Enviando cotação aprovada para Dynamics 365...
📋 [DYNAMICS] Processando cotação aprovada ID: 123
🔄 [DYNAMICS] Enviando dados para: https://yourorg.api.crm.dynamics.com/api/data/v9.0/quotes
✅ [DYNAMICS] Dados enviados com sucesso. ID: abc-123-def
🎉 [COTACAO-NOTIF] Cotação 123 enviada para Dynamics com sucesso!
```

### Logs de Erro:
```
❌ [DYNAMICS] Erro ao enviar dados: HTTP 401: Unauthorized
⚠️ [COTACAO-NOTIF] Falha ao enviar cotação 123 para Dynamics (processo continua)
```

## 🔧 Troubleshooting

### Problema: "401 Unauthorized"
**Solução**: 
- Verifique se o `accessToken` está correto e não expirou
- Renove o token via Azure AD
- Atualize via `/api/dynamics/config`

### Problema: "404 Not Found" na API
**Solução**:
- Verifique se o `webApiEndpoint` está correto
- Confirme se a entidade `quotes` existe no seu Dynamics
- Ajuste o endpoint na transformação de dados se necessário

### Problema: Conexão falhando
**Solução**:
- Teste conectividade: `/api/dynamics/test-connection`
- Verifique firewall/proxy
- Confirme URLs de descoberta e API

### Problema: Dados não aparecem no Dynamics
**Solução**:
- Verifique mapeamento de campos no `transformCotacaoToDynamics()`
- Confirme permissões de escrita no Dynamics
- Revisar logs para erros de validação

### Problema: Token expirando constantemente
**Solução**:
- Implemente renovação automática de token
- Use refresh tokens
- Configure Application User no Dynamics para tokens de longa duração

## 🎯 Próximos Passos

### Melhorias Planejadas:
- [ ] Renovação automática de tokens OAuth
- [ ] Webhook para confirmação de recebimento
- [ ] Retry automático em caso de falhas temporárias
- [ ] Dashboard de monitoramento de integrações
- [ ] Mapeamento customizável de campos
- [ ] Suporte a múltiplos ambientes Dynamics

### Configurações Avançadas:
- [ ] Rate limiting para evitar sobrecarga da API
- [ ] Batch processing para múltiplas cotações
- [ ] Validação de schema antes do envio
- [ ] Criptografia de configurações sensíveis

---

## 📞 Suporte

Para dúvidas sobre a integração:
1. Verifique os logs do sistema
2. Teste conectividade via endpoints
3. Consulte documentação oficial do Dynamics 365
4. Entre em contato com a equipe de desenvolvimento

**Desenvolvido com ❤️ para o SmartQuote Backend + Dynamics 365**
