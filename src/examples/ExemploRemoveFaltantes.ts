/**
 * Exemplo de uso da rota para remover elementos faltantes
 * 
 * Este arquivo demonstra como usar a nova funcionalidade de remoção
 * de elementos do campo faltantes das cotações.
 */

// Tipos para as respostas da API
interface RemoveFaltanteResponse {
  message: string;
  data: {
    elementoRemovido: any;
    faltantesRestantes: number;
    novoStatus: 'completa' | 'incompleta';
    cotacao: any;
  };
}

interface ApiError {
  error: string;
}

// Exemplo 1: Remover por índice
async function removerFaltantePorIndice(cotacaoId: number, index: number) {
  try {
    const response = await fetch(`/api/cotacoes/${cotacaoId}/remove-faltante`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ index })
    });

    if (response.ok) {
      const result = await response.json() as RemoveFaltanteResponse;
      console.log('✅ Elemento removido:', result.data.elementoRemovido);
      console.log(`📊 Faltantes restantes: ${result.data.faltantesRestantes}`);
      console.log(`🔄 Novo status: ${result.data.novoStatus}`);
    } else {
      const error = await response.json() as ApiError;
      console.error('❌ Erro:', error.error);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

// Exemplo 2: Remover por query sugerida
async function removerFaltantePorQuery(cotacaoId: number, query: string) {
  try {
    const response = await fetch(`/api/cotacoes/${cotacaoId}/remove-faltante`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (response.ok) {
      const result = await response.json() as RemoveFaltanteResponse;
      console.log('✅ Elemento removido:', result.data.elementoRemovido);
      console.log(`📊 Faltantes restantes: ${result.data.faltantesRestantes}`);
      console.log(`🔄 Novo status: ${result.data.novoStatus}`);
    } else {
      const error = await response.json() as ApiError;
      console.error('❌ Erro:', error.error);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

// Exemplo 3: Remover por nome do produto
async function removerFaltantePorNome(cotacaoId: number, nome: string) {
  try {
    const response = await fetch(`/api/cotacoes/${cotacaoId}/remove-faltante`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nome })
    });

    if (response.ok) {
      const result = await response.json() as RemoveFaltanteResponse;
      console.log('✅ Elemento removido:', result.data.elementoRemovido);
      console.log(`📊 Faltantes restantes: ${result.data.faltantesRestantes}`);
      console.log(`🔄 Novo status: ${result.data.novoStatus}`);
    } else {
      const error = await response.json() as ApiError;
      console.error('❌ Erro:', error.error);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

// Exemplo de uso
export async function exemploUso() {
  const cotacaoId = 123; // ID da cotação

  console.log('🧪 Testando remoção de faltantes...\n');

  // Teste 1: Remover por índice
  console.log('📋 Teste 1: Removendo por índice 0');
  await removerFaltantePorIndice(cotacaoId, 0);

  console.log('\n---\n');

  // Teste 2: Remover por query
  console.log('🔍 Teste 2: Removendo por query "servidor"');
  await removerFaltantePorQuery(cotacaoId, 'servidor');

  console.log('\n---\n');

  // Teste 3: Remover por nome
  console.log('🏷️ Teste 3: Removendo por nome "Servidor Dell"');
  await removerFaltantePorNome(cotacaoId, 'Servidor Dell');
}

// Exemplo de uso com axios (alternativa)
export async function exemploComAxios() {
  const axios = require('axios');
  const cotacaoId = 123;

  try {
    // Remover por índice
    const response = await axios.post(`/api/cotacoes/${cotacaoId}/remove-faltante`, {
      index: 0
    });

    console.log('✅ Sucesso:', response.data);
  } catch (error: any) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Exemplo de uso com fetch e tratamento de erros mais robusto
export async function removerFaltanteRobusto(cotacaoId: number, criterios: { index?: number; query?: string; nome?: string }) {
  try {
    // Validação dos parâmetros
    if (!criterios.index && !criterios.query && !criterios.nome) {
      throw new Error('É necessário fornecer index, query ou nome');
    }

    const response = await fetch(`/api/cotacoes/${cotacaoId}/remove-faltante`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Se usar autenticação
      },
      body: JSON.stringify(criterios)
    });

    if (!response.ok) {
      const errorData = await response.json() as ApiError;
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json() as RemoveFaltanteResponse;
    
    // Log detalhado do resultado
    console.log('🎯 Operação concluída com sucesso!');
    console.log('📦 Elemento removido:', result.data.elementoRemovido);
    console.log(`📊 Faltantes restantes: ${result.data.faltantesRestantes}`);
    console.log(`🔄 Status atualizado para: ${result.data.novoStatus}`);
    
    if (result.data.novoStatus === 'completa') {
      console.log('🎉 Cotação marcada como COMPLETA!');
    }

    return result.data;
  } catch (error: any) {
    console.error('❌ Falha na operação:', error.message);
    throw error;
  }
}
