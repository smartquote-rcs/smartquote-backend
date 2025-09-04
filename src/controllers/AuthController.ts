import { Request, Response } from 'express';
import { signUpSchema } from '../schemas/signUp.schema';
import { signInSchema } from '../schemas/signIn.schema';
import { initiateTwoFactorSchema, verifyTwoFactorSchema, completeTwoFactorSchema } from '../schemas/twoFactorAuth.schema';
import AuthService from '../services/AuthService';

class AuthController {
  async signUp(req: Request, res: Response): Promise<Response> {
    const parsed = signUpSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({ errors });
    }

    try {
      const result = await AuthService.signUp(parsed.data);
      return res.status(201).json({
        message: 'Usuário cadastrado com sucesso.',
        userId: result.userId,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async signIn(req: Request, res: Response): Promise<Response> {
    const parsed = signInSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({ errors });
    }

    try {
      const result = await AuthService.signIn(parsed.data);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(401).json({ error: err.message });
    }
  }

   async recoverPassword(req: Request, res: Response): Promise<Response> {
    const { email } = req.body;

    try {
      const result = await AuthService.recoverPassword(email);
      return res.status(200).json({
        message: "E-mail de recuperação enviado",
        result,
      });
    } catch (err: any) {
      return res.status(400).json({ error: "Email Invalido!" });
    }
  }
  // Initiate two-factor authentication
  async initiateTwoFactorAuth(req: Request, res: Response): Promise<Response> {
    const parsed = initiateTwoFactorSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({ errors });
    }

    try {
      const result = await AuthService.initiateTwoFactorAuth(parsed.data.email);
      return res.status(200).json({
        message: "Código de verificação enviado para o e-mail",
        expiresAt: result.expiresAt,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  // Verify two-factor authentication code (primeira etapa)
  async twoFactorAuth(req: Request, res: Response): Promise<Response> {
    const parsed = verifyTwoFactorSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({ errors });
    }

    try {
      const result = await AuthService.twoFactorAuth(parsed.data.email, parsed.data.code);
      return res.status(200).json({
        message: result.message,
        temporaryToken: result.temporaryToken,
        user: result.user
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  // Complete two-factor authentication with password (segunda etapa)
  async completeTwoFactorAuth(req: Request, res: Response): Promise<Response> {
    const parsed = completeTwoFactorSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({ errors });
    }

    try {
      const result = await AuthService.completeTwoFactorAuth(
        parsed.data.temporaryToken,
        parsed.data.password
      );
      
      return res.status(200).json({
        message: result.message,
        token: result.token,
        user: result.user
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

}

export default new AuthController();