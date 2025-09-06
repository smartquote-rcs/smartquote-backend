/**
 * Serviço para enviar e-mails de verificação para autenticação de dois fatores
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface VerificationEmailOptions {
  to: string;
  subject: string;
  code: string;
}

class EmailVerificationService {
  private static instance: EmailVerificationService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    // Configurar o transporter do Nodemailer
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  static getInstance(): EmailVerificationService {
    if (!EmailVerificationService.instance) {
      EmailVerificationService.instance = new EmailVerificationService();
    }
    return EmailVerificationService.instance;
  }

  /**
   * Envia um e-mail com o código de verificação para autenticação de dois fatores
   */
  async sendVerificationCode(options: VerificationEmailOptions): Promise<boolean> {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Código de Verificação</h2>
          <p style="font-size: 16px; color: #555;">Olá,</p>
          <p style="font-size: 16px; color: #555;">Seu código de verificação para acesso ao sistema é:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; background-color: #f5f5f5; padding: 10px 20px; border-radius: 5px; letter-spacing: 5px;">${options.code}</span>
          </div>
          <p style="font-size: 16px; color: #555;">Este código é válido por 3 minutos.</p>
          <p style="font-size: 16px; color: #555;">Se você não solicitou este código, por favor ignore este e-mail.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 14px; color: #999; text-align: center;">Este é um e-mail automático, por favor não responda.</p>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'no-reply@smartquote.com',
        to: options.to,
        subject: options.subject || 'Código de Verificação - SmartQuote',
        html: htmlContent,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`E-mail de verificação enviado: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar e-mail de verificação:', error);
      return false;
    }
  }
}

export default EmailVerificationService;
