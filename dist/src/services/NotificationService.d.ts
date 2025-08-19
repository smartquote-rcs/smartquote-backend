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
}
//# sourceMappingURL=NotificationService.d.ts.map