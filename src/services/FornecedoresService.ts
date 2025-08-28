import supabase from '../infra/supabase/connect';
import { Fornecedor } from '../models/Fornecedor';

class FornecedoresService {

  private table = "fornecedores";

  async create(FornecedorData: Fornecedor) {
    // Remover qualquer id fornecido (auto-increment esperado)
    const { id, ...rest } = FornecedorData as any;
    const insertData = rest as Fornecedor;
    console.log('🛰️ [FornecedoresService.create] Dados para inserir:', insertData);
    // Normalizar campos de data para formato DATE (YYYY-MM-DD)
    const toDate = (v?: string) => {
      if (!v) return new Date().toISOString().split('T')[0];
      return v.includes('T') ? v.split('T')[0] : v;
    };
    (insertData as any).cadastrado_em = toDate((insertData as any).cadastrado_em);
    (insertData as any).atualizado_em = toDate((insertData as any).atualizado_em);
    // Garantir campos NOT NULL de texto não fiquem undefined
    ['contato_telefone','site','observacoes'].forEach(f => {
      if ((insertData as any)[f] === undefined || (insertData as any)[f] === null) {
        (insertData as any)[f] = '';
      }
    });
    console.log('🛠️ [FornecedoresService.create] Dados após normalização (pré-ID):', insertData);
    const getNextId = async (): Promise<number> => {
      const { data: maxRow, error: maxErr } = await supabase
        .from(this.table)
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (maxErr) throw new Error(`Erro ao obter último ID: ${maxErr.message}`);
      return (maxRow?.id || 0) + 1;
    };
    let attempt = 0;
    const maxAttempts = 5;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        (insertData as any).id = await getNextId();
        console.log(`� ID atribuído tentativa ${attempt}:`, (insertData as any).id);
        const { data, error } = await supabase
          .from(this.table)
          .insert([insertData])
          .select('*')
          .single();
        if (error) {
          // Duplicate key -> retry
            if (/duplicate key value violates unique constraint/i.test(error.message)) {
              console.warn('⚠️ ID duplicado, tentando novamente...');
              await new Promise(r => setTimeout(r, 50));
              continue;
            }
            console.error('💥 Erro ao inserir fornecedor:', error);
            throw new Error(`Failed to create fornecedor: ${error.message}`);
        }
        return data;
      } catch (e: any) {
        if (attempt >= maxAttempts) {
          console.error('💥 Falhou após múltiplas tentativas de gerar ID único:', e.message);
          throw e;
        }
      }
    }
    throw new Error('Failed to create fornecedor: could not generate unique ID');
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
 
    // Atualiza apenas os campos válidos
    const allowedFields = [
      'nome',
      'contato_email',
      'contato_telefone',
      'site',
      'observacoes',
      'ativo',
      'cadastrado_em',
      'cadastrado_por',
      'atualizado_em',
      'atualizado_por'
    ];
    const updateData: Partial<Fornecedor> = {};
    for (const key of allowedFields) {
      if (key in dataToUpdate) {
        (updateData as any)[key] = (dataToUpdate as any)[key];
      }
    }
    const { data, error } = await supabase
      .from(this.table)
      .update(updateData)
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
