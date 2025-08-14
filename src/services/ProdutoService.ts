import supabase from '../infra/supabase/connect';
import { Produto, ProdutoDTO } from '../models/Produto';

export class ProdutosService {

  private table = "produtos";

  async create(produto: Produto): Promise<ProdutoDTO | null> {
    const { data, error } = await supabase
      .from(this.table)
      .insert([produto])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ProdutoDTO;
  }

  async getAll(): Promise<ProdutoDTO[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*');

    if (error) throw new Error(error.message);
    return data as ProdutoDTO[];
  }

  async getById(id: number): Promise<ProdutoDTO | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as ProdutoDTO;
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async updatePartial(id: number, produto: Partial<Produto>): Promise<ProdutoDTO | null> {
    const { data, error } = await supabase
      .from(this.table)
      .update(produto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ProdutoDTO;
  }
}
