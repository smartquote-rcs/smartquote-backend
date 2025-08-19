"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = __importDefault(require("../infra/supabase/connect"));
class PromptsService {
    async create(prompt) {
        const payload = {
            texto_original: prompt.texto_original,
            dados_extraidos: prompt.dados_extraidos ?? {},
            origem: prompt.origem ?? { tipo: 'servico', fonte: 'api' },
            status: prompt.status ?? 'analizado',
        };
        const { data, error } = await connect_1.default
            .from('prompts')
            .insert(payload)
            .select('id')
            .single();
        if (error) {
            console.error('Erro ao criar prompt:', error);
            return null;
        }
        return data?.id ?? null;
    }
}
exports.default = new PromptsService();
//# sourceMappingURL=PromptsService.js.map