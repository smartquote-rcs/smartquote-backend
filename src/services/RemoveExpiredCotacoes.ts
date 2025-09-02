import CotacoesService from './CotacoesService';

/**
 * Remove todas as cotações cujo prazo_validade é igual à data atual.
 * Deve ser chamado periodicamente ou no boot do servidor.
 */
export async function removerCotacoesExpiradasHoje() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeISO = hoje.toISOString().slice(0, 10); // yyyy-mm-dd

  const cotacoes = await CotacoesService.getAll();
  for (const cotacao of cotacoes) {
    if (cotacao.prazo_validade && cotacao.prazo_validade.slice(0, 10) === hojeISO) {
      try {
        await CotacoesService.delete(cotacao.id);
        console.log(`Cotação ${cotacao.id} removida por expiração do prazo de validade (${cotacao.prazo_validade})`);
      } catch (err) {
        console.error(`Erro ao remover cotação ${cotacao.id}:`, err);
      }
    }
  }
}
