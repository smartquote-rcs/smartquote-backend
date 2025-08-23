import supabase from '../infra/supabase/connect';
import { Notification, NotificationDTO } from '../models/Notification';

export class NotificationService {

  private table = "notifications";

  async create(notification: Notification): Promise<NotificationDTO | null> {
    // Remove any id field from notification object to avoid conflicts
    const { id, created_at, ...notificationData } = notification as any;
    
    try {
      const { data, error } = await supabase
        .from(this.table)
        .insert([notificationData])
        .select()
        .single();

      if (error) {
        console.error('📦 [NOTIFICATION-SERVICE] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      return data as NotificationDTO;
    } catch (err: any) {
      console.error('📦 [NOTIFICATION-SERVICE] Unexpected error:', err);
      throw err;
    }
  }

  async getAll(): Promise<NotificationDTO[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as NotificationDTO[];
  }

  async getById(id: number): Promise<NotificationDTO | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as NotificationDTO;
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async updatePartial(id: number, notification: Partial<Notification>): Promise<NotificationDTO | null> {
    const { data, error } = await supabase
      .from(this.table)
      .update(notification)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as NotificationDTO;
  }

  /**
   * Verifica se já existe uma notificação similar para evitar duplicatas
   */
  async existsBySubjectAndType(subject: string, type: string): Promise<boolean> {
    const { data, error } = await supabase
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
  async createIfNotExists(notification: Notification): Promise<NotificationDTO | null> {
    const exists = await this.existsBySubjectAndType(notification.subject, notification.type);
    
    if (exists) {
      console.log(`📦 [NOTIFICATION-SERVICE] Notificação já existe: ${notification.subject}`);
      return null;
    }

    return await this.create(notification);
  }
}
