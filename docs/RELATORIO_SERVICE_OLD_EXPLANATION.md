 # Análise Detalhada do `RelatorioServiceOld.ts`

Este documento fornece uma explicação técnica e funcional completa do arquivo `src/services/RelatorioServiceOld.ts`, que era o sistema legado para geração de relatórios em PDF e templates de e-mail para cotações na plataforma SmartQuote.

## 1. Visão Geral e Objetivo

O `RelatorioServiceOld` é uma classe de serviço em TypeScript projetada para consolidar dados de uma cotação, processá-los e gerar dois principais artefatos:

1.  **Relatório em PDF**: Um documento profissional e visualmente rico, contendo uma análise detalhada da cotação, incluindo propostas comerciais, análise de produtos por IA (LLM) e resultados de buscas na web.
2.  **Template de E-mail**: Um texto formatado em ASCII art para ser copiado e colado em e-mails, resumindo as informações mais importantes da cotação de forma clara e organizada.

O serviço automatiza o processo de geração desses relatórios, sendo acionado após a conclusão de uma cotação.

## 2. Estrutura da Classe e Dependências

O serviço é implementado como uma classe `RelatorioServiceOld` e depende principalmente de:

-   **`pdfkit`**: Para a criação e manipulação de documentos PDF.
-   **`@supabase/supabase-js`**: Para a comunicação com o banco de dados Supabase, de onde todos os dados da cotação são extraídos.
-   **`fs`**: Para interagir com o sistema de arquivos, especialmente para salvar o PDF gerado.

## 3. Fluxo Principal de Geração de Relatório

O método público principal é o `gerarRelatorioFromCotacaoId(cotacaoId: number)`. O fluxo de execução é o seguinte:

1.  **Verificação de Status**: O serviço primeiro verifica se a cotação com o `cotacaoId` fornecido está com o status `CONCLUIDO`. Se não estiver, o processo é abortado.

2.  **Coleta de Dados**: O método `_fetchRelatorioData(cotacaoId: number)` é chamado para buscar e consolidar todos os dados necessários do banco de dados. Isso inclui:
    -   Dados da cotação (`cotacoes`).
    -   O prompt original do usuário (`prompts`).
    -   Itens da cotação e suas análises de IA (`cotacoes_itens`).
    -   Relatórios de busca web (`relatorios_web`).

3.  **Processamento e Mapeamento de Dados**: Os dados brutos do banco de dados são processados e mapeados para a interface `RelatorioData`. As principais etapas são:
    -   **`_mapAndParseItems`**: Os itens da cotação são agrupados por `query_id`. O `payload` JSON de cada item, que contém a análise do LLM, é parseado.
    -   **Ordenação**: Os produtos dentro de cada query são ordenados pelo `score` (pontuação) em ordem decrescente.
    -   **Estruturação**: Os dados são organizados na interface `RelatorioData`, que serve como uma fonte de verdade única para a geração do PDF.

4.  **Geração do PDF**: O método `_gerarPDF(data: RelatorioData)` orquestra a criação do documento PDF. Ele chama uma série de métodos privados, cada um responsável por renderizar uma seção específica do relatório:
    -   `adicionarCabecalho`: Renderiza o cabeçalho com o logo, título e informações da cotação.
    -   `adicionarSecaoProposta`: Apresenta um resumo comercial, incluindo o orçamento geral e o total de itens analisados.
    -   `adicionarSecaoAnaliseLLM`: Exibe a análise detalhada da IA, incluindo o produto recomendado, justificativa e um ranking "Top 5".
    -   `adicionarSecaoRelatoriosWeb`: Mostra os resultados das buscas na web, também com um ranking e análise.
    -   `adicionarTemplateEmail`: Renderiza o template de e-mail formatado em ASCII diretamente no PDF.
    -   `adicionarRodape`: Adiciona o rodapé com a marca e a numeração de página.

5.  **Salvamento e Notificação**:
    -   O PDF gerado é salvo no diretório `uploads/relatorios/`.
    -   Uma notificação é criada no sistema para informar o usuário sobre a disponibilidade do novo relatório.

## 4. Técnicas de Design e Geração de PDF

O `RelatorioServiceOld` emprega várias técnicas para criar um PDF visualmente atraente e profissional, replicando a aparência de um relatório de negócios.

### 4.1. Layout e Estilo Visual

-   **Cores e Seções**: Cada seção principal do relatório é codificada por cores para fácil distinção:
    -   **Cabeçalho**: Azul (`#3498db`)
    -   **Proposta Comercial**: Verde (`#27ae60`)
    -   **Análise LLM**: Roxo (`#8e44ad`)
    -   **Busca Web**: Vermelho (`#e74c3c`)
-   **Cards e Sombras**: As informações são organizadas em "cards" com bordas arredondadas, cores de fundo suaves e, em alguns casos, sombras para criar uma sensação de profundidade e hierarquia.
-   **Ícones e Elementos Visuais**: O relatório utiliza ícones (círculos numerados, medalhas para o ranking) para tornar a informação mais digestível e visualmente interessante.
-   **Tipografia**: Há um uso consistente de fontes (`Helvetica`, `Helvetica-Bold`), tamanhos e pesos diferentes para criar uma hierarquia clara entre títulos, subtítulos e corpo de texto.

### 4.2. Gerenciamento de Página e Conteúdo Dinâmico

-   **Quebra de Página Automática**: O método `verificarEspacoPagina(doc, alturaMinima)` é crucial. Antes de desenhar qualquer seção ou item grande, ele verifica se há espaço vertical suficiente na página atual. Se não houver, ele adiciona uma nova página (`doc.addPage()`), garantindo que o conteúdo não seja cortado.
-   **Cálculo de Altura Dinâmica**: Para elementos com texto de comprimento variável (como justificativas ou descrições de produtos), a altura do texto é calculada dinamicamente usando `doc.heightOfString()`. Isso permite que a altura do card que contém o texto seja ajustada, garantindo um layout coeso e sem sobreposições.

### 4.3. Renderização do Template de E-mail (ASCII Art)

-   A seção de e-mail é particularmente interessante. O método `gerarTemplateEmailFormatado` cria uma string formatada com caracteres ASCII para simular bordas, caixas e ícones.
-   Essa string é então renderizada no PDF usando uma fonte monoespaçada (`Courier`) para garantir que o alinhamento dos caracteres seja preservado, mantendo o estilo de "ASCII art".
-   O método `adicionarTemplateEmail` no PDF lida com a quebra de página para o bloco de texto do e-mail, adicionando um cabeçalho de continuação em novas páginas se necessário.

## 5. Análise Detalhada de Seções Específicas

### 5.1. `adicionarSecaoAnaliseLLM` - Técnicas Avançadas de Renderização

Este método é um dos mais complexos do sistema, responsável por renderizar a análise inteligente da IA com um design profissional e dinâmico.

#### 5.1.1. Cabeçalho da Seção com Gradiente Visual

```typescript
// Título da seção com gradiente visual
doc
  .fill('#8e44ad')
  .rect(margin - 20, doc.y - 10, contentWidth + 40, 45)
  .fillAndStroke('#8e44ad', '#7d3c98');

doc
  .fill('#ffffff')
  .fontSize(18)
  .font('Helvetica-Bold')
  .text('ANALISE INTELIGENTE - TOP 5 PRODUTOS', margin, doc.y + 10)
  .moveDown(1.5);
```

**Técnicas Utilizadas:**
- **Retângulo com Gradiente**: Cria um fundo roxo (`#8e44ad`) com borda mais escura (`#7d3c98`) para simular profundidade
- **Extensão das Margens**: `margin - 20` e `contentWidth + 40` fazem o cabeçalho se estender além das margens normais
- **Texto Branco Sobreposto**: Garante contraste máximo sobre o fundo colorido

#### 5.1.2. Processamento Iterativo por Query

O método processa cada query individualmente, criando uma estrutura hierárquica:

```typescript
data.queries.forEach((query, queryIndex) => {
  // Verificação de espaço dinâmica
  this.verificarEspacoPagina(doc, 150);
  
  // Card da query com ícone numerado
  const queryY = doc.y;
  doc
    .fill('#f8f9fa')
    .rect(margin, queryY, contentWidth, 40)
    .fillAndStroke('#f8f9fa', '#8e44ad');
  
  // Ícone circular numerado
  doc
    .fill('#8e44ad')
    .circle(margin + 20, queryY + 20, 12)
    .fill()
    .fill('#ffffff')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(`${queryIndex + 1}`, margin + 16, queryY + 16);
```

**Técnicas Avançadas:**
- **Ícones Numerados**: Círculos coloridos com números brancos para identificar cada query
- **Posicionamento Preciso**: Cálculos matemáticos para centralizar o texto no círculo (`margin + 16`, `queryY + 16`)

#### 5.1.3. Renderização da Escolha Principal com Altura Dinâmica

```typescript
if (rel.escolha_principal) {
  const choiceY = doc.y;
  
  // Calcular altura dinâmica do texto da escolha
  doc.fontSize(12).font('Helvetica-Bold');
  const escolhaHeight = doc.heightOfString(rel.escolha_principal, { 
    width: contentWidth - 40,
    lineGap: 2
  });
  const totalChoiceHeight = escolhaHeight + 60; // padding + header
  
  doc
    .fill('#e8f5e8')
    .rect(margin, choiceY, contentWidth, totalChoiceHeight)
    .fillAndStroke('#e8f5e8', '#27ae60');
```

**Inovações Técnicas:**
- **Cálculo Dinâmico de Altura**: `doc.heightOfString()` calcula a altura real do texto baseado na largura disponível
- **Padding Inteligente**: `escolhaHeight + 60` adiciona espaço para cabeçalho e margens
- **Card Verde Adaptativo**: A altura do card se ajusta automaticamente ao conteúdo

#### 5.1.4. Sistema de Ranking com Medalhas Coloridas

```typescript
rel.top_ranking.forEach((ranking: any, rankIndex: number) => {
  // Cálculo complexo de altura para cada item
  let itemHeight = 40; // padding inicial
  
  // Altura do nome do produto
  doc.fontSize(12).font('Helvetica-Bold');
  const nomeHeight = doc.heightOfString(ranking.nome || 'Produto sem nome', { 
    width: contentWidth - 220,
    lineGap: 2
  });
  itemHeight += Math.max(nomeHeight, 20) + 10;
  
  // Altura da justificativa
  if (ranking.justificativa) {
    doc.fontSize(9).font('Helvetica');
    const justHeight = doc.heightOfString(ranking.justificativa, { 
      width: contentWidth - 220,
      lineGap: 2
    });
    itemHeight += justHeight + 10;
  }
  
  // Sistema de medalhas coloridas
  const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#4a90e2', '#9b59b6'];
  const medalColor = medalColors[rankIndex] || '#95a5a6';
  
  // Medalha/posição
  doc
    .fill(medalColor)
    .circle(margin + 25, rankY + 25, 15)
    .fill()
    .fill('#ffffff')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text(`${ranking.posicao || rankIndex + 1}`, margin + 20, rankY + 20);
```

**Técnicas Sofisticadas:**
- **Cálculo Multi-Componente de Altura**: Soma as alturas de nome, justificativa, pontos fortes/fracos
- **Sistema de Medalhas**: Array de cores (ouro, prata, bronze, azul, roxo) para as 5 posições
- **Layout Responsivo**: Largura reservada para score/preço (`contentWidth - 220`)

#### 5.1.5. Mini-Cards de Pontos Fortes e Fracos

```typescript
// Pontos fortes e fracos em mini cards (lado a lado)
if (hasFortes || hasFracos) {
  const cardsY = currentY;
  const cardWidth = (contentWidth - 120) / 2;
  
  if (hasFortes) {
    // Card pontos fortes
    doc
      .fill('#d5f4e6')
      .rect(margin + 55, cardsY, cardWidth - 5, 35)
      .fillAndStroke('#d5f4e6', '#27ae60');
    
    doc
      .fill('#27ae60')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('PONTOS FORTES', margin + 60, cardsY + 5);
    
    const fortesText = ranking.pontos_fortes.slice(0, 2).join(', ');
    doc
      .fill('#2c3e50')
      .fontSize(7)
      .font('Helvetica')
      .text(fortesText, margin + 60, cardsY + 18, { 
        width: cardWidth - 15,
        lineGap: 1
      });
  }
```

**Técnicas de Layout Avançado:**
- **Layout Side-by-Side**: `cardWidth = (contentWidth - 120) / 2` divide o espaço igualmente
- **Truncamento Inteligente**: `slice(0, 2).join(', ')` limita a 2 pontos por card
- **Cores Semânticas**: Verde para pontos fortes, vermelho para fracos

### 5.2. `adicionarSecaoRelatoriosWeb` - Adaptação do Design

Este método replica a estrutura da análise LLM mas com adaptações específicas para dados web:

#### 5.2.1. Diferenças Principais

```typescript
// Esquema de cores vermelho para web
doc
  .fill('#e74c3c')
  .rect(margin - 20, doc.y - 10, contentWidth + 40, 45)
  .fillAndStroke('#e74c3c', '#c0392b');

// Informações específicas da web
doc
  .fill('#7f8c8d')
  .fontSize(9)
  .font('Helvetica')
  .text(`Data: ${new Date(relatorioWeb.timestamp).toLocaleDateString('pt-BR')} | `, margin + 45, webY + 35)
  .text(`Analisados: ${relatorioWeb.produtos_analisados} | `, margin + 180, webY + 35)
  .text(`Selecionados: ${relatorioWeb.produtos_selecionados}`, margin + 300, webY + 35);
```

**Adaptações Específicas:**
- **Cor Vermelha**: Diferencia visualmente da análise local (roxa)
- **Metadados Web**: Timestamp, produtos analisados/selecionados
- **URLs dos Produtos**: Campo adicional não presente na análise local

### 5.3. `verificarEspacoPagina` - Gerenciamento Inteligente de Páginas

```typescript
private verificarEspacoPagina(doc: PDFKit.PDFDocument, alturaMinima: number) {
  const espacoRestante = doc.page.height - doc.y - doc.page.margins.bottom;
  if (espacoRestante < alturaMinima) {
    doc.addPage();
  }
}
```

**Função Crítica:**
- **Prevenção de Cortes**: Garante que elementos não sejam divididos entre páginas
- **Cálculo Preciso**: `doc.page.height - doc.y - doc.page.margins.bottom`
- **Uso Universal**: Chamado antes de cada seção/item grande

## 6. Conclusão

O `RelatorioServiceOld.ts` era um sistema robusto e monolítico que combinava busca de dados, processamento e renderização complexa de PDF em um único arquivo. Ele se destacava pela alta qualidade visual dos relatórios gerados, utilizando técnicas avançadas de `pdfkit` para criar layouts dinâmicos e esteticamente agradáveis.

Embora eficaz, sua natureza monolítica o tornava difícil de manter e estender. A refatoração para um sistema mais modular (como o `RelatorioService` atual e seus componentes) foi um passo natural para melhorar a manutenibilidade, mas o desafio sempre foi preservar a rica fidelidade visual estabelecida por este serviço legado.
