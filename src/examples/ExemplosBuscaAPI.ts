/**
 * Arquivo de exemplo para testar a API de Busca Automática
 * Este arquivo demonstra como fazer requisições para a API
 */

// Exemplo usando fetch (JavaScript/TypeScript)
async function exemploRequisicaoBusca() {
  const token = "SEU_TOKEN_DE_AUTENTICACAO"; // Substituir pelo token real
  
  try {
    const response = await fetch('http://localhost:3000/busca-automatica', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        produto: "HP PROBOOK"  // Apenas o produto é necessário
      })
    });

  const data: any = await response.json();
    
    if (data.success) {
      console.log(`Encontrados ${data.data.total} produtos:`);
      console.log('Configurações utilizadas:', data.configuracoes_utilizadas);
      
      data.data.produtos.forEach((produto: any, index: number) => {
        console.log(`${index + 1}. ${produto.name} - ${produto.price}`);
      });
    } else {
      console.error('Erro na busca:', data.message);
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

// Exemplo para listar sites disponíveis
async function exemploListarSites() {
  const token = "SEU_TOKEN_DE_AUTENTICACAO";
  
  try {
    const response = await fetch('http://localhost:3000/busca-automatica/sites', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

  const data: any = await response.json();
    console.log('Sites disponíveis:', data.data.sites_ativos);
  } catch (error) {
    console.error('Erro ao listar sites:', error);
  }
}

// Exemplo para buscar configurações
async function exemploConfiguracoes() {
  const token = "SEU_TOKEN_DE_AUTENTICACAO";
  
  try {
    const response = await fetch('http://localhost:3000/busca-automatica/config', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

  const data: any = await response.json();
    console.log('Configurações padrão:', data.data);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
  }
}

// Para usar no Node.js, instale: npm install node-fetch
// import fetch from 'node-fetch';

export {
  exemploRequisicaoBusca,
  exemploListarSites,
  exemploConfiguracoes
};
