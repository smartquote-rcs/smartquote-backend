import supabase from '../infra/supabase/connect';
import { Prompt } from '../models/Prompt';

class PromptsService {
  async create(promptData: Omit<Prompt, 'id'>): Promise<Prompt> {
    const { data, error } = await supabase
      .from('prompts')
      .insert(promptData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create prompt: ${error.message}`);
    }

    return data as Prompt;
  }

  async getAll(): Promise<Prompt[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('cadastrado_em', { ascending: false });

    if (error) {
      throw new Error(`Failed to list prompts: ${error.message}`);
    }

    return data as Prompt[];
  }

  async getById(id: number): Promise<Prompt | null> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get prompt by ID: ${error.message}`);
    }

    return data as Prompt;
  }

  async update(id: number, promptData: Partial<Prompt>): Promise<Prompt> {
    const { data, error } = await supabase
      .from('prompts')
      .update(promptData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update prompt: ${error.message}`);
    }

    return data as Prompt;
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete prompt: ${error.message}`);
    }
  }
}

export default new PromptsService();