import { Router } from 'express';
import supabase from '../infra/supabase/connect';

const upsertRouter = Router();

// POST /api/users/upsert { email, name?, role?, position? }
upsertRouter.post('/upsert', async (req, res) => {
  try {
    const { email, name, role, position } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email obrigatório' });
    }

    // Tenta localizar usuário existente
    const { data: existing, error: selError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .maybeSingle();
    if (selError) console.warn('Upsert user select error:', selError.message);

    if (existing) {
      // Opcional: atualizar nome/position se enviados
      let needsUpdate = false;
      const updates: any = {};
      if (name && name !== existing.name) { updates.name = name; needsUpdate = true; }
      if (position && position !== existing.position) { updates.position = position; needsUpdate = true; }
      if (needsUpdate) {
        await supabase.from('users').update(updates).eq('id', existing.id);
      }
      return res.status(200).json({ data: { id: existing.id, email: existing.email, name: updates.name || existing.name, position: updates.position || existing.position } });
    }

    // Criar novo usuário básico
    const newUser = {
      name: name || email.split('@')[0],
      email,
      contact: '',
      password: '', // placeholder; autenticação real deve gerir hash
      department: '',
      position: position || role || 'user'
    };
    const { data: inserted, error: insError } = await supabase
      .from('users')
      .insert([newUser])
      .select('id, name, position, email')
      .single();
    if (insError) throw new Error(insError.message);
    return res.status(201).json({ data: inserted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return res.status(500).json({ error: msg });
  }
});

export default upsertRouter;