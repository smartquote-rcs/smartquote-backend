/**
 * Serviço para enviar e-mails de verificação para autenticação de dois fatores
 */
interface VerificationEmailOptions {
    to: string;
    subject: string;
    code: string;
}
declare class EmailVerificationService {
    private static instance;
    private transporter;
    private constructor();
    static getInstance(): EmailVerificationService;
    /**
     * Envia um e-mail com o código de verificação para autenticação de dois fatores
     */
    sendVerificationCode(options: VerificationEmailOptions): Promise<boolean>;
}
export default EmailVerificationService;
//# sourceMappingURL=EmailVerificationService.d.ts.map