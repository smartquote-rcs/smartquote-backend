"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = __importDefault(require("../infra/supabase/connect"));
class CotacoesService {
    async create(CotacaoData) {
        const { data, error } = await connect_1.default
            .from('cotacoes')
            .insert(CotacaoData)
            .select(`
        *,
        prompt:prompts(id, texto_original),
        produto:produtos(id, nome)
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
        prompt:prompts(id, texto_original),
        produto:produtos(id, nome)
      `)
            .order('cadastrado_em', { ascending: false });
        if (error) {
            throw new Error(`Failed to list cotacoes: ${error.message}`);
        }
        return data;
    }
    async getById(id) {
        const { data, error } = await connect_1.default
            .from('cotacoes')
            .select(`
        *,
        prompt:prompts(id, texto_original),
        produto:produtos(id, nome)
      `)
            .eq('id', id)
            .single();
        if (error) {
            throw new Error(`Failed to get cotacao by ID: ${error.message}`);
        }
        return data;
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
        prompt:prompts(id, texto_original),
        produto:produtos(id, nome)
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