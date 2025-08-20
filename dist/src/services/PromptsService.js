"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = __importDefault(require("../infra/supabase/connect"));
class PromptsService {
    async create(promptData) {
        const { data, error } = await connect_1.default
            .from('prompts')
            .insert(promptData)
            .select('*')
            .single();
        if (error) {
            throw new Error(`Failed to create prompt: ${error.message}`);
        }
        return data;
    }
    async getAll() {
        const { data, error } = await connect_1.default
            .from('prompts')
            .select('*')
            .order('cadastrado_em', { ascending: false });
        if (error) {
            throw new Error(`Failed to list prompts: ${error.message}`);
        }
        return data;
    }
    async getById(id) {
        const { data, error } = await connect_1.default
            .from('prompts')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            throw new Error(`Failed to get prompt by ID: ${error.message}`);
        }
        return data;
    }
    async update(id, promptData) {
        const { data, error } = await connect_1.default
            .from('prompts')
            .update(promptData)
            .eq('id', id)
            .select('*')
            .single();
        if (error) {
            throw new Error(`Failed to update prompt: ${error.message}`);
        }
        return data;
    }
    async delete(id) {
        const { error } = await connect_1.default
            .from('prompts')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to delete prompt: ${error.message}`);
        }
    }
}
exports.default = new PromptsService();
//# sourceMappingURL=PromptsService.js.map