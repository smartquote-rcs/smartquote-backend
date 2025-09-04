# 📊 Relatórios de Exportação - CSV e XLSX

## Visão Geral

Além do relatório PDF completo, o sistema agora oferece relatórios resumidos em formato CSV e XLSX, contendo informações essenciais da cotação de forma mais estruturada e adequada para análise de dados.

## 🎯 Características dos Relatórios de Exportação

### Dados Incluídos
- **Informações da Cotação**: ID, status, orçamento geral, data de geração
- **Solicitação Original**: Texto da solicitação do usuário
- **Dados do Usuário**: Email, nome, posição (quando disponível)
- **Itens da Cotação**: Lista detalhada com preços, quantidades e origem
- **Itens Faltantes**: Lista de itens não encontrados (se houver)
- **Resumos**: Totais e estatísticas

### Formato dos Dados
- **Moeda**: AOA (Kwanza Angolana)
- **Data**: Formato brasileiro (DD/MM/AAAA)
- **Encoding**: UTF-8 com BOM (para compatibilidade com Excel)

## 📋 Endpoints Disponíveis

### 1. Relatório CSV
```http
POST /api/relatorios/gerar-csv/{cotacaoId}
```

**Descrição**: Gera relatório resumido em formato CSV
**Autenticação**: Obrigatória
**Formato de saída**: text/csv; charset=utf-8

**Exemplo de uso**:
```bash
curl -X POST \
  "http://localhost:3000/api/relatorios/gerar-csv/123" \
  -H "Authorization: Bearer seu_token_aqui" \
  --output relatorio.csv
```

### 2. Relatório XLSX
```http
POST /api/relatorios/gerar-xlsx/{cotacaoId}
```

**Descrição**: Gera relatório resumido em formato Excel (XLSX)
**Autenticação**: Obrigatória
**Formato de saída**: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

**Exemplo de uso**:
```bash
curl -X POST \
  "http://localhost:3000/api/relatorios/gerar-xlsx/123" \
  -H "Authorization: Bearer seu_token_aqui" \
  --output relatorio.xlsx
```

## 📄 Estrutura do Relatório CSV

```csv
RELATÓRIO DE COTAÇÃO - CSV

ID da Cotação:,123
Status:,completa
Orçamento Geral:,"AOA 1.250.000,00"
Data de Geração:,15/01/2025
Solicitação:,"Preciso de uma API KYC-AML para verificação bancária"

DADOS DO USUÁRIO
Email:,usuario@empresa.com
Nome:,João Silva
Posição:,Manager

ITENS DA COTAÇÃO
Nome,Descrição,Preço Unitário,Quantidade,Subtotal,Origem,Fornecedor
"API KYC-AML Premium","Sistema completo de verificação","AOA 500.000,00",1,"AOA 500.000,00",web,sistec.co.ao
"Licença Anual","Licença de uso por 12 meses","AOA 750.000,00",1,"AOA 750.000,00",local,fornecedor_local

RESUMO
Total de Itens:,2
Quantidade Total:,2
Valor Total:,"AOA 1.250.000,00"

ITENS FALTANTES
Item Solicitado
"Módulo de integração bancária"
```

## 📊 Estrutura do Relatório XLSX

### Aba 1: Informações Gerais
- Dados da cotação
- Solicitação original
- Dados do usuário

### Aba 2: Itens
- Lista completa de itens com formatação
- Resumo com totalizadores
- Células de moeda formatadas

### Aba 3: Itens Faltantes (se houver)
- Lista de itens não encontrados
- Detalhamento quando disponível

## 🔧 Integração Frontend

### JavaScript/TypeScript
```javascript
// Função para baixar relatório CSV
async function baixarRelatorioCSV(cotacaoId, token) {
  try {
    const response = await fetch(`/api/relatorios/gerar-csv/${cotacaoId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${cotacaoId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Erro ao baixar relatório CSV:', error);
  }
}

// Função para baixar relatório XLSX
async function baixarRelatorioXLSX(cotacaoId, token) {
  try {
    const response = await fetch(`/api/relatorios/gerar-xlsx/${cotacaoId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${cotacaoId}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Erro ao baixar relatório XLSX:', error);
  }
}
```

### React Component Exemplo
```jsx
import React from 'react';

const RelatorioButtons = ({ cotacaoId, token }) => {
  const baixarCSV = async () => {
    try {
      const response = await fetch(`/api/relatorios/gerar-csv/${cotacaoId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_${cotacaoId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const baixarXLSX = async () => {
    try {
      const response = await fetch(`/api/relatorios/gerar-xlsx/${cotacaoId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_${cotacaoId}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <div className="relatorio-buttons">
      <button onClick={baixarCSV} className="btn btn-outline">
        📄 Download CSV
      </button>
      <button onClick={baixarXLSX} className="btn btn-primary">
        📊 Download Excel
      </button>
    </div>
  );
};
```

## 🔒 Segurança

- **Autenticação**: Ambos endpoints requerem token Bearer válido
- **Autorização**: Verificação de permissões por middleware
- **Validação**: Validação de parâmetros e dados de entrada
- **Rate Limiting**: Recomenda-se implementar rate limiting para evitar abuso

## 🚀 Casos de Uso

### 1. Análise de Dados
- Import para sistemas de BI
- Análise de tendências de preços
- Relatórios gerenciais

### 2. Arquivo e Auditoria
- Backup estruturado de cotações
- Registros para auditoria
- Histórico de decisões

### 3. Integração com Sistemas
- ERP/CRM integration
- Sistemas de aprovação
- Workflows automatizados

## 🔄 Fluxo de Trabalho Recomendado

1. **Usuário acessa interface de cotações**
2. **Seleciona cotação desejada**
3. **Escolhe formato de exportação (CSV/XLSX)**
4. **Sistema gera e força download**
5. **Arquivo pode ser usado em análises externas**

## 📝 Notas Técnicas

- **Performance**: Relatórios são gerados em tempo real (sem cache)
- **Memória**: Otimizado para cotações de até 1000 itens
- **Encoding**: UTF-8 com BOM para compatibilidade Excel
- **Formatos**: Seguem padrões internacionais para máxima compatibilidade

## 🐛 Troubleshooting

### Problemas Comuns

1. **Arquivo CSV não abre corretamente no Excel**
   - Solução: O arquivo inclui BOM UTF-8 automaticamente

2. **Dados de moeda aparecem como texto**
   - Solução: No XLSX, células são formatadas automaticamente

3. **Caracteres especiais não aparecem**
   - Solução: Encoding UTF-8 com BOM resolve a maioria dos casos

4. **Token expirado**
   - Solução: Renovar token de autenticação e tentar novamente
