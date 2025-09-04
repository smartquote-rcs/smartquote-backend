# Alterações na Rota de Geração de Relatórios

## Resumo das Mudanças

A rota `POST /api/relatorios/gerar/:cotacaoId` foi modificada para **gerar e fazer download direto** do relatório em PDF, em vez de salvar o arquivo no servidor.

## Comportamento Anterior

```typescript
// ❌ Comportamento antigo
POST /api/relatorios/gerar/123
// Resposta JSON:
{
  "success": true,
  "message": "Relatório gerado com sucesso",
  "data": {
    "pdfPath": "/path/to/file.pdf",
    "filename": "relatorio_cotacao_123_1234567890.pdf",
    "downloadUrl": "/api/relatorios/download/file.pdf"
  }
}
```

## Comportamento Atual

```typescript
// ✅ Comportamento novo
POST /api/relatorios/gerar/123
// Resposta: Stream de bytes do PDF
// Headers:
// Content-Type: application/pdf
// Content-Disposition: attachment; filename="relatorio_cotacao_123_1234567890.pdf"
// Content-Length: 12345
```

## Arquivos Modificados

### 1. `src/controllers/RelatoriosController.ts`

**Método:** `gerarRelatorio`

**Mudanças:**
- Chama `RelatorioService.gerarRelatorioParaDownload()` em vez de `verificarEgerarRelatorio()`
- Configura headers HTTP para download de PDF
- Envia o buffer do PDF diretamente na resposta
- Remove a resposta JSON com informações do arquivo

### 2. `src/services/RelatorioService.ts`

**Novos métodos adicionados:**

- `gerarRelatorioParaDownload(cotacaoId: number): Promise<Buffer>`
  - Gera o relatório e retorna como buffer
  - Não salva arquivo no disco

- `gerarPDFBuffer(data: RelatorioData): Promise<Buffer>`
  - Cria o PDF em memória usando streams
  - Retorna buffer para download direto

### 3. `src/routers/relatorios.routes.ts`

**Documentação atualizada:**
- Descrição da rota alterada para "Gera e faz download direto do relatório em PDF"

## Vantagens da Nova Implementação

1. **Não ocupa espaço em disco**: PDF é gerado em memória
2. **Download imediato**: Cliente recebe o arquivo diretamente
3. **Segurança**: Não deixa arquivos temporários no servidor
4. **Performance**: Elimina I/O de escrita/leitura de arquivo
5. **Simplicidade**: Uma única chamada para gerar e baixar

## Como Usar

### Com curl:
```bash
curl -X POST {$API_BASE_URL}/api/relatorios/gerar/123 -o relatorio.pdf
```

### Com JavaScript (fetch):
```javascript
const response = await fetch('/api/relatorios/gerar/123', {
  method: 'POST'
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'relatorio.pdf';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
}
```

### Com Postman/Insomnia:
1. Método: POST
2. URL: `http://localhost:2000/api/relatorios/gerar/:cotacaoId`
3. Na resposta, clique em "Download" ou "Send and Download"

## Compatibilidade

- ✅ **Não quebra compatibilidade** com o frontend
- ✅ **Rota mantém o mesmo endpoint**
- ✅ **Método HTTP permanece POST**
- ⚠️ **Resposta mudou**: agora é stream de bytes em vez de JSON

## Rotas Relacionadas Mantidas

- `GET /api/relatorios/download/:filename` - Mantida para downloads de arquivos existentes
- `GET /api/relatorios/status/:cotacaoId` - Mantida para verificar status
- `GET /api/relatorios/listar/:cotacaoId` - Mantida para listar relatórios
- `PUT /api/relatorios/proposta-email/:cotacaoId` - Mantida para propostas de email
- `GET /api/relatorios/proposta-email/:cotacaoId` - Mantida para obter propostas

## Teste

Execute o script de teste incluído:
```bash
node test-download-relatorio.js 123
```

Ou teste diretamente no browser/Postman conforme instruções no script.
