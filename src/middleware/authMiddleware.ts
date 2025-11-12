import { Request, Response, NextFunction } from 'express';
import supabase from '../infra/supabase/connect';

// Helper para obter registro interno de usuário e mapear posição para role
async function loadAppUser(email: string) {
  try {
    // Busca case-sensitive - email deve ser exatamente igual ao da DB
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, position, auth_id')
      .eq('email', email)
      .single();
    if (error || !data) return null;
    const pos = ((data as any).position || '').toString().trim().toLowerCase();
    let role: string = 'user';
    if (['admin','administrator','administrador'].some(k=>k===pos) || pos.includes('admin')) role = 'admin';
    else if (['manager','gestor','coordenador'].some(k=>k===pos) || pos.includes('manager') || pos.includes('gestor')) role = 'manager';
    // log resolução
    console.log('[authMiddleware] user role resolved', { email: data.email, position: data.position, role });
    return { id: data.id, email: data.email, name: data.name, position: data.position, role, auth_id: data.auth_id };
  } catch {
    return null;
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = authHeader.replace('Bearer ', '');

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
  
  // Enriquecer com dados da tabela users para obter position/role
  let enriched = null;
  if (user.email) {
    enriched = await loadAppUser(user.email);
    
    // VALIDAÇÃO CASE-SENSITIVE: Se o usuário não existe na tabela users, rejeitar
    if (!enriched) {
      console.log(`❌ [authMiddleware] Usuário ${user.email} não encontrado na tabela users - acesso negado`);
      return res.status(403).json({ 
        error: 'Acesso negado. Usuário não encontrado no sistema interno. Contate o administrador.' 
      });
    }
  }
  
  (req as any).user = {
    id: user.id, // UUID do Supabase Auth
    internalId: enriched?.id, // ID numérico da tabela users
    email: user.email,
    name: enriched?.name || user.email?.split('@')[0] || 'Usuário',
    role: enriched?.role || 'user',
    position: enriched?.position,
    raw: user
  };

  next();
}
