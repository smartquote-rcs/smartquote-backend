"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const connect_1 = __importDefault(require("../infra/supabase/connect"));
class NotificationService {
    table = "notifications";
    async create(notification) {
        const { data, error } = await connect_1.default
            .from(this.table)
            .insert([notification])
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async getAll() {
        const { data, error } = await connect_1.default
            .from(this.table)
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(error.message);
        return data;
    }
    async getById(id) {
        const { data, error } = await connect_1.default
            .from(this.table)
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async delete(id) {
        const { error } = await connect_1.default
            .from(this.table)
            .delete()
            .eq('id', id);
        if (error)
            throw new Error(error.message);
    }
    async updatePartial(id, notification) {
        const { data, error } = await connect_1.default
            .from(this.table)
            .update(notification)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map