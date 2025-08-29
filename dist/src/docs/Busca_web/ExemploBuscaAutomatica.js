"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExemploBuscaAutomatica = void 0;
const BuscaAtomatica_1 = require("../../services/BuscaAtomatica");
/**
 * Exemplo de uso da classe BuscaAutomatica
 */
class ExemploBuscaAutomatica {
    buscaAutomatica;
    constructor() {
        this.buscaAutomatica = new BuscaAtomatica_1.BuscaAutomatica();
    }
    /**
     * Exemplo de busca simples em um site
     */
    async exemploSimples() {
        try {
            const resultado = await this.buscaAutomatica.buscarProdutos({
                searchTerm: "HP PROBOOK",
                website: "https://itec.co.ao/*",
                numResults: 5
            });
            if (resultado.success) {
                console.log("Produtos encontrados:", resultado.data?.products);
                return resultado.data?.products;
            }
            else {
                console.error("Erro na busca:", resultado.error);
                return [];
            }
        }
        catch (error) {
            console.error("Erro no exemplo simples:", error);
            return [];
        }
    }
    /**
     * Exemplo de busca em múltiplos sites
     */
    async exemploMultiplosSites() {
        try {
            const websites = [
                "https://itec.co.ao/*",
                "https://outrosite.com/*"
            ];
            const resultados = await this.buscaAutomatica.buscarProdutosMultiplosSites("notebook", websites, 3);
            // Combinar todos os resultados
            const todosProdutos = this.buscaAutomatica.combinarResultados(resultados);
            console.log(`Total de produtos encontrados: ${todosProdutos.length}`);
            // Filtrar por faixa de preço (exemplo: produtos entreAOA$ 1000 eAOA$ 5000)
            const produtosFiltrados = this.buscaAutomatica.filtrarPorPreco(todosProdutos, 1000, 5000);
            console.log(`Produtos na faixa de preço: ${produtosFiltrados.length}`);
            return produtosFiltrados;
        }
        catch (error) {
            console.error("Erro no exemplo múltiplos sites:", error);
            return [];
        }
    }
}
exports.ExemploBuscaAutomatica = ExemploBuscaAutomatica;
// Para usar em outros controladores:
// const busca = new BuscaAutomatica();
// const resultado = await busca.buscarProdutos({...});
//# sourceMappingURL=ExemploBuscaAutomatica.js.map