# Rotas de Proposta de E-mail

Este documento descreve as rotas relacionadas à proposta de e-mail da cotação. Todas as rotas estão no namespace ` /api/relatorios` e operam sobre a coluna `cotacoes.proposta_email`.

As três rotas são:
- `GET /api/relatorios/proposta-email/:cotacaoId`
- `PUT /api/relatorios/proposta-email/:cotacaoId`
- `POST /api/relatorios/proposta-email-ia/:cotacaoId`

Observação: no estado atual do código, essas três rotas estão públicas (sem `authMiddleware`). Ajuste conforme a necessidade de segurança do seu ambiente.

---

## 1) Obter proposta de e-mail

- Rota: `GET /api/relatorios/proposta-email/:cotacaoId`
- Finalidade: retornar a proposta de e-mail salva para uma cotação. Caso não exista, gera automaticamente um template padrão com base nos dados de relatório (via `RelatorioService.gerarDadosRelatorio`) e salva em `cotacoes.proposta_email`.

### Entrada
- Parâmetro de URL: `cotacaoId` (número inteiro)
- Corpo: nenhum

### Saída (200 OK)
```json
{
  "success": true,
  "message": "Proposta de email obtida com sucesso",
  "data": {
    "cotacaoId": 123,
    "propostaEmail": "Texto do email..."
  }
}
```

### Erros comuns
- `400` se `cotacaoId` for inválido.
- `404` se a cotação não existir.
- `500` se ocorrer erro ao gerar o template padrão.

---

## 2) Atualizar (ou criar) proposta de e-mail manualmente

- Rota: `PUT /api/relatorios/proposta-email/:cotacaoId`
- Finalidade: salvar/atualizar o texto de proposta de e-mail manualmente em `cotacoes.proposta_email`.

### Entrada
- Parâmetro de URL: `cotacaoId` (número inteiro)
- Corpo (JSON):
```json
{
  "propostaEmail": "Texto completo da proposta a ser salva"
}
```

### Saída (200 OK)
```json
{
  "success": true,
  "message": "Proposta de email atualizada com sucesso",
  "data": {
    "cotacaoId": 123,
    "propostaEmail": "Texto que foi salvo"
  }
}
```

### Erros comuns
- `400` se `cotacaoId` for inválido.
- `400` se `propostaEmail` estiver ausente ou vazio.
- `404` se a cotação não existir.
- `500` em falha de persistência no banco.

---

## 3) Gerar proposta de e-mail editada por IA (Gemini)

- Rota: `POST /api/relatorios/proposta-email-ia/:cotacaoId`
- Finalidade: gerar uma versão reformulada do e-mail usando IA (Google Gemini), combinando o e-mail original com um `promptModificacao`. Esta chamada NÃO persiste automaticamente o resultado em `cotacoes.proposta_email`; é apenas para gerar e retornar a sugestão de texto. Caso deseje salvar o resultado, use a rota `PUT` após a geração.

### Pré-requisitos
- Variável de ambiente `GEMINI_API_KEY` definida (e opcionalmente `GEMINI_MODEL`, default `gemini-2.0-flash`).

### Entrada
- Parâmetro de URL: `cotacaoId` (número inteiro)
- Corpo (JSON):
```json
{
  "emailOriginal": "Texto do email a ser reformulado",
  "promptModificacao": "Instruções de modificação, por ex.: 'deixar mais formal e resumido'"
}
```

### Saída (200 OK)
```json
{
  "success": true,
  "data": {
    "originalEmail": "...",
    "reformulatedEmail": "...",
    "prompt": "...", 
    "confidence": 85,
    "processedAt": "2025-09-08T06:00:00.000Z",
    "rawGeminiResponse": "..."
  }
}
```
- `reformulatedEmail`: texto do e-mail reformulado pela IA.
- `confidence`: indicador heurístico de confiança (0–100) baseado no tamanho relativo da resposta.
- `rawGeminiResponse`: resposta bruta do modelo (útil para auditoria/debug).

### Erros comuns
- `400` se `cotacaoId` for inválido.
- `400` se `emailOriginal` ou `promptModificacao` estiverem ausentes/vazios.
- `500` se não for possível obter os dados da cotação/relatório ou se ocorrer erro no serviço de IA.

---

## Fluxo recomendado

1. Chamar `GET /proposta-email/:cotacaoId` para obter (ou gerar automaticamente) um texto base.
2. Se desejar ajustes com IA, chamar `POST /proposta-email-ia/:cotacaoId` com `emailOriginal` sendo o texto atual e um `promptModificacao` com as instruções desejadas.
3. Se a versão produzida estiver boa, persistir com `PUT /proposta-email/:cotacaoId`.

---

## Notas adicionais

- A geração automática do template (no `GET`) utiliza `RelatorioService.gerarDadosRelatorio()` para compor dados de cliente, valores e análises, garantindo consistência com o relatório PDF.
- O serviço de IA usado é `GeminiInterpretationService.gerarTemplateEmailTextoIA()`, com reintentos e tratamento de sobrecarga temporária.
- Caso o seu ambiente requeira autenticação, aplique `authMiddleware` nas rotas conforme necessário.
