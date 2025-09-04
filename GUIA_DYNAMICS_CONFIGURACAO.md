# Guia: Configurando Dynamics 365 com GUIDs Reais

## 🚀 Passo 1: Consultar Entidades Padrão

Primeiro, execute esta requisição para obter os GUIDs reais do seu Dynamics:

```
GET http://localhost:2000/api/dynamics/entities
```

**Resposta esperada:**
```json
{
  "message": "Entidades padrão consultadas com sucesso",
  "data": {
    "accounts": [
      {
        "accountid": "12345678-1234-1234-1234-123456789abc",
        "name": "Conta Exemplo 1"
      },
      {
        "accountid": "87654321-4321-4321-4321-cba987654321", 
        "name": "Conta Exemplo 2"
      }
    ],
    "currencies": [
      {
        "transactioncurrencyid": "abcd1234-5678-9012-3456-789012345678",
        "currencyname": "Real Brasileiro",
        "isocurrencycode": "BRL"
      }
    ],
    "pricelevels": [
      {
        "pricelevelid": "xyz12345-abcd-efgh-ijkl-mnop12345678",
        "name": "Lista Padrão"
      }
    ]
  },
  "instructions": {
    "message": "Use os GUIDs abaixo no método transformCotacaoToDynamics",
    "accounts": "Escolha um accountid para usar como customerid_account", 
    "currencies": "Escolha um transactioncurrencyid para usar como moeda",
    "pricelevels": "Escolha um pricelevelid para usar como lista de preços"
  }
}
```

## 🔧 Passo 2: Atualizar Código com GUIDs Reais

Substitua os valores padrão no arquivo `DynamicsIntegrationService.ts`:

```typescript
// ⚠️ SUBSTITUA pelos GUIDs reais da consulta acima
const DEFAULT_ACCOUNT_GUID = "12345678-1234-1234-1234-123456789abc"; // GUID real da conta
const DEFAULT_CURRENCY_GUID = "abcd1234-5678-9012-3456-789012345678"; // GUID real da moeda  
const DEFAULT_PRICELEVEL_GUID = "xyz12345-abcd-efgh-ijkl-mnop12345678"; // GUID real da lista de preços
```

## 🧪 Passo 3: Testar Envio de Cotação

Após atualizar os GUIDs, teste o envio:

```
POST http://localhost:2000/api/dynamics/send-cotacao/306
Content-Type: application/json
```

**Possíveis resultados:**

### ✅ **Sucesso**
```json
{
  "message": "Cotação 306 enviada para Dynamics com sucesso!",
  "cotacao": {
    "id": 306,
    "produto": "Nome do Produto",
    "orcamento_geral": 1500.00,
    "aprovacao": true
  }
}
```

### ❌ **Erro - GUID Inválido**
```json
{
  "message": "Falha ao enviar cotação 306 para Dynamics",
  "cotacao": {
    "id": 306,
    "aprovacao": true
  }
}
```

**Logs do servidor mostrarão:**
```
❌ [DYNAMICS] Erro HTTP 400: {"error": {"message": "Invalid GUID"}}
```

### ❌ **Erro - Campo Obrigatório**
```
❌ [DYNAMICS] Erro HTTP 400: {"error": {"message": "Required field missing"}}
```

## 🛠️ Troubleshooting

### Problema: "Invalid GUID"
- ✅ Verifique se os GUIDs copiados estão corretos
- ✅ Certifique-se de não ter espaços ou caracteres extras
- ✅ GUIDs devem ter formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Problema: "Entity not found"
- ✅ O account/currency/pricelevel pode ter sido deletado
- ✅ Execute novamente `GET /api/dynamics/entities` para obter GUIDs atualizados

### Problema: "Access denied"
- ✅ Verifique se o app registration tem permissões para criar quotes
- ✅ Certifique-se que o usuário da aplicação tem acesso às entidades

## 📋 Checklist de Configuração

- [ ] **Passo 1**: Executar `GET /api/dynamics/entities` com sucesso
- [ ] **Passo 2**: Copiar GUIDs reais para o código
- [ ] **Passo 3**: Reiniciar o servidor após alterações
- [ ] **Passo 4**: Testar `POST /api/dynamics/send-cotacao/306`
- [ ] **Passo 5**: Verificar no Dynamics se a cotação foi criada

## 🎯 Resultado Final

Se tudo estiver configurado corretamente:

1. ✅ A cotação será criada no Dynamics 365
2. ✅ Aparecerá na lista de cotações (quotes)  
3. ✅ Terá os campos obrigatórios preenchidos
4. ✅ Logs mostrarão "Dados enviados com sucesso"

---

**⚠️ Importante:** Este é um teste inicial. Depois você pode personalizar os campos enviados conforme sua estrutura específica no Dynamics.
