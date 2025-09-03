import { Notification, NotificationDTO } from '../models/Notification';
export declare class NotificationService {
    private table;
    create(notification: Notification): Promise<NotificationDTO | null>;
    getAll(): Promise<NotificationDTO[]>;
    getById(id: number): Promise<NotificationDTO | null>;
    delete(id: number): Promise<void>;
    updatePartial(id: number, notification: Partial<Notification>): Promise<NotificationDTO | null>;
    /**
     * Verifica se já existe uma notificação similar para evitar duplicatas
     */
    existsBySubjectAndType(subject: string, type: string): Promise<boolean>;
    /**
     * Cria notificação apenas se não existir uma similar
     */
    createIfNotExists(notification: Notification): Promise<NotificationDTO | null>;
    /**
     * Marca uma notificação como lida
     */
    markAsRead(id: number, userId?: string): Promise<NotificationDTO | null>;
    /**
     * Marca múltiplas notificações como lidas
     */
    markMultipleAsRead(ids: number[], userId?: string): Promise<number>;
    /**
     * Lista apenas notificações não lidas
     */
    getUnread(userId?: string): Promise<NotificationDTO[]>;
    /**
     * Conta notificações não lidas
     */
    countUnread(userId?: string): Promise<number>;
    /**
     * Marca todas as notificações como lidas
     */
    markAllAsRead(userId?: string): Promise<number>;
}
//# sourceMappingURL=NotificationService.d.ts.map