import { Request, Response } from 'express';
import supabase from '../infra/supabase/connect';

export const signUp = async (req: Request, res: Response) => 
{
    const { username, email, password } = req.body;

    if (!email || !password || !username ) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
            display_name: username
            }
        }
    });
    return res.status(201).json({
    message: 'Usuário cadastrado com sucesso.',
    userId: data.user?.id,
  });
};
