/**
 * Serviço para filtrar e limpar links usando LLM
 */
interface SearchResultWeb {
    url: string;
    title?: string;
    description?: string;
    category?: string;
}

export class LinkFilterService {
  /**
   * Filtra e limpa links usando LLM para remover sites inadequados
   */
  static async filtrarLinksComLLM(links: SearchResultWeb[], termoBusca: string, limite: number): Promise<any[]> {
    if (!links || links.length === 0) {
      return [];
    }

    try {
      console.log(`🧠 [LLM-LINK-FILTER] Iniciando filtro LLM para ${links.length} links`);

      // Usar Groq para filtrar links
      const { Groq } = require('groq-sdk');
      const apiKey = process.env.GROQ_API_KEY;
      
      if (!apiKey) {
        console.log('❌ [LLM-LINK-FILTER] GROQ_API_KEY não encontrada - usando filtro básico');
        return this.filtroBasicoLinks(links, limite);
      }

     

      // Preparar candidatos para análise LLM
      const candidatos = links.map((link, index) => ({
        index,
        title: link.title || '',
        url: link.url || '',
        description: (link.description || '').substring(0, 300)
      }));

      const prompt_sistema = (
        "Você é um especialista em identificação e normalização de sites de e-commerce e serviços. Analise os links e retorne URLs limpos de sites comerciais adequados para busca de produtos.\n" +
        "Responda APENAS com um objeto JSON válido, sem comentários.\n\n" +
        "--- FORMATO DE SAÍDA ---\n" +
        "{\n" +
        '  "links_aprovados": ["url1", "url2", ...]\n' +
        "}\n\n" +
        "--- CRITÉRIOS ---\n" +
        "**APROVAR se:** e-commerce/loja online ou de serviços, vende produtos do termo buscado, estrutura comercial.\n" +
        "**NORMALIZAR URLs:** Remove parâmetros de rastreamento, mantém domínio, converte produtos individuais para dominio, descarta seções não-vendas (sobre, blog, contato), garante terminação com `/`.\n" +
        "**ESCOLHA:** escolha os \"LIMITE DESEJADO\" links mais confiáveis e relevantes para a busca sem repetir muitos derivados do mesmo site.\n" +
        "**Exemplo:** `site.com/produto/123-laptop?utm=x` →  `site.com/` ou se a categoria for clara e Confiável 'site.com/produto/'\n\n"
      );

      const userMsg = 
        `TERMO DE BUSCA: ${termoBusca}\n` +
        `LIMITE DESEJADO: ${limite}\n` +
        `CANDIDATOS: ${JSON.stringify(candidatos)}\n` +
        "Analise cada link, filtre apenas sites de e-commerce e retorne as URLs normalizadas.";

      const client = new Groq({ apiKey });
      const resp = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: prompt_sistema },
          { role: "user", content: userMsg }
        ],
        temperature: 0,
        max_tokens: 2000,
        stream: false
      });

      const content = (resp.choices[0].message.content || '').trim();
      console.log(`🧠 [LLM-LINK-FILTER] Resposta LLM: ${content.substring(0, 200)}...`);

      // Extrair JSON da resposta
      let urlsAprovadas: string[] = [];
      try {
        let cleanedContent = content;
        if (!content.startsWith('{')) {
          const jsonMatch = content.match(/\{.*\}/s);
          if (jsonMatch) {
            cleanedContent = jsonMatch[0];
          }
        }
        
        const data = JSON.parse(cleanedContent);
        urlsAprovadas = data.links_aprovados || [];
        
        console.log(`🧠 [LLM-LINK-FILTER] URLs aprovadas: ${urlsAprovadas.length} de ${candidatos.length}`);
        
      } catch (e) {
        console.log(`🧠 [LLM-LINK-FILTER] Erro no parse JSON: ${e} - usando filtro básico`);
        return this.filtroBasicoLinks(links, limite);
      }

      // Criar objetos de resultado com URLs normalizadas
      const resultadoFinal = urlsAprovadas
        .slice(0, limite)
        .map(url => ({
          title: 'Site de E-commerce',
          url: url,
          description: 'Site filtrado e normalizado pelo LLM'
        }));

      console.log(`🧠 [LLM-LINK-FILTER] Filtro concluído: ${resultadoFinal.length} links finais`);
      return resultadoFinal;

    } catch (error) {
      console.error(`❌ [LLM-LINK-FILTER] Erro no filtro LLM: ${error}`);
      return this.filtroBasicoLinks(links, limite);
    }
  }

  /**
   * Limpa URL removendo parâmetros de tracking e query strings
   */
  static limparURL(url: string | undefined): string {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      
      // Manter apenas o protocolo, host e pathname
      let urlLimpa = `${urlObj.protocol}//${urlObj.hostname}`;
      
      // Adicionar porta se não for padrão
      if (urlObj.port && urlObj.port !== '80' && urlObj.port !== '443') {
        urlLimpa += `:${urlObj.port}`;
      }
      
      // Adicionar pathname se existir e não for apenas "/"
      if (urlObj.pathname && urlObj.pathname !== '/') {
        urlLimpa += urlObj.pathname;
      } else {
        urlLimpa += '/';
      }
      
      return urlLimpa;
    } catch (error) {
      // Se não conseguir fazer parse da URL, tentar limpeza básica
      const safeUrl = url || '';
      return safeUrl.split('?')[0]?.split('#')[0] || '';
    }
  }

  /**
   * Filtro básico para links quando LLM não está disponível
   */
  static filtroBasicoLinks(links: any[], limite: number): any[] {
    return links
      .map(link => ({
        ...link,
        url: this.limparURL(link.url)
      }))
      .filter((result: any) => {
        const url = result.url?.toLowerCase() || '';
        const title = result.title?.toLowerCase() || '';
        const description = result.description?.toLowerCase() || '';
        
        // Verificar se é um site de e-commerce
        const isEcommerce = 
          url.includes('loja') || 
          url.includes('shop') || 
          url.includes('store') ||
          title.includes('loja') ||
          title.includes('comprar') ||
          title.includes('venda') ||
          description.includes('comprar') ||
          description.includes('loja') ||
          description.includes('produtos');

        // Excluir sites que claramente não são e-commerce
        const isNotEcommerce = 
          url.includes('wikipedia') ||
          url.includes('youtube') ||
          url.includes('facebook') ||
          url.includes('instagram') ||
          url.includes('twitter') ||
          url.includes('linkedin') ||
          url.includes('blog') ||
          title.includes('blog') ||
          title.includes('notícia') ||
          title.includes('forum') ||
          url.includes('forum');
          
        return isEcommerce && !isNotEcommerce;
      })
      .slice(0, limite);
  }
}
