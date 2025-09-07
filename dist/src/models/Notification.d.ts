export interface Notification {
    title: string;
    subject: string;
    type: string;
    url_redir?: string;
    is_read?: boolean;
    read_at?: string;
    user_id?: string;
}
export interface NotificationDTO extends Notification {
    id: number;
    created_at: string;
    is_read: boolean;
    read_at?: string;
    user_id?: string;
}
//# sourceMappingURL=Notification.d.ts.map