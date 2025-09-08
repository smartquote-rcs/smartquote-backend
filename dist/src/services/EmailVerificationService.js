"use strict";
/**
 * Serviço para enviar e-mails de verificação para autenticação de dois fatores
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class EmailVerificationService {
    static instance;
    transporter;
    constructor() {
        // Configurar o transporter do Nodemailer
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }
    static getInstance() {
        if (!EmailVerificationService.instance) {
            EmailVerificationService.instance = new EmailVerificationService();
        }
        return EmailVerificationService.instance;
    }
    /**
     * Envia um e-mail com o código de verificação para autenticação de dois fatores
     */
    async sendVerificationCode(options) {
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
        }
        catch (error) {
            console.error('Erro ao enviar e-mail de verificação:', error);
            return false;
        }
    }
}
exports.default = EmailVerificationService;
//# sourceMappingURL=EmailVerificationService.js.map