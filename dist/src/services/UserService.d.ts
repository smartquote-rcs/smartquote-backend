import { User, UserDTO } from '../models/User';
declare class UserService {
    getByEmail(email: string): Promise<UserDTO | null>;
    private table;
    create(data: User): Promise<UserDTO>;
    getAll(): Promise<UserDTO[]>;
    getById(id: string): Promise<UserDTO | null>;
    delete(id: string): Promise<void>;
    updatePartial(id: string, data: Partial<UserDTO>): Promise<UserDTO>;
}
declare const _default: UserService;
export default _default;
//# sourceMappingURL=UserService.d.ts.map