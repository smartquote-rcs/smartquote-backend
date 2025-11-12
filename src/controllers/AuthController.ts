import { Request, Response } from 'express';
import { signUpSchema } from '../schemas/signUp.schema';
import { signInSchema } from '../schemas/signIn.schema';
import { initiateTwoFactorSchema, verifyTwoFactorSchema, completeTwoFactorSchema } from '../schemas/twoFactorAuth.schema';
import AuthService from '../services/AuthService';
import { auditLog } from '../utils/AuditLogHelper';

class AuthController {
  async signUp(req: Request, res: Response): Promise<Response> {
    const parsed = signUpSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({ errors });
    }

    try {
      const result = await AuthService.signUp(parsed.data);
      
      // Log de auditoria: Registro de novo usuário
      if (result.userId) {
        auditLog.log(
          result.userId,
          'USER_REGISTER',
          'users',
          undefined,
          {
            email: parsed.data.email,
            username: parsed.data.username,
            ip: req.ip,
            user_agent: req.get('user-agent')
          }
        ).catch(console.error);
      }
      
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
      
      // Log de auditoria: Login bem-sucedido
      if (result.user?.id) {
        auditLog.logLogin(
          result.user.id,
          req.ip,
          req.get('user-agent'),
          true
        ).catch(console.error);
      }
      
      return res.status(200).json(result);
    } catch (err: any) {
      // Log de auditoria: Tentativa de login falhou
      auditLog.log(
        'system',
        'USER_LOGIN_FAILED',
        undefined,
        undefined,
        {
          email: parsed.data?.email,
          ip: req.ip,
          user_agent: req.get('user-agent'),
          erro: err.message
        }
      ).catch(console.error);
      
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

  async resetPassword(req: Request, res: Response): Promise<Response> {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token e nova senha são obrigatórios" });
    }

    try {
      const result = await AuthService.resetPassword(token, newPassword);
      
      // Log de auditoria: Reset de senha
      if (result.user?.id) {
        auditLog.logPasswordChange(
          result.user.id,
          'reset'
        ).catch(console.error);
      }
      
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async logout(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Log de auditoria: Logout
      auditLog.logLogout(
        user.id,
        req.ip,
        req.get('user-agent')
      ).catch(console.error);
      
      return res.status(200).json({ 
        message: 'Logout realizado com sucesso' 
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

}

export default new AuthController();