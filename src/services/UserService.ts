import supabase from '../infra/supabase/connect';
import { User, UserDTO } from '../models/User';
import { passwordHash } from '../utils/passwordHash';
import AuthService from './AuthService';

class UserService {

  async getByEmail(email: string): Promise<UserDTO | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('email', email)
      .single();
    if (error) {
      throw new Error(`Failed to get user by email: ${error.message}`);
    }
    return data as unknown as UserDTO;
  }

  private table = "users";


async create(data: User): Promise<UserDTO> {
   let userId: string | null = null;
  try { 
    const authResult = await AuthService.signUp({
      username: data.name,
      email: data.email,
      password: data.password,
    });

    userId = authResult.userId || null;
    if (!userId) {
      throw new Error('Failed to create user in AuthService');
    }
    const { data: dataResult, error } = await supabase
      .from(this.table)
      .insert({
        name: data.name,
        email: data.email,
        contact: data.contact,
        password: await passwordHash(data.password),
        department: data.department,
        position: data.position,
        auth_id : userId
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to insert user in database: ${error.message}`);
    }

    return dataResult as unknown as UserDTO;

  } catch (err) {
    if (userId) {
      await supabase.auth.admin.deleteUser(userId);
    }
    throw err;
  }
}

  async getAll(): Promise<UserDTO[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }
    return data as unknown as UserDTO[];
  }

  async getById(id: string): Promise<UserDTO | null> {
    const { data, error } = await supabase
      .from(this.table)
  .select(`id, name, email, position, created_at`)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get User by ID: ${error.message}`);
    }

    return data as unknown as UserDTO;
  }
  
  async delete(id: string): Promise<void> {

    const { data: user, error: fetchError } = await supabase
      .from(this.table)
      .select('auth_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch user before delete: ${fetchError.message}`);
    }

    const userId = user?.auth_id;

    const { error: deleteError } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }

    if (userId) {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        throw new Error(`Failed to delete user from auth: ${authError.message}`);
      }
    }
  }

    async updatePartial(id: string, data: Partial<UserDTO>): Promise<UserDTO> {
    const { data: updatedData, error } = await supabase
      .from(this.table)
      .update(data)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return updatedData as unknown as UserDTO;
  }

}

export default new UserService();