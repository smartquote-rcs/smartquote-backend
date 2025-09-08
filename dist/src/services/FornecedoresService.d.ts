import { Fornecedor } from '../models/Fornecedor';
declare class FornecedoresService {
    private table;
    create(FornecedorData: Fornecedor): Promise<any>;
    getAll(): Promise<any[]>;
    getById(id: number): Promise<any>;
    delete(id: number): Promise<void>;
    updatePartial(id: number, dataToUpdate: Partial<Fornecedor>): Promise<any>;
}
declare const _default: FornecedoresService;
export default _default;
//# sourceMappingURL=FornecedoresService.d.ts.map