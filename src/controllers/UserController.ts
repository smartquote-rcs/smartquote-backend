import type { Request, Response } from 'express';
import { userSchema } from '../schemas/UserSchema';
import UserService from '../services/UserService';
import { auditLog } from '../utils/AuditLogHelper';

class UserController {
  async getByEmail(req: Request, res: Response): Promise<Response> {
    try {
      const email = req.params.email as string;
      const user = await UserService.getByEmail(email);
      // Log para depuração
      console.log('DEBUG USER:', user);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      // Retorna exatamente o que está no banco, inclusive position
      return res.status(200).json(user);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  async create(req: Request, res: Response): Promise<Response> {
    const parsed = userSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({ errors });
    }
    try {
      const user = await UserService.create(parsed.data);
      return res.status(201).json({
        message: 'Funcionário cadastrado com sucesso.',
        user: user,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const users = await UserService.getAll();
      return res.status(200).json({
        message: 'Lista de users.',
        data: users,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const {id} = req.params;
      const user = await UserService.getById(String(id));
      return res.status(200).json({
        message: 'User.',
        data: user,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id || 'system';
      
      // Buscar usuário antes de deletar
      let userParaDeletar;
      try {
        userParaDeletar = await UserService.getById(String(id));
      } catch (error) {
        console.warn('Usuário não encontrado para log:', id);
      }
      
      await UserService.delete(String(id));
      
      // Log de auditoria: Deleção de usuário
      auditLog.log(
        currentUserId,
        'DELETE_USER',
        'users',
        undefined,
        {
          usuario_deletado_id: id,
          nome: userParaDeletar?.name
        }
      ).catch(console.error);
      
      return res.status(200).json({ message: 'User deletado com sucesso.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async patch(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedUser = await UserService.updatePartial(String(id), updates);
      return res.status(200).json({
        message: 'User atualizado com sucesso.',
        data: updatedUser,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default new UserController();


