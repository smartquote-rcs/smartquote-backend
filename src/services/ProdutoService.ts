import supabase from '../infra/supabase/connect';
import { Produto, ProdutoDTO } from '../models/Produto';

export class ProdutosService {
  async create(produto: Produto): Promise<ProdutoDTO | null> {
    const { data, error } = await supabase
      .from('produtos')
      .insert([produto])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ProdutoDTO;
  }

  async getAll(): Promise<ProdutoDTO[]> {
    const { data, error } = await supabase
      .from('produtos')
      .select('*');

    if (error) throw new Error(error.message);
    return data as ProdutoDTO[];
  }

  async getById(id: number): Promise<ProdutoDTO | null> {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as ProdutoDTO;
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async updatePartial(id: number, produto: Partial<Produto>): Promise<ProdutoDTO | null> {
    const { data, error } = await supabase
      .from('produtos')
      .update(produto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ProdutoDTO;
  }
}
