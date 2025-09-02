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

  /**
   * Marca uma notificação como lida
   */
  async markAsRead(id: number, userId?: string): Promise<NotificationDTO | null> {
    try {
      const updateData: any = {
        is_read: true,
        read_at: new Date().toISOString()
      };

      if (userId) {
        updateData.user_id = userId;
      }

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`📦 [NOTIFICATION-SERVICE] Erro ao marcar notificação ${id} como lida:`, error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`📖 [NOTIFICATION-SERVICE] Notificação ${id} marcada como lida`);
      return data as NotificationDTO;
    } catch (err: any) {
      console.error(`📦 [NOTIFICATION-SERVICE] Erro inesperado ao marcar como lida:`, err);
      throw err;
    }
  }

  /**
   * Marca múltiplas notificações como lidas
   */
  async markMultipleAsRead(ids: number[], userId?: string): Promise<number> {
    try {
      const updateData: any = {
        is_read: true,
        read_at: new Date().toISOString()
      };

      if (userId) {
        updateData.user_id = userId;
      }

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .in('id', ids)
        .select('id');

      if (error) {
        console.error('📦 [NOTIFICATION-SERVICE] Erro ao marcar múltiplas notificações como lidas:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      const updatedCount = data?.length || 0;
      console.log(`📖 [NOTIFICATION-SERVICE] ${updatedCount} notificações marcadas como lidas`);
      return updatedCount;
    } catch (err: any) {
      console.error('📦 [NOTIFICATION-SERVICE] Erro inesperado ao marcar múltiplas como lidas:', err);
      throw err;
    }
  }

  /**
   * Lista apenas notificações não lidas
   */
  async getUnread(userId?: string): Promise<NotificationDTO[]> {
    try {
      let query = supabase
        .from(this.table)
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.or(`user_id.is.null,user_id.eq.${userId}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('📦 [NOTIFICATION-SERVICE] Erro ao buscar notificações não lidas:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return data as NotificationDTO[] || [];
    } catch (err: any) {
      console.error('📦 [NOTIFICATION-SERVICE] Erro inesperado ao buscar não lidas:', err);
      throw err;
    }
  }

  /**
   * Conta notificações não lidas
   */
  async countUnread(userId?: string): Promise<number> {
    try {
      let query = supabase
        .from(this.table)
        .select('id', { count: 'exact' })
        .eq('is_read', false);

      if (userId) {
        query = query.or(`user_id.is.null,user_id.eq.${userId}`);
      }

      const { count, error } = await query;

      if (error) {
        console.error('📦 [NOTIFICATION-SERVICE] Erro ao contar notificações não lidas:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return count || 0;
    } catch (err: any) {
      console.error('📦 [NOTIFICATION-SERVICE] Erro inesperado ao contar não lidas:', err);
      throw err;
    }
  }

  /**
   * Marca todas as notificações como lidas
   */
  async markAllAsRead(userId?: string): Promise<number> {
    try {
      const updateData: any = {
        is_read: true,
        read_at: new Date().toISOString()
      };

      if (userId) {
        updateData.user_id = userId;
      }

      let query = supabase
        .from(this.table)
        .update(updateData)
        .eq('is_read', false);

      if (userId) {
        query = query.or(`user_id.is.null,user_id.eq.${userId}`);
      }

      const { data, error } = await query.select('id');

      if (error) {
        console.error('📦 [NOTIFICATION-SERVICE] Erro ao marcar todas como lidas:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      const updatedCount = data?.length || 0;
      console.log(`📖 [NOTIFICATION-SERVICE] ${updatedCount} notificações marcadas como lidas`);
      return updatedCount;
    } catch (err: any) {
      console.error('📦 [NOTIFICATION-SERVICE] Erro inesperado ao marcar todas como lidas:', err);
      throw err;
    }
  }
}
