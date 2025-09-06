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
 * Adiciona template de email com design suave
 */
public async render(data: RelatorioData) {
  const margin = this.margin;
  const pageWidth = this.doc.page.width;
  const contentWidth = pageWidth - (margin * 2);
  
  // Gerar template de email
  const emailTemplate = await this.gerarTemplateEmailTexto(data, true);
  const emailHeaderHeight = 35;
  const padding = 15;
    
  // Dividir o texto em linhas para controle manual de quebra
  const lines = emailTemplate.split('\n');
    
  // Função para desenhar header do email
  const drawEmailHeader = (y: number, isContinuation = false) => {
    const headerY = y;
    
    // Fundo do header suave
    this.doc
      .fill('#f8fafc')
      .rect(margin, headerY, contentWidth, emailHeaderHeight)
      .fillAndStroke('#f8fafc', '#e2e8f0');
    
    // Linha de destaque superior discreta
    this.doc
      .fill('#94a3b8')
      .rect(margin, headerY, contentWidth, 1)
      .fill();
    
    // Ícone do email simples
    this.doc
      .fill('#64748b')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('✉', margin + 15, headerY + 12);
      
    if (isContinuation) {
       return headerY + emailHeaderHeight + 5;
    }
    
    // Título do email
    const title = 'TEMPLATE DE E-MAIL RESPOSTA';
    this.doc
      .fill('#334155')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(title, margin + 35, headerY + 13);
    
    return headerY + emailHeaderHeight + 10;
  };
    
  // Função para desenhar box do email com bordas suaves
  const drawEmailBox = (startY: number, height: number) => {
    // Sombra muito sutil
    this.doc
      .fill('#f1f5f9')
      .rect(margin + 1, startY + 1, contentWidth - 2, height - 2)
      .fill();
    
    // Box principal com borda suave
    this.doc
      .fill('#ffffff')
      .rect(margin, startY, contentWidth, height)
      .fillAndStroke('#ffffff', '#cbd5e1');
    
    // Borda lateral discreta
    this.doc
      .fill('#e2e8f0')
      .rect(margin, startY, 2, height)
      .fill();
  };
    
  // Adicionar nova página
  this.doc.addPage();

  // Desenhar header inicial
  let currentY = drawEmailHeader(this.doc.y, false);
  let boxStartY = currentY;
  let textY = currentY + padding;
    
  // Desenhar box de fundo primeiro (estimativa inicial)
  const estimatedHeight = Math.min(620, lines.length * 18 + padding * 2);
  drawEmailBox(boxStartY, estimatedHeight);
    
  // Desenhar texto linha por linha
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';
    
    if (line.trim() === '') {
      textY += 8; // Espaço para linhas vazias
      continue;
    }
    
    // Verificar se precisa quebrar página
    const availableSpace = this.doc.page.height - textY - this.doc.page.margins.bottom - 50;
    
    if (availableSpace < 25 && i > 0) {
      // Quebrar página
      this.doc.addPage();
      
      // Desenhar header de continuação
      currentY = drawEmailHeader(this.doc.page.margins.top, true);
      boxStartY = currentY;
      textY = currentY + padding;
      
      // Desenhar nova box para a página
      const remainingLines = lines.length - i;
      const newBoxHeight = Math.min(650, remainingLines * 18 + padding * 2);
      drawEmailBox(boxStartY, newBoxHeight);
    }
    
    // Desenhar o texto da linha
    this.doc
      .fill('#374151')
      .fontSize(9)
      .font('Helvetica')
      .text(line, margin + 15, textY, {
        width: contentWidth - 30,
        lineGap: 2,
        continued: false
      });
    
    // Calcular altura real da linha e atualizar posição
    const lineHeight = this.doc.heightOfString(line, {
      width: contentWidth - 30,
      lineGap: 2
    });
    textY += lineHeight + 2;
  }
    
  // Atualizar posição final
  this.doc.y = textY + 15;
    
  // Linha final discreta
  this.doc
    .strokeColor('#f1f5f9')
    .lineWidth(0.5)
    .moveTo(margin, this.doc.y - 5)
    .lineTo(margin + contentWidth, this.doc.y - 5)
    .stroke();
}

  /**
   * Gera template de email em texto
   */
  private async gerarTemplateEmailTexto(data: RelatorioData, updateInDb: boolean):  Promise<string> {
    // Se já veio no payload, usar direto
    if (data.propostaEmail && data.propostaEmail.trim().length > 0) {
      return data.propostaEmail;
    }
    const totalAnalises = data.analiseLocal.length + data.analiseWeb.length;
    const valorTotal = data.orcamentoGeral.toLocaleString('pt-AO', { 
      style: 'currency', 
      currency: 'AOA',
      minimumFractionDigits: 2 
    });
 
  if (!API_BASE_URL) {
    // Sem API_BASE_URL, seguir com template default e não tentar persistir
    updateInDb = false;
  }

  const response = API_BASE_URL ? await fetch(`${API_BASE_URL}/api/relatorios/proposta-email/${data.cotacaoId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }) : undefined;
  if (response) {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro na requisição: ${response.status} - ${text}`);
    }

    const result = await response.json() as { success?: boolean; data?: { propostaEmail?: string }; };
    if (result.success && result.data && result.data.propostaEmail) {
      const emailTemplate = result.data.propostaEmail;
      return emailTemplate;
    }
  }

    const emailTemplate = `Prezado(a) ${data.cliente?.nome},

    Espero que esta mensagem o(a) encontre bem.

    Tenho o prazer de apresentar nossa proposta comercial detalhada para sua solicitação de cotação #${data.cotacaoId}.

    === RESUMO DA PROPOSTA ===

    • Investimento Total: ${valorTotal}
    • Prazo de Entrega: 5-10 dias úteis
    • Validade da Proposta: 30 dias

    === NOSSA METODOLOGIA ===

    Nossa equipe técnica realizou análise detalhada para garantir:
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

    if (updateInDb && API_BASE_URL) {
      await fetch(`${API_BASE_URL}/api/relatorios/proposta-email/${data.cotacaoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propostaEmail: emailTemplate })
      });
    }
  
    return emailTemplate;
  
}
}
