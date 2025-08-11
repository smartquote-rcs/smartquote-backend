"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = __importDefault(require("../infra/supabase/connect"));
const AuthService_1 = __importDefault(require("./AuthService"));
class EmployeeService {
    async create({ name, email, password, position }) {
        const { userId } = await AuthService_1.default.signUp({
            username: name,
            email,
            password,
        });
        if (!userId) {
            throw new Error('Failed to create user');
        }
        const { data, error } = await connect_1.default
            .from('employees')
            .insert({
            user_id: userId,
            name,
            position,
            created_at: new Date().toISOString(),
        })
            .select(`
    id,
    name,
    position,
    created_at,
    user:users(id, email, display_name)
  `)
            .single();
        if (error) {
            await connect_1.default.auth.admin.deleteUser(userId);
            throw new Error(`Failed to create employee: ${error.message}`);
        }
        return data;
    }
    async getAll() {
        const { data, error } = await connect_1.default
            .from('employees')
            .select(`
        id,
        name,
        position,
        created_at,
        user:users(id, email, display_name)
      `)
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to list employees: ${error.message}`);
        }
        return data;
    }
    async getById(id) {
        const { data, error } = await connect_1.default
            .from('employees')
            .select(`
        id,
        name,
        position,
        created_at,
        user:users(id, email, display_name)
      `)
            .eq('id', id)
            .single();
        if (error) {
            throw new Error(`Failed to get employee by ID: ${error.message}`);
        }
        return data;
    }
    async delete(id) {
        const { data: employee, error: fetchError } = await connect_1.default
            .from('employees')
            .select('user_id')
            .eq('id', id)
            .single();
        if (fetchError) {
            throw new Error(`Failed to fetch employee before delete: ${fetchError.message}`);
        }
        const userId = employee?.user_id;
        const { error: deleteError } = await connect_1.default
            .from('employees')
            .delete()
            .eq('id', id);
        if (deleteError) {
            throw new Error(`Failed to delete employee: ${deleteError.message}`);
        }
        if (userId) {
            const { error: authError } = await connect_1.default.auth.admin.deleteUser(userId);
            if (authError) {
                throw new Error(`Failed to delete user from auth: ${authError.message}`);
            }
        }
    }
    async updatePartial(id, data) {
        const { data: updatedData, error } = await connect_1.default
            .from('employees')
            .update(data)
            .eq('id', id)
            .select(`
        id,
        name,
        position,
        created_at,
        user:users(id, email, display_name)
      `)
            .single();
        if (error) {
            throw new Error(`Failed to update employee: ${error.message}`);
        }
        return updatedData;
    }
}
exports.default = new EmployeeService();
//# sourceMappingURL=EmployeeService.js.map