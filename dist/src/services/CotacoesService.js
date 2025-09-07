"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = __importDefault(require("../infra/supabase/connect"));
class CotacoesService {
    /**
     * Remove todas as cotações cujo prazo_validade já expirou (menor que hoje)
     */
    async deleteExpired() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().slice(0, 10); // yyyy-mm-dd
        const { data, error } = await connect_1.default
            .from('cotacoes')
            .delete()
            .lt('prazo_validade', todayStr)
            .select(); // Adicionar select para retornar os registros deletados
        if (error) {
            throw new Error(`Failed to delete expired cotacoes: ${error.message}`);
        }
        if (Array.isArray(data)) {
            return data.length;
        }
        return 0;
    }
    async create(CotacaoData) {
        const { data, error } = await connect_1.default
            .from('cotacoes')
            .insert(CotacaoData)
            .select(`
        *,
        prompt:prompts(id, texto_original)
      `)
            .single();
        if (error) {
            throw new Error(`Failed to create cotacao: ${error.message}`);
        }
        return data;
    }
    async getAll() {
        const { data, error } = await connect_1.default
            .from('cotacoes')
            .select(`
        *,
        prompt:prompts(id, texto_original)
      `)
            .order('cadastrado_em', { ascending: false });
        if (error) {
            throw new Error(`Failed to list cotacoes: ${error.message}`);
        }
        return data;
    }
    async getById(id) {
        console.log(`🔍 [COTACOES-SERVICE] Buscando cotação ID: ${id}`);
        const { data, error } = await connect_1.default
            .from('cotacoes')
            .select(`
        *,
        prompt:prompts(id, texto_original)
      `)
            .eq('id', id);
        if (error) {
            console.error(`❌ [COTACOES-SERVICE] Erro ao buscar cotação ${id}:`, error);
            throw new Error(`Failed to get cotacao by ID: ${error.message}`);
        }
        if (!data || data.length === 0) {
            console.warn(`⚠️ [COTACOES-SERVICE] Cotação ${id} não encontrada`);
            return null;
        }
        if (data.length > 1) {
            console.warn(`⚠️ [COTACOES-SERVICE] Múltiplas cotações encontradas para ID ${id}, usando a primeira`);
        }
        console.log(`✅ [COTACOES-SERVICE] Cotação ${id} encontrada:`, {
            id: data[0].id,
            aprovacao: data[0].aprovacao,
            orcamento_geral: data[0].orcamento_geral
        });
        return data[0];
    }
    async delete(id) {
        const { error } = await connect_1.default
            .from('cotacoes')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to delete cotacao: ${error.message}`);
        }
    }
    async updatePartial(id, dataToUpdate) {
        const { data, error } = await connect_1.default
            .from('cotacoes')
            .update(dataToUpdate)
            .eq('id', id)
            .select(`
        *,
        prompt:prompts(id, texto_original)
      `)
            .single();
        if (error) {
            throw new Error(`Failed to update cotacao: ${error.message}`);
        }
        return data;
    }
}
exports.default = new CotacoesService();
//# sourceMappingURL=CotacoesService.js.map