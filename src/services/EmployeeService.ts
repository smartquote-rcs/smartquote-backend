import supabase from '../infra/supabase/connect';
import { Employee, EmployeeDTO } from '../models/Employee';
import AuthService from './AuthService';

class EmployeeService {
  async create({ name, email, password, position }: Employee): Promise<EmployeeDTO> {

    const { userId } = await AuthService.signUp({
      username: name,
      email,
      password,
    });

    if (!userId) {
      throw new Error('Failed to create user');
    }

   const { data, error } = await supabase
  .from('employees')
  .insert({
    user_id: userId,
    name,
    position,
    created_at: new Date().toISOString(),
  })
  .select(`
    id,
    name,
    position,
    created_at,
    user:users(id, email, display_name)
  `)
  .single();
    if (error) {
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create employee: ${error.message}`);
    }

    return data as unknown as EmployeeDTO;
  }

  async getAll(): Promise<EmployeeDTO[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        id,
        name,
        position,
        created_at,
        user:users(id, email, display_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list employees: ${error.message}`);
    }

    return data as unknown as EmployeeDTO[];
  }

  async getById(id: string): Promise<EmployeeDTO | null> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        id,
        name,
        position,
        created_at,
        user:users(id, email, display_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get employee by ID: ${error.message}`);
    }

    return data as unknown as EmployeeDTO;
  }
  
  async delete(id: string): Promise<void> {

    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch employee before delete: ${fetchError.message}`);
    }

    const userId = employee?.user_id;

    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(`Failed to delete employee: ${deleteError.message}`);
    }

    if (userId) {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        throw new Error(`Failed to delete user from auth: ${authError.message}`);
      }
    }
  }

    async updatePartial(id: string, data: Partial<EmployeeDTO>): Promise<EmployeeDTO> {
    const { data: updatedData, error } = await supabase
      .from('employees')
      .update(data)
      .eq('id', id)
      .select(`
        id,
        name,
        position,
        created_at,
        user:users(id, email, display_name)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update employee: ${error.message}`);
    }

    return updatedData as unknown as EmployeeDTO;
  }

}

export default new EmployeeService();