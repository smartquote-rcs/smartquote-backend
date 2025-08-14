"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = __importDefault(require("../infra/supabase/connect"));
class FornecedoresService {
    table = "Fornecedores";
    async create(FornecedorData) {
        const { data, error } = await connect_1.default
            .from(this.table)
            .insert(FornecedorData)
            .select('*')
            .single();
        if (error) {
            throw new Error(`Failed to create fornecedor: ${error.message}`);
        }
        return data;
    }
    async getAll() {
        const { data, error } = await connect_1.default
            .from(this.table)
            .select('*')
            .order('cadastrado_em', { ascending: false });
        if (error) {
            throw new Error(`Failed to list fornecedores: ${error.message}`);
        }
        return data;
    }
    async getById(id) {
        const { data, error } = await connect_1.default
            .from(this.table)
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            throw new Error(`Failed to get fornecedor by ID: ${error.message}`);
        }
        return data;
    }
    async delete(id) {
        const { error } = await connect_1.default
            .from(this.table)
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to delete fornecedor: ${error.message}`);
        }
    }
    async updatePartial(id, dataToUpdate) {
        const { data, error } = await connect_1.default
            .from(this.table)
            .update(dataToUpdate)
            .eq('id', id)
            .select('*')
            .single();
        if (error) {
            throw new Error(`Failed to update fornecedor: ${error.message}`);
        }
        return data;
    }
}
exports.default = new FornecedoresService();
//# sourceMappingURL=FornecedoresService.js.map