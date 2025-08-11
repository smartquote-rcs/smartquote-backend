"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutosService = void 0;
const connect_1 = __importDefault(require("../infra/supabase/connect"));
class ProdutosService {
    async create(produto) {
        const { data, error } = await connect_1.default
            .from('produtos')
            .insert([produto])
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async getAll() {
        const { data, error } = await connect_1.default
            .from('produtos')
            .select('*');
        if (error)
            throw new Error(error.message);
        return data;
    }
    async getById(id) {
        const { data, error } = await connect_1.default
            .from('produtos')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async delete(id) {
        const { error } = await connect_1.default
            .from('produtos')
            .delete()
            .eq('id', id);
        if (error)
            throw new Error(error.message);
    }
    async updatePartial(id, produto) {
        const { data, error } = await connect_1.default
            .from('produtos')
            .update(produto)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
}
exports.ProdutosService = ProdutosService;
//# sourceMappingURL=ProdutoService.js.map