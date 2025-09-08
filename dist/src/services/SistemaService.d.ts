import { Sistema, SistemaDTO } from '../models/Sistema';
export declare class SistemaService {
    private table;
    /**
     * Busca as configurações do sistema
     */
    getSistema(): Promise<SistemaDTO | null>;
    /**
     * Cria ou atualiza as configurações do sistema
     */
    upsertSistema(sistema: Sistema): Promise<SistemaDTO | null>;
    /**
     * Atualiza parcialmente as configurações do sistema
     */
    updateSistema(updates: Partial<Sistema>): Promise<SistemaDTO | null>;
    /**
     * Cria as configurações padrão do sistema se não existirem
     */
    criarConfiguracaoPadrao(): Promise<SistemaDTO | null>;
}
declare const _default: SistemaService;
export default _default;
//# sourceMappingURL=SistemaService.d.ts.map