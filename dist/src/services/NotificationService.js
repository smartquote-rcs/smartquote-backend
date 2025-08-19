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
        // Remove any id field from notification object to avoid conflicts
        const { id, created_at, ...notificationData } = notification;
        try {
            const { data, error } = await connect_1.default
                .from(this.table)
                .insert([notificationData])
                .select()
                .single();
            if (error) {
                console.error('📦 [NOTIFICATION-SERVICE] Database error:', error);
                throw new Error(`Database error: ${error.message}`);
            }
            return data;
        }
        catch (err) {
            console.error('📦 [NOTIFICATION-SERVICE] Unexpected error:', err);
            throw err;
        }
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
    /**
     * Verifica se já existe uma notificação similar para evitar duplicatas
     */
    async existsBySubjectAndType(subject, type) {
        const { data, error } = await connect_1.default
            .from(this.table)
            .select('id')
            .eq('type', type)
            .ilike('subject', `%${subject}%`)
            .limit(1);
        if (error) {
            console.error('📦 [NOTIFICATION-SERVICE] Error checking existing notification:', error);
            return false; // Em caso de erro, assume que não existe para tentar criar
        }
        return data && data.length > 0;
    }
    /**
     * Cria notificação apenas se não existir uma similar
     */
    async createIfNotExists(notification) {
        const exists = await this.existsBySubjectAndType(notification.subject, notification.type);
        if (exists) {
            console.log(`📦 [NOTIFICATION-SERVICE] Notificação já existe: ${notification.subject}`);
            return null;
        }
        return await this.create(notification);
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map