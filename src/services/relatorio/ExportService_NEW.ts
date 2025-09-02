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
        id, status, orcamento_geral, faltantes, prompt_id,
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

    // Processar itens
    const itensProcessados: ItemResumo[] = (itens || []).map(item => ({
      nome: item.item_nome || 'N/A',
      descricao: item.item_descricao || 'N/A',
      preco: parseFloat(item.item_preco || 0),
      quantidade: parseInt(item.quantidade || 1),
      subtotal: parseFloat(item.item_preco || 0) * parseInt(item.quantidade || 1),
      origem: item.origem || 'N/A',
      provider: item.provider || 'N/A'
    }));

    return {
      cotacaoId: cotacao.id,
      cotacaoStatus: cotacao.status || 'N/A',
      orcamentoGeral: parseFloat(cotacao.orcamento_geral || 0),
      solicitacao: prompt?.texto_original || 'Solicitação não disponível',
      dataGeracao: new Date(),
      itens: itensProcessados,
      dadosUsuario,
      faltantes: cotacao.faltantes || []
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
      ['Orçamento Geral', dados.orcamentoGeral.toString()],
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
        item.preco.toString(),
        item.quantidade.toString(),
        item.subtotal.toString(),
        item.origem,
        item.provider || 'N/A'
      ]);
    });

    // Adicionar total
    const totalItens = dados.itens.reduce((sum, item) => sum + item.subtotal, 0);
    itensData.push(['']);
    itensData.push(['TOTAL', '', '', '', totalItens.toString(), '', '']);

    const itensSheet = XLSX.utils.aoa_to_sheet(itensData);
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
      XLSX.utils.book_append_sheet(workbook, faltantesSheet, 'Faltantes');
    }

    // Converter para buffer
    const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return xlsxBuffer;
  }
}
