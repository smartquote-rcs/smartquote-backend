import * as XLSX from 'xlsx';
import supabase from '../../infra/supabase/connect';

export interface RelatorioResumoData {
  cotacaoId: number;
  cotacaoStatus: string;
  orcamentoGeral: number;
  solicitacao: string;
  dataGeracao: Date;
  itens: ItemResumo[];
  dadosUsuario: {
    email?: string;
    position?: string;
    nome?: string;
  };
  faltantes?: any[];
}

export interface ItemResumo {
  nome: string;
  descricao: string;
  preco: number;
  quantidade: number;
  subtotal: number;
  origem: string;
  provider?: string;
}

export class ExportService {
  
  /**
   * Busca dados resumidos da cotação para exportação
   */
  async buscarDadosResumo(cotacaoId: number): Promise<RelatorioResumoData> {
  // Buscar dados da cotação
    const { data: cotacao, error: cotacaoError } = await supabase
      .from('cotacoes')
      .select(`
    id, status, orcamento_geral, prompt_id,
        prompt:prompts(id, texto_original, cliente)
      `)
      .eq('id', cotacaoId)
      .single();

    if (cotacaoError || !cotacao) {
      throw new Error(`Cotação ${cotacaoId} não encontrada: ${cotacaoError?.message || 'dados nulos'}`);
    }

    // Buscar dados do usuário (se houver cliente associado)
    let dadosUsuario: any = {};
    const prompt = (cotacao as any).prompt;
    
    // Extrair informações do cliente de forma mais simples
    if (prompt?.cliente) {
      if (typeof prompt.cliente === 'string') {
        dadosUsuario = { email: prompt.cliente };
      } else if (typeof prompt.cliente === 'object') {
        dadosUsuario = {
          email: prompt.cliente.email || prompt.cliente.nome || 'Cliente não informado',
          position: prompt.cliente.position || '',
          nome: prompt.cliente.nome || prompt.cliente.email || 'Cliente não informado'
        };
      }
    }

  // Buscar itens da cotação
    const { data: itens, error: itensError } = await supabase
      .from('cotacoes_itens')
      .select('*')
      .eq('cotacao_id', cotacaoId);

    if (itensError) {
      throw new Error(`Erro ao buscar itens da cotação: ${itensError.message}`);
    }

    // Processar itens (exclui placeholders com status=false)
    const itensProcessados: ItemResumo[] = (itens || [])
      .filter((item: any) => item.status !== false)
      .map(item => ({
      nome: item.item_nome || 'N/A',
      descricao: item.item_descricao || 'N/A',
      preco: parseFloat(item.item_preco || 0),
      quantidade: parseInt(item.quantidade || 1),
      subtotal: parseFloat(item.item_preco || 0) * parseInt(item.quantidade || 1),
      origem: item.origem || 'N/A',
      provider: item.provider || 'N/A'
    }));

    // Mapear placeholders (status=false) para manter compat no resumo
    const faltantesCompat = (itens || [])
      .filter((i: any) => i.status === false)
      .map((i: any) => i.pedido || i.item_nome || 'Item solicitado');

    return {
      cotacaoId: cotacao.id,
      cotacaoStatus: cotacao.status || 'N/A',
      orcamentoGeral: parseFloat(cotacao.orcamento_geral || 0),
      solicitacao: prompt?.texto_original || 'Solicitação não disponível',
      dataGeracao: new Date(),
      itens: itensProcessados,
      dadosUsuario,
      faltantes: faltantesCompat
    };
  }

  /**
   * Gera relatório em formato CSV
   */
  async gerarCSV(cotacaoId: number): Promise<string> {
    const dados = await this.buscarDadosResumo(cotacaoId);
    
    // Cabeçalho do CSV
    let csv = 'RELATÓRIO DE COTAÇÃO - CSV\n\n';
    csv += `ID da Cotação:,${dados.cotacaoId}\n`;
    csv += `Status:,${dados.cotacaoStatus}\n`;
    csv += `Orçamento Geral:,${dados.orcamentoGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'AOA' })}\n`;
    csv += `Data de Geração:,${dados.dataGeracao.toLocaleDateString('pt-BR')}\n`;
    csv += `Solicitação:,"${dados.solicitacao.replace(/"/g, '""')}"\n`;
    
    // Dados do usuário
    if (dados.dadosUsuario.email) {
      csv += '\nDADOS DO USUÁRIO\n';
      csv += `Email:,${dados.dadosUsuario.email}\n`;
      csv += `Nome:,${dados.dadosUsuario.nome || 'N/A'}\n`;
      csv += `Posição:,${dados.dadosUsuario.position || 'N/A'}\n`;
    }

    // Seção de itens
    csv += '\nITENS DA COTAÇÃO\n';
    csv += 'Nome,Descrição,Preço Unitário,Quantidade,Subtotal,Origem,Provider\n';
    
    dados.itens.forEach(item => {
      csv += `"${item.nome}","${item.descricao}",${item.preco},${item.quantidade},${item.subtotal},"${item.origem}","${item.provider || 'N/A'}"\n`;
    });

    // Total dos itens
    const totalItens = dados.itens.reduce((sum, item) => sum + item.subtotal, 0);
    csv += `\nTOTAL DOS ITENS:,${totalItens.toLocaleString('pt-BR', { style: 'currency', currency: 'AOA' })}\n`;

    // Itens faltantes (se houver)
    if (dados.faltantes && dados.faltantes.length > 0) {
      csv += '\nITENS FALTANTES\n';
      dados.faltantes.forEach((faltante, index) => {
        csv += `${index + 1},"${typeof faltante === 'string' ? faltante : JSON.stringify(faltante)}"\n`;
      });
    }

    return csv;
  }

  /**
   * Gera relatório em formato Excel (XLSX)
   */
  async gerarXLSX(cotacaoId: number): Promise<Buffer> {
    const dados = await this.buscarDadosResumo(cotacaoId);
    
    // Criar workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Informações Gerais
    const infoData = [
      ['RELATÓRIO DE COTAÇÃO'],
      [''],
      ['ID da Cotação', dados.cotacaoId.toString()],
      ['Status', dados.cotacaoStatus],
      ['Orçamento Geral', `AOA ${dados.orcamentoGeral.toLocaleString('pt-BR')}`],
      ['Data de Geração', dados.dataGeracao.toLocaleDateString('pt-BR')],
      [''],
      ['SOLICITAÇÃO'],
      [dados.solicitacao],
      [''],
    ];

    // Adicionar dados do usuário
    if (dados.dadosUsuario.email) {
      infoData.push(['DADOS DO USUÁRIO']);
      infoData.push(['Email', dados.dadosUsuario.email]);
      infoData.push(['Nome', dados.dadosUsuario.nome || 'N/A']);
      infoData.push(['Posição', dados.dadosUsuario.position || 'N/A']);
      infoData.push(['']);
    }

    const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
    
    // Aplicar estilização à aba de Informações Gerais
    this.aplicarEstilizacao(infoSheet, infoData.length, 2); // 2 colunas
    
    XLSX.utils.book_append_sheet(workbook, infoSheet, 'Informações Gerais');

    // Sheet 2: Itens
    const itensData = [
      ['ITENS DA COTAÇÃO'],
      [''],
      ['Nome', 'Descrição', 'Preço Unitário', 'Quantidade', 'Subtotal', 'Origem', 'Provider']
    ];

    dados.itens.forEach(item => {
      itensData.push([
        item.nome,
        item.descricao,
        `AOA ${item.preco.toLocaleString('pt-BR')}`,
        item.quantidade.toString(),
        `AOA ${item.subtotal.toLocaleString('pt-BR')}`,
        item.origem,
        item.provider || 'N/A'
      ]);
    });

    // Adicionar total
    const totalItens = dados.itens.reduce((sum, item) => sum + item.subtotal, 0);
    itensData.push(['']);
    itensData.push(['TOTAL', '', '', '', `AOA ${totalItens.toLocaleString('pt-BR')}`, '', '']);

    const itensSheet = XLSX.utils.aoa_to_sheet(itensData);
    
    // Aplicar estilização à aba de Itens
    this.aplicarEstilizacao(itensSheet, itensData.length, 7); // 7 colunas
    this.aplicarEstilizacaoTabela(itensSheet, 3, dados.itens.length + 1, 7); // Cabeçalho na linha 3
    
    XLSX.utils.book_append_sheet(workbook, itensSheet, 'Itens');

    // Sheet 3: Faltantes (se houver)
    if (dados.faltantes && dados.faltantes.length > 0) {
      const faltantesData = [
        ['ITENS FALTANTES'],
        [''],
        ['#', 'Descrição']
      ];

      dados.faltantes.forEach((faltante, index) => {
        faltantesData.push([
          (index + 1).toString(),
          typeof faltante === 'string' ? faltante : JSON.stringify(faltante)
        ]);
      });

      const faltantesSheet = XLSX.utils.aoa_to_sheet(faltantesData);
      
      // Aplicar estilização à aba de Faltantes
      this.aplicarEstilizacao(faltantesSheet, faltantesData.length, 2); // 2 colunas
      this.aplicarEstilizacaoTabela(faltantesSheet, 3, dados.faltantes.length, 2); // Cabeçalho na linha 3
      
      XLSX.utils.book_append_sheet(workbook, faltantesSheet, 'Faltantes');
    }

    // Converter para buffer
    const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return xlsxBuffer;
  }

  /**
   * Aplica estilização básica à planilha (largura das colunas)
   */
  private aplicarEstilizacao(sheet: any, numRows: number, numCols: number) {
    // Definir largura automática das colunas
    const colWidths = [];
    
    for (let col = 0; col < numCols; col++) {
      let maxWidth = 12; // Largura mínima aumentada
      
      for (let row = 0; row < numRows; row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellRef];
        if (cell && cell.v) {
          const cellLength = String(cell.v).length;
          maxWidth = Math.max(maxWidth, Math.min(cellLength + 3, 60)); // Máximo 60, padding +3
        }
      }
      
      colWidths.push({ wch: maxWidth });
    }
    
    sheet['!cols'] = colWidths;

    // Aplicar estilo aos títulos principais (primeira linha)
    const titleStyle = {
      fill: {
        fgColor: { rgb: "2F5597" } // Azul escuro
      },
      font: {
        bold: true,
        color: { rgb: "FFFFFF" },
        size: 14
      },
      alignment: {
        horizontal: "center",
        vertical: "center"
      }
    };

    // Aplicar ao título da primeira linha
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (sheet[titleCell]) {
      sheet[titleCell].s = titleStyle;
    }

    // Estilo para subtítulos (como "DADOS DO USUÁRIO", "SOLICITAÇÃO")
    const subtitleStyle = {
      fill: {
        fgColor: { rgb: "B7C9E4" } // Azul claro
      },
      font: {
        bold: true,
        color: { rgb: "000000" },
        size: 12
      },
      alignment: {
        horizontal: "left",
        vertical: "center"
      }
    };

    // Procurar e aplicar estilo aos subtítulos
    for (let row = 1; row < numRows; row++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
      const cell = sheet[cellRef];
      if (cell && cell.v && typeof cell.v === 'string') {
        const value = cell.v.toString().toUpperCase();
        if (value.includes('DADOS DO') || value.includes('SOLICITAÇÃO') || value.includes('ITENS DA COTAÇÃO') || value.includes('FALTANTES')) {
          cell.s = subtitleStyle;
        }
      }
    }
  }

  /**
   * Aplica estilização específica para tabelas (cabeçalho colorido)
   */
  private aplicarEstilizacaoTabela(sheet: any, headerRow: number, numDataRows: number, numCols: number) {
    // Criar estilos para o cabeçalho
    const headerStyle = {
      fill: {
        fgColor: { rgb: "4F81BD" } // Azul escuro profissional
      },
      font: {
        bold: true,
        color: { rgb: "FFFFFF" }, // Branco
        size: 11
      },
      alignment: {
        horizontal: "center",
        vertical: "center"
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    // Estilo para linhas alternadas (zebra)
    const evenRowStyle = {
      fill: {
        fgColor: { rgb: "F2F2F2" } // Cinza muito claro
      },
      border: {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } }
      }
    };

    const oddRowStyle = {
      border: {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } }
      }
    };

    // Aplicar estilo ao cabeçalho
    for (let col = 0; col < numCols; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRow - 1, c: col }); // -1 porque array é 0-indexed
      if (!sheet[cellRef]) sheet[cellRef] = { v: "" };
      sheet[cellRef].s = headerStyle;
    }

    // Aplicar estilo alternado às linhas de dados
    for (let row = headerRow; row < headerRow + numDataRows; row++) {
      const isEvenRow = (row - headerRow) % 2 === 0;
      const rowStyle = isEvenRow ? evenRowStyle : oddRowStyle;
      
      for (let col = 0; col < numCols; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!sheet[cellRef]) sheet[cellRef] = { v: "" };
        sheet[cellRef].s = rowStyle;
      }
    }

    // Estilo especial para linha TOTAL
    const totalRowIndex = headerRow + numDataRows;
    const totalStyle = {
      fill: {
        fgColor: { rgb: "D9E1F2" } // Azul claro
      },
      font: {
        bold: true,
        color: { rgb: "000000" }
      },
      border: {
        top: { style: "medium", color: { rgb: "4F81BD" } },
        bottom: { style: "medium", color: { rgb: "4F81BD" } },
        left: { style: "thin", color: { rgb: "4F81BD" } },
        right: { style: "thin", color: { rgb: "4F81BD" } }
      }
    };

    // Aplicar estilo à linha TOTAL se existir
    for (let col = 0; col < numCols; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: totalRowIndex + 1, c: col }); // +1 para pular linha vazia
      if (sheet[cellRef]) {
        sheet[cellRef].s = totalStyle;
      }
    }
  }
}
