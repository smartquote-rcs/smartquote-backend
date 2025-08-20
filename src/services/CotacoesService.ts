import supabase from '../infra/supabase/connect';
import { Cotacao, CotacaoDTO } from '../models/Cotacao';

class CotacoesService {
  async create( CotacaoData: Cotacao): Promise<CotacaoDTO> {
    const { data, error } = await supabase
      .from('cotacoes')
      .insert(CotacaoData)
      .select(`
        *,
        prompt:prompts(id, texto_original)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create cotacao: ${error.message}`);
    }

    return data as unknown as CotacaoDTO;
  }

  async getAll(): Promise<CotacaoDTO[]> {
    const { data, error } = await supabase
      .from('cotacoes')
      .select(`
        *,
        prompt:prompts(id, texto_original)
      `)
      .order('cadastrado_em', { ascending: false });

    if (error) {
      throw new Error(`Failed to list cotacoes: ${error.message}`);
    }

    return data as unknown as CotacaoDTO[];
  }

  async getById(id: number): Promise<CotacaoDTO | null> {
    const { data, error } = await supabase
      .from('cotacoes')
      .select(`
        *,
        prompt:prompts(id, texto_original)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get cotacao by ID: ${error.message}`);
    }

    return data as unknown as CotacaoDTO;
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('cotacoes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete cotacao: ${error.message}`);
    }
  }

  async updatePartial(id: number, dataToUpdate: Partial<Cotacao>): Promise<CotacaoDTO> {
   
    const { data, error } = await supabase
      .from('cotacoes')
      .update(dataToUpdate)
      .eq('id', id)
      .select(`
        *,
        prompt:prompts(id, texto_original)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update cotacao: ${error.message}`);
    }

    return data as unknown as CotacaoDTO;
  }
}

export default new CotacoesService();