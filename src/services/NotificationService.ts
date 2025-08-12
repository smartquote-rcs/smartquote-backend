import supabase from '../infra/supabase/connect';
import { Notification, NotificationDTO } from '../models/Notification';

export class NotificationService {

  private table = "notifications";

  async create(notification: Notification): Promise<NotificationDTO | null> {
    const { data, error } = await supabase
      .from(this.table)
      .insert([notification])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as NotificationDTO;
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
}
