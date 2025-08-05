import { Request, Response } from 'express';
import supabase from '../infra/supabase/connect';
import { signUpSchema } from '../schemas/auth.schema';

class AuthController {
  async signUp(req: Request, res: Response): Promise<Response> {
    const parsed = signUpSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({ errors });
    }

    console.log(parsed.data);
    const { username, email, password } = parsed.data;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: username,
        },
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso.',
      userId: data.user?.id,
    });
  }
}

export default new AuthController();
