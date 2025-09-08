"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SistemaService = void 0;
const connect_1 = __importDefault(require("../infra/supabase/connect"));
class SistemaService {
    table = "sistema";
    /**
     * Busca as configurações do sistema
     */
    async getSistema() {
        try {
            const { data, error } = await connect_1.default
                .from(this.table)
                .select('*')
                .limit(1)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error('Erro ao buscar configurações do sistema:', error);
                throw new Error(error.message);
            }
            return data;
        }
        catch (error) {
            console.error('Erro no serviço de sistema:', error);
            throw error;
        }
    }
    /**
     * Cria ou atualiza as configurações do sistema
     */
    async upsertSistema(sistema) {
        try {
            const { data, error } = await connect_1.default
                .from(this.table)
                .upsert([sistema], {
                onConflict: 'id',
                ignoreDuplicates: false
            })
                .select()
                .single();
            if (error) {
                console.error('Erro ao salvar configurações do sistema:', error);
                throw new Error(error.message);
            }
            return data;
        }
        catch (error) {
            console.error('Erro no serviço de sistema:', error);
            throw error;
        }
    }
    /**
     * Atualiza parcialmente as configurações do sistema
     */
    async updateSistema(updates) {
        try {
            // Primeiro, buscar o registro existente
            const sistemaExistente = await this.getSistema();
            if (!sistemaExistente) {
                throw new Error('Configurações do sistema não encontradas');
            }
            const { data, error } = await connect_1.default
                .from(this.table)
                .update(updates)
                .eq('id', sistemaExistente.id)
                .select()
                .single();
            if (error) {
                console.error('Erro ao atualizar configurações do sistema:', error);
                throw new Error(error.message);
            }
            return data;
        }
        catch (error) {
            console.error('Erro no serviço de sistema:', error);
            throw error;
        }
    }
    /**
     * Cria as configurações padrão do sistema se não existirem
     */
    async criarConfiguracaoPadrao() {
        try {
            const configuracaoPadrao = {
                nome_empresa: 'SmartQuote',
                idioma: 'pt-BR',
                fuso_horario: 'America/Sao_Paulo',
                moeda: 'BRL',
                backup: 'diario',
                manutencao: false,
                tempo_de_sessao: 480, // 8 horas em minutos
                politica_senha: 'forte',
                log_auditoria: true,
                ip_permitidos: '0.0.0.0/0' // permitir todos inicialmente
            };
            return await this.upsertSistema(configuracaoPadrao);
        }
        catch (error) {
            console.error('Erro ao criar configuração padrão:', error);
            throw error;
        }
    }
}
exports.SistemaService = SistemaService;
exports.default = new SistemaService();
//# sourceMappingURL=SistemaService.js.map