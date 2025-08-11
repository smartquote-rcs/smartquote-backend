import { Employee, EmployeeDTO } from '../models/Employee';
declare class EmployeeService {
    create({ name, email, password, position }: Employee): Promise<EmployeeDTO>;
    getAll(): Promise<EmployeeDTO[]>;
    getById(id: string): Promise<EmployeeDTO | null>;
    delete(id: string): Promise<void>;
    updatePartial(id: string, data: Partial<EmployeeDTO>): Promise<EmployeeDTO>;
}
declare const _default: EmployeeService;
export default _default;
//# sourceMappingURL=EmployeeService.d.ts.map