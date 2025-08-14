export interface Notification {
    title: string;
    subject: string;
    type: string;
    url_redir?: string;
}
export interface NotificationDTO extends Notification {
    id: number;
    created_at: string;
}
//# sourceMappingURL=Notification.d.ts.map