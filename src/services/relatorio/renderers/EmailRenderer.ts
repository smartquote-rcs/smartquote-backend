import PDFDocument from 'pdfkit';
import { RelatorioData } from '../types';

const API_BASE_URL = process.env.API_BASE_URL;

export class EmailRenderer {
  private doc: PDFKit.PDFDocument;
  private margin: number;

  constructor(doc: PDFKit.PDFDocument, margin: number = 50) {
    this.doc = doc;
    this.margin = margin;
  }

  /**
   * Verifica se há espaço suficiente na página atual
   */
  private verificarEspacoPagina(minHeight: number) {
    const currentY = this.doc.y;
    const pageHeight = this.doc.page.height;
    const bottomMargin = this.doc.page.margins.bottom;
    const availableSpace = pageHeight - bottomMargin - currentY;

    if (availableSpace < minHeight) {
      this.doc.addPage();
    }
  }

  /**
   * Adiciona template de email com design contínuo
   */
  public async render(data: RelatorioData) {
    const margin = this.margin;
    const pageWidth = this.doc.page.width;
    const contentWidth = pageWidth - (margin * 2);
    
  // Gerar template de email
  const emailTemplate = await this.gerarTemplateEmailTexto(data, true);
  const emailHeaderHeight = 45;
  const padding = 20;
    
  // Dividir o texto em linhas para controle manual de quebra
  const lines = emailTemplate.split('\n');
    
    // Função para desenhar header do email
    const drawEmailHeader = (y: number, isContinuation = false) => {
      const headerY = y;
      
      // Fundo do header
      this.doc
        .fill('#e67e22')
        .rect(margin - 15, headerY, contentWidth + 30, emailHeaderHeight)
        .fill();
      
      // Linha de destaque superior
      this.doc
        .fill('#f39c12')
        .rect(margin - 15, headerY, contentWidth + 30, 3)
        .fill();
      
      // Ícone do email
      this.doc
        .fill('#ffffff')
        .circle(margin + 30, headerY + 22, 16)
        .fill()
        .fill('#e67e22')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('@', margin + 25, headerY + 15);
      
      // Título do email
      const title = isContinuation ? 'TEMPLATE DE E-MAIL RESPOSTA (CONT.)' : 'TEMPLATE DE E-MAIL RESPOSTA';
      this.doc
        .fill('#ffffff')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(title, margin + 60, headerY + 18);
      
      return headerY + emailHeaderHeight + 15;
    };
    
    // Função para desenhar box do email com bordas
    const drawEmailBox = (startY: number, height: number) => {
      // Sombra
      this.doc
        .fill('#fff8e7')
        .rect(margin + 2, startY + 2, contentWidth - 4, height - 4)
        .fill();
      
      // Box principal
      this.doc
        .fill('#fffbf0')
        .rect(margin, startY, contentWidth, height)
        .fillAndStroke('#fffbf0', '#f39c12');
      
      // Borda lateral decorativa
      this.doc
        .fill('#e67e22')
        .rect(margin, startY, 5, height)
        .fill();
    };
    
    // Verificar espaço inicial
    this.verificarEspacoPagina(emailHeaderHeight + 100);
    
    // Desenhar header inicial
    let currentY = drawEmailHeader(this.doc.y, false);
    let boxStartY = currentY;
    let textY = currentY + padding;
    
    // Desenhar box de fundo primeiro (estimativa inicial)
    const estimatedHeight = Math.min(600, lines.length * 15 + padding * 2);
    drawEmailBox(boxStartY, estimatedHeight);
    
    // Desenhar texto linha por linha
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] || '';
      
      if (line.trim() === '') {
        textY += 10; // Espaço para linhas vazias
        continue;
      }
      
      // Verificar se precisa quebrar página
      const availableSpace = this.doc.page.height - textY - this.doc.page.margins.bottom - 50;
      
      if (availableSpace < 30 && i > 0) {
        // Quebrar página
        this.doc.addPage();
        
        // Desenhar header de continuação
        currentY = drawEmailHeader(this.doc.page.margins.top, true);
        boxStartY = currentY;
        textY = currentY + padding;
        
        // Desenhar nova box para a página
        const remainingLines = lines.length - i;
        const newBoxHeight = Math.min(650, remainingLines * 20 + padding * 2);
        drawEmailBox(boxStartY, newBoxHeight);
      }
      
      // Desenhar o texto da linha
      this.doc
        .fill('#2c3e50')
        .fontSize(10)
        .font('Helvetica')
        .text(line, margin + 20, textY, {
          width: contentWidth - 40,
          lineGap: 3,
          continued: false
        });
      
      // Calcular altura real da linha e atualizar posição
      const lineHeight = this.doc.heightOfString(line, {
        width: contentWidth - 40,
        lineGap: 3
      });
      textY += lineHeight + 3;
    }
    
    // Atualizar posição final
    this.doc.y = textY + 20;
    
    // Linha final decorativa
    this.doc
      .fill('#ecf0f1')
      .rect(margin, this.doc.y - 10, contentWidth, 2)
      .fill();
  }

  /**
   * Gera template de email em texto
   */
  private async gerarTemplateEmailTexto(data: RelatorioData, updateInDb: boolean):  Promise<string> {
    const totalAnalises = data.analiseLocal.length + data.analiseWeb.length;
    const valorTotal = data.orcamentoGeral.toLocaleString('pt-AO', { 
      style: 'currency', 
      currency: 'AOA',
      minimumFractionDigits: 2 
    });
 
  const response = await fetch(`${API_BASE_URL}/api/relatorios/proposta-email/${data.cotacaoId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
  const text = await response.text();
  throw new Error(`Erro na requisição: ${response.status} - ${text}`);
}

  const result = await response.json() as { success?: boolean; data?: { propostaEmail?: string }; };
  if (result.success && result.data && result.data.propostaEmail) {
    const emailTemplate = result.data.propostaEmail;
    return emailTemplate;
  } else {
    const emailTemplate = `Prezado(a) ${data.cliente?.nome},

    Espero que esta mensagem o(a) encontre bem.

    Tenho o prazer de apresentar nossa proposta comercial detalhada para sua solicitação de cotação #${data.cotacaoId}.

    === RESUMO DA PROPOSTA ===

    • Investimento Total: ${valorTotal}
    • Total de Análises Realizadas: ${totalAnalises}
    • Prazo de Entrega: 5-10 dias úteis
    • Validade da Proposta: 30 dias

    === NOSSA METODOLOGIA ===

    Utilizamos tecnologia de ponta com análise inteligente para garantir:
    ✓ Melhor custo-benefício do mercado
    ✓ Produtos de qualidade comprovada
    ✓ Análise comparativa detalhada
    ✓ Recomendações personalizadas

    === PRÓXIMOS PASSOS ===

    1. Análise da proposta apresentada
    2. Esclarecimento de dúvidas (se necessário)
    3. Aprovação e formalização do pedido
    4. Início da execução conforme cronograma

    === INFORMAÇÕES IMPORTANTES ===

    • Todos os preços incluem impostos aplicáveis
    • Condições de pagamento: A combinar
    • Garantia: Conforme especificação de cada produto
    • Suporte técnico: Incluído no primeiro ano

    Estamos à disposição para esclarecer qualquer dúvida e ajustar a proposta conforme suas necessidades específicas.

    Aguardamos seu retorno e esperamos iniciar esta parceria em breve.

    Atenciosamente,

    Equipe SmartQuote
    E-mail: contato@smartquote.ao
    Telefone: +244 XXX XXX XXX

    ---
    Este é um relatório gerado automaticamente pelo sistema SmartQuote.
    Para mais informações, visite: www.smartquote.ao`;

    if (updateInDb) {
      await fetch(`${API_BASE_URL}/api/relatorios/proposta-email/${data.cotacaoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propostaEmail: emailTemplate })
      });
    }
  
    return emailTemplate;
  }
}
}
