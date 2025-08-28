import { Request, Response, NextFunction } from 'express';
import supabase from '../infra/supabase/connect';

// Helper para obter registro interno de usuário e mapear posição para role
async function loadAppUser(email: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, position')
      .eq('email', email)
      .single();
    if (error || !data) return null;
    const pos = ((data as any).position || '').toString().trim().toLowerCase();
    let role: string = 'user';
    if (['admin','administrator','administrador'].some(k=>k===pos) || pos.includes('admin')) role = 'admin';
    else if (['manager','gestor','coordenador'].some(k=>k===pos) || pos.includes('manager') || pos.includes('gestor')) role = 'manager';
    // log resolução
    console.log('[authMiddleware] user role resolved', { email: data.email, position: data.position, role });
    return { id: data.id, email: data.email, position: data.position, role };
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
  }
  (req as any).user = {
    id: enriched?.id || user.id,
    email: user.email,
    role: enriched?.role || 'user',
    position: enriched?.position,
    raw: user
  };

  next();
}
