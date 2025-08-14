import { Notification, NotificationDTO } from '../models/Notification';
export declare class NotificationService {
    private table;
    create(notification: Notification): Promise<NotificationDTO | null>;
    getAll(): Promise<NotificationDTO[]>;
    getById(id: number): Promise<NotificationDTO | null>;
    delete(id: number): Promise<void>;
    updatePartial(id: number, notification: Partial<Notification>): Promise<NotificationDTO | null>;
}
//# sourceMappingURL=NotificationService.d.ts.map