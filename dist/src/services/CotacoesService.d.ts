import { Cotacao, CotacaoDTO } from '../models/Cotacao';
declare class CotacoesService {
    /**
     * Remove todas as cotações cujo prazo_validade já expirou (menor que hoje)
     */
    deleteExpired(): Promise<number>;
    create(CotacaoData: Cotacao): Promise<CotacaoDTO>;
    getAll(): Promise<CotacaoDTO[]>;
    getById(id: number): Promise<CotacaoDTO | null>;
    delete(id: number): Promise<void>;
    updatePartial(id: number, dataToUpdate: Partial<Cotacao>): Promise<CotacaoDTO>;
}
declare const _default: CotacoesService;
export default _default;
//# sourceMappingURL=CotacoesService.d.ts.map