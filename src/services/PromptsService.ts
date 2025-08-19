import supabase from '../infra/supabase/connect';

interface PromptInsert {
  texto_original: string;
  dados_extraidos: any;
  origem: any;
  status?: 'recebido' | 'pendente' | 'analizado' | 'enviado';
}

class PromptsService {
  async create(prompt: PromptInsert): Promise<number | null> {
    const payload = {
      texto_original: prompt.texto_original,
      dados_extraidos: prompt.dados_extraidos ?? {},
      origem: prompt.origem ?? { tipo: 'servico', fonte: 'api' },
      status: prompt.status ?? 'analizado',
    };

    const { data, error } = await supabase
      .from('prompts')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao criar prompt:', error);
      return null;
    }
    return data?.id ?? null;
  }
}

export default new PromptsService();
