import supabase from '../infra/supabase/connect';
import { Fornecedor } from '../models/Fornecedor';

class FornecedoresService {

  private table = "Fornecedores";

  async create(FornecedorData: Fornecedor) {
    const { data, error } = await supabase
      .from(this.table)
      .insert(FornecedorData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create fornecedor: ${error.message}`);
    }

    return data;
  }

  async getAll() {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .order('cadastrado_em', { ascending: false });

    if (error) {
      throw new Error(`Failed to list fornecedores: ${error.message}`);
    }

    return data;
  }

  async getById(id: number) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get fornecedor by ID: ${error.message}`);
    }

    return data;
  }

  async delete(id: number) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete fornecedor: ${error.message}`);
    }
  }

  async updatePartial(id: number, dataToUpdate: Partial<Fornecedor>) {
 
    const { data, error } = await supabase
      .from(this.table)
      .update(dataToUpdate)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update fornecedor: ${error.message}`);
    }

    return data;
  }
}

export default new FornecedoresService();
