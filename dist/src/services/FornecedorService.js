"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = __importDefault(require("../infra/supabase/connect"));
class FornecedorService {
    /**
     * Busca todos os fornecedores ativos com sites válidos
     */
    async getFornecedoresAtivos() {
        try {
            const { data, error } = await connect_1.default
                .from('fornecedores')
                .select('id, nome, site, ativo')
                .eq('ativo', true)
                .not('site', 'is', null)
                .neq('site', '');
            if (error) {
                console.error('Erro ao buscar fornecedores:', error);
                throw new Error(`Erro na consulta: ${error.message}`);
            }
            // Transformar os dados para o formato esperado pela busca
            const sitesParaBusca = (data || []).map(fornecedor => ({
                id: fornecedor.id,
                nome: fornecedor.nome,
                url: this.formatarUrlParaBusca(fornecedor.site),
                ativo: fornecedor.ativo
            }));
            return sitesParaBusca;
        }
        catch (error) {
            console.error('Erro no serviço de fornecedores:', error);
            throw error;
        }
    }
    /**
     * Busca fornecedor por ID
     */
    async getFornecedorById(id) {
        try {
            const { data, error } = await connect_1.default
                .from('fornecedores')
                .select('*')
                .eq('id', id)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Não encontrado
                }
                throw new Error(`Erro na consulta: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            console.error('Erro ao buscar fornecedor por ID:', error);
            throw error;
        }
    }
    /**
     * Formata URL para busca (adiciona wildcard se necessário)
     */
    formatarUrlParaBusca(url) {
        if (!url)
            return '';
        // Remove espaços
        url = url.trim();
        // Se não termina com /*, adiciona
        if (!url.endsWith('/*')) {
            // Se termina com /, adiciona *
            if (url.endsWith('/')) {
                url += '*';
            }
            else {
                // Caso contrário, adiciona /*
                url += '/*';
            }
        }
        return url;
    }
    /**
     * Busca configurações do sistema
     */
    async getConfiguracoesSistema() {
        try {
            const { data, error } = await connect_1.default
                .from('sistema')
                .select('*')
                .limit(1)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error('Erro ao buscar configurações do sistema:', error);
            }
            // Retorna configurações padrão se não encontrar na BD
            return {
                numResultadosPorSite: 5,
                precoMinimo: null,
                precoMaximo: null,
                sitesAtivos: true,
                timeout: 30000,
                retentativas: 2,
                // Adicionar campos do sistema se necessário
                ...(data || {})
            };
        }
        catch (error) {
            console.error('Erro no serviço de configurações:', error);
            // Retorna configurações padrão em caso de erro
            return {
                numResultadosPorSite: 3,
                precoMinimo: null,
                precoMaximo: null,
                sitesAtivos: true,
                timeout: 30000,
                retentativas: 2
            };
        }
    }
}
exports.default = new FornecedorService();
//# sourceMappingURL=FornecedorService.js.map