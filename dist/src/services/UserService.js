"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = __importDefault(require("../infra/supabase/connect"));
const passwordHash_1 = require("../utils/passwordHash");
const AuthService_1 = __importDefault(require("./AuthService"));
class UserService {
    async getByEmail(email) {
        const { data, error } = await connect_1.default
            .from(this.table)
            .select('*')
            .eq('email', email)
            .single();
        if (error) {
            throw new Error(`Failed to get user by email: ${error.message}`);
        }
        return data;
    }
    table = "users";
    async create(data) {
        let userId = null;
        try {
            const authResult = await AuthService_1.default.signUp({
                username: data.name,
                email: data.email,
                password: data.password,
            });
            userId = authResult.userId || null;
            if (!userId) {
                throw new Error('Failed to create user in AuthService');
            }
            const { data: dataResult, error } = await connect_1.default
                .from(this.table)
                .insert({
                name: data.name,
                email: data.email,
                contact: data.contact,
                password: await (0, passwordHash_1.passwordHash)(data.password),
                department: data.department,
                position: data.position,
                auth_id: userId
            })
                .select('*')
                .single();
            if (error) {
                throw new Error(`Failed to insert user in database: ${error.message}`);
            }
            return dataResult;
        }
        catch (err) {
            if (userId) {
                await connect_1.default.auth.admin.deleteUser(userId);
            }
            throw err;
        }
    }
    async getAll() {
        const { data, error } = await connect_1.default
            .from(this.table)
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to list users: ${error.message}`);
        }
        return data;
    }
    async getById(id) {
        const { data, error } = await connect_1.default
            .from(this.table)
            .select(`id, name, email, position, created_at`)
            .eq('id', id)
            .single();
        if (error) {
            throw new Error(`Failed to get User by ID: ${error.message}`);
        }
        return data;
    }
    async delete(id) {
        const { data: user, error: fetchError } = await connect_1.default
            .from(this.table)
            .select('auth_id')
            .eq('id', id)
            .single();
        if (fetchError) {
            throw new Error(`Failed to fetch user before delete: ${fetchError.message}`);
        }
        const userId = user?.auth_id;
        const { error: deleteError } = await connect_1.default
            .from(this.table)
            .delete()
            .eq('id', id);
        if (deleteError) {
            throw new Error(`Failed to delete user: ${deleteError.message}`);
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
            .from(this.table)
            .update(data)
            .eq('id', id)
            .select('*')
            .single();
        if (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }
        return updatedData;
    }
}
exports.default = new UserService();
//# sourceMappingURL=UserService.js.map