import { Request, Response } from 'express';
import { userSchema } from '../schemas/UserSchema';
import UserService from '../services/UserService';

class UserController {

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
      return res.status(400).json({ error: err.message });
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
      await UserService.delete(String(id));
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
