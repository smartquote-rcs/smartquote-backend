import supabase from '../infra/supabase/connect';
import { Log, LogsDTO } from '../models/Log';

export class LogService {

  private table = "logs";

  async create(logs: Log): Promise<LogsDTO | null> {
 
    const  logData = logs as any;
    
    try {
      const { data, error } = await supabase
        .from(this.table)
        .insert(logData)
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      return data as LogsDTO;
    } catch (err: any) {
      throw err;
    }
  }

  async getAll(): Promise<LogsDTO[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .order('cadastrado_em', { ascending: false });

    if (error) throw new Error(error.message);
    return data as LogsDTO[];
  }

  async getById(id: number): Promise<LogsDTO | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as LogsDTO;
  }
 
}
