/**
 * Exemplo de como usar a nova rota de substituição de produto
 * PUT /cotacoes-itens/replace-product
 */

// Exemplo de payload para substituir um produto
// NOTA: Agora só precisa do ID do produto, não dos dados completos
const exemploSubstituicaoProduto = {
  // ID do item de cotação a ser substituído
  cotacaoItemId: 123,
  
  // ID do novo produto (já cadastrado na tabela produtos)
  newProductId: 456
  
  // NOTA: A rota automaticamente:
  // 1. Busca os dados do produto na tabela 'produtos' usando o newProductId
  // 2. Atualiza o cotacao_item com os dados do novo produto
  // 3. Encontra o relatório correspondente à cotacaoId (analise_local na tabela relatorios)
  // 4. Procura no array analise_local o elemento com escolha_principal igual ao nome do produto antigo
  // 5. Atualiza o relatório web do próprio item (campo relatorio em cotacoes_itens)
  // 6. Substitui os elementos com:
  //    - escolha_principal: nome do novo produto
  //    - justificativa_escolha: "Seleção natural - produto substituído por escolha do usuário"
  //    - top_ranking[0]: atualizado com dados do novo produto
  //    - pontos_fortes: ["Escolha do usuário", "Seleção manual"]
  //    - score_estimado: 10
};

// Exemplo de uso com fetch
async function exemploUsoAPI() {
  try {
    const response = await fetch('/api/cotacoes-itens/replace-product', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exemploSubstituicaoProduto)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Produto substituído com sucesso:', result);
    } else {
      console.error('❌ Erro ao substituir produto:', result);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

export { exemploSubstituicaoProduto, exemploUsoAPI };
