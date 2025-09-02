# 📊 Sistema de Relatórios Automáticos

## Visão Geral

O sistema de relatórios foi implementado para gerar automaticamente documentos PDF quando uma cotação é marcada como "completa". Os relatórios incluem duas seções principais:

1. **📧 Proposta Comercial e Email de Resposta**
2. **🧠 Análise LLM - Top 5 Produtos por Query**

## 🔄 Fluxo Automático

### 1. Geração Automática
- Quando `POST /api/busca` é executado
- Se a cotação ficar com status "completa"
- O sistema gera automaticamente o relatório
- O caminho do PDF é salvo na tabela `cotacoes`

### 2. Campos Adicionados na Tabela `cotacoes`
```sql
relatorio_path: string        -- Caminho do arquivo PDF
relatorio_gerado_em: timestamp -- Data/hora de geração
```

## 🚀 APIs Disponíveis

### POST `/api/relatorios/gerar/:cotacaoId`
Gera um relatório manualmente para uma cotação específica.

**Resposta:**
```json
{
  "success": true,
  "message": "Relatório gerado com sucesso",
  "data": {
    "pdfPath": "/caminho/para/arquivo.pdf",
    "filename": "relatorio_cotacao_123_1234567890.pdf",
    "downloadUrl": "/api/relatorios/download/..."
  }
}
```

### GET `/api/relatorios/download/:filename`
Faz download do arquivo PDF gerado.

**Headers de Resposta:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="..."`

### GET `/api/relatorios/status/:cotacaoId`
Verifica o status de uma cotação e se há relatório disponível.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "cotacaoId": 123,
    "status": "completa",
    "estaProntaParaRelatorio": true,
    "orcamentoGeral": 1500.00,
    "relatorio": {
      "existe": true,
      "path": "/caminho/para/arquivo.pdf",
      "geradoEm": "2025-01-20T10:30:00.000Z",
      "downloadUrl": "/api/relatorios/download/..."
    }
  }
}
```

### GET `/api/relatorios/listar/:cotacaoId`
Lista informações completas da cotação e relatório.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "cotacao": {
      "id": 123,
      "status": "completa",
      "orcamentoGeral": 1500.00,
      "createdAt": "2025-01-20T09:00:00.000Z"
    },
    "prompt": {
      "textoOriginal": "Preciso de um computador para desenvolvimento",
      "dadosExtraidos": { ... }
    },
    "relatorio": {
      "existe": true,
      "path": "/caminho/para/arquivo.pdf",
      "geradoEm": "2025-01-20T10:30:00.000Z",
      "downloadUrl": "/api/relatorios/download/..."
    }
  }
}
```

## 📋 Estrutura do Relatório PDF

### Seção 1: Proposta Comercial
- **Cabeçalho**: Título, ID da cotação, data
- **Solicitação**: Texto original da solicitação
- **Resumo**: Total de itens, orçamento geral, status
- **Itens Incluídos**: Lista detalhada com preços e quantidades
- **Template de Email**: Proposta comercial pronta para envio

### Seção 2: Análise LLM
- **Top 5 por Query**: Ranking dos produtos encontrados
- **Justificativas**: Por que cada produto ficou em cada posição
- **Pontos Fortes/Fracos**: Análise técnica detalhada
- **Critérios de Avaliação**: Metodologia usada pelo LLM

## 🔧 Configuração

### Dependências
```bash
npm install pdfkit @types/pdfkit
```

### Variáveis de Ambiente
```env
GROQ_API_KEY=your_groq_api_key_here
```

### Diretório de Saída
Os PDFs são salvos em `./temp/` (criado automaticamente)

## 📝 Exemplo de Uso

### 1. Executar Busca Local
```bash
POST /api/busca
{
  "solicitacao": "Preciso de um computador para desenvolvimento",
  "searchWeb": true
}
```

### 2. Verificar Status
```bash
GET /api/relatorios/status/123
```

### 3. Download do Relatório
```bash
GET /api/relatorios/download/relatorio_cotacao_123_1234567890.pdf
```

## 🧠 Integração com LLM

### Filtro Python (search_engine.py)
- Função `_llm_escolher_indice` retorna `{"index": N, "relatorio": {...}}`
- Relatório inclui top 5, justificativas e critérios
- Dados são salvos no campo `payload.llm_relatorio`

### Filtro Node.js (buscaWorker.ts)
- Função `filtrarProdutosComLLM` retorna `{produtos: [], relatorio: {}}`
- Relatório é anexado ao produto selecionado
- Dados são salvos no campo `llm_relatorio`

## 🔍 Monitoramento

### Logs Automáticos
- `📊 [RELATORIO] Cotação X está completa. Gerando relatório automaticamente...`
- `✅ [RELATORIO] Relatório gerado automaticamente: /caminho/arquivo.pdf`
- `📋 [RELATORIO] Caminho do relatório salvo na cotação X`

### Verificação de Status
```bash
# Verificar se cotação está pronta
GET /api/relatorios/status/123

# Listar informações completas
GET /api/relatorios/listar/123
```

## 🚨 Tratamento de Erros

### Erros Comuns
1. **Cotação não encontrada**: Verificar ID da cotação
2. **Sem permissão**: Verificar autenticação (authMiddleware)
3. **Erro na geração**: Verificar logs do servidor
4. **Arquivo não encontrado**: Verificar se relatório foi gerado

### Fallbacks
- Se LLM falhar, relatório é gerado sem análise detalhada
- Se PDF falhar, erro é logado mas não interrompe o fluxo
- Relatórios antigos são mantidos mesmo se houver erro na nova geração

## 🔄 Manutenção

### Limpeza de Arquivos
- PDFs são salvos com timestamp único
- Considerar implementar limpeza automática de arquivos antigos
- Diretório `./temp/` pode ser limpo periodicamente

### Backup
- Relatórios são salvos localmente
- Considerar backup para storage externo (S3, etc.)
- Manter histórico de relatórios na base de dados

## 📈 Próximos Passos

### Melhorias Sugeridas
1. **Templates Personalizáveis**: Permitir customização do layout
2. **Múltiplos Formatos**: Suporte para DOCX, HTML
3. **Assinatura Digital**: Integração com certificados
4. **Envio Automático**: Email automático com relatório anexado
5. **Dashboard**: Interface para visualizar relatórios gerados

### Integrações
1. **Storage Cloud**: AWS S3, Google Cloud Storage
2. **Email Service**: SendGrid, AWS SES
3. **Notificações**: Webhooks, Slack, Teams
4. **Analytics**: Métricas de uso e performance
