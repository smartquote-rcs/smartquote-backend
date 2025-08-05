import { Request, Response } from 'express';
import supabase from '../infra/supabase/connect';
import { signUpSchema } from '../schemas/signup.schema';
import { signInSchema } from '../schemas/signIn.schema';

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
  async signIn(req: Request, res: Response): Promise<Response>
  {
      const parsed = signInSchema.safeParse(req.body);

      if (!parsed.success) {
        const errors = parsed.error.format();
        return res.status(400).json({ errors });
      }

      const { email, password } = parsed.data;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ error: error.message });
      }

    return res.status(200).json({
      token: data.session?.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  }
}

export default new AuthController();
