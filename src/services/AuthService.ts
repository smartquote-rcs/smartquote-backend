import supabase from '../infra/supabase/connect';
import crypto from 'crypto';
import EmailVerificationService from './EmailVerificationService';

interface SignUpInput {
  username: string;
  email: string;
  password: string;
}

interface SignInInput {
  email: string;
  password: string;
}

// Armazenamento temporário para códigos de verificação
interface VerificationCode {
  code: string;
  expiresAt: Date;
  attempts: number;
}

interface TemporaryToken {
  email: string;
  expiresAt: Date;
}

// Armazenamento em memória para códigos e tokens temporários
const verificationCodes: Map<string, VerificationCode> = new Map();
const temporaryAuthTokens: Map<string, TemporaryToken> = new Map();

class AuthService {
  async signUp({ username, email, password }: SignUpInput) {
    const frontendUrl = process.env.FRONTEND_URL || "https://smartquote-rcs-front-end.onrender.com/";
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: username },
        emailRedirectTo: frontendUrl,
      },
    });

    if (error) throw new Error(error.message);

    return {
      userId: data.user?.id,
    };
  }

  async signIn({ email, password }: SignInInput) {
    // VALIDAÇÃO CASE-SENSITIVE: Verificar se o email existe EXATAMENTE como digitado na tabela users
    const { data: userCheck, error: userCheckError } = await supabase
      .from('users')
      .select('email, id, position')
      .eq('email', email)
      .single();
    
    if (userCheckError || !userCheck) {
      console.log(`❌ [AuthService] Email ${email} não encontrado na tabela users`);
      throw new Error("Email não encontrado ou digitado incorretamente. Verifique as maiúsculas e minúsculas.");
    }

    console.log(`✅ [AuthService] Email validado: ${email} encontrado na tabela users com position: ${userCheck.position}`);

    // Tentar login no Supabase Auth apenas se email existir exato na tabela users
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`❌ [AuthService] Erro no Supabase Auth: ${error.message}`);
      throw new Error(error.message);
    }

    console.log(`✅ [AuthService] Login bem-sucedido para: ${email}`);

    return {
      token: data.session?.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };
  }

async recoverPassword(email: string) {
  if (!email) {
    throw new Error("E-mail é obrigatório");
  }
 
  const { data: user, error: userError } = await supabase
    .from("users") 
    .select("id, email")
    .eq("email", email)
    .single();

  if (userError || !user) {
    throw new Error("E-mail não encontrado");
  }
 
  const frontendUrl = process.env.FRONTEND_URL || "https://smartquote-rcs-front-end.onrender.com/";
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: frontendUrl,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { message: "E-mail de recuperação enviado com sucesso" };
}

async resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword) {
    throw new Error("Token e nova senha são obrigatórios");
  }

  // Validar força da senha
  if (newPassword.length < 8) {
    throw new Error("Nova senha deve ter pelo menos 8 caracteres");
  }

  try {
    console.log('🔑 Processando reset com token:', token.substring(0, 20) + '...');
    
    // Criar um cliente separado para esta operação
    const { createClient } = require('@supabase/supabase-js');
    const resetClient = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Usar o token diretamente como JWT para autenticação
    const { data: userData, error: userError } = await resetClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error('❌ Token inválido:', userError?.message);
      throw new Error("Token inválido ou expirado. Solicite uma nova recuperação de senha.");
    }

    console.log('✅ Token válido, usuário identificado:', userData.user.email);

    // Agora atualizar a senha diretamente no banco usando service role
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      userData.user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('❌ Erro ao atualizar senha:', updateError.message);
      throw new Error("Erro ao atualizar a senha: " + updateError.message);
    }

    console.log('✅ Senha atualizada com sucesso para usuário:', userData.user.email);

    return { 
      message: "Senha alterada com sucesso",
      user: updateData.user 
    };
  } catch (error: any) {
    console.error('💥 Erro no resetPassword:', error.message);
    
    // Melhorar as mensagens de erro
    if (error.message.includes('Invalid token') || 
        error.message.includes('expired') || 
        error.message.includes('JWT')) {
      throw new Error("Token inválido ou expirado. Solicite uma nova recuperação de senha.");
    }
    
    throw new Error(error.message || "Erro ao redefinir senha");
  }
}

  /**
   * Inicia o processo de autenticação de dois fatores
   * 1. Verifica se o e-mail existe
   * 2. Gera um código de verificação
   * 3. Envia o código para o e-mail do usuário
   * 4. Retorna uma mensagem de sucesso
   */
  async initiateTwoFactorAuth(email: string) {
    if (!email) {
      throw new Error("E-mail é obrigatório");
    }

    // Verifica se o usuário existe
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      throw new Error("Usuário não encontrado");
    }

    // Gera um código de verificação de 6 dígitos
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    
    // Armazena o código com um tempo de expiração de 3 minutos
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 3);
    
    verificationCodes.set(email, {
      code: verificationCode,
      expiresAt: expirationTime,
      attempts: 0
    });

    // Envia o código por e-mail
    const emailService = EmailVerificationService.getInstance();
    const emailSent = await emailService.sendVerificationCode({
      to: email,
      subject: 'Código de Verificação - SmartQuote',
      code: verificationCode
    });

    if (!emailSent) {
      throw new Error("Falha ao enviar o código de verificação por e-mail");
    }
    
    console.log(`Código de verificação para ${email} enviado com sucesso`);

    return {
      message: "Código de verificação enviado para o e-mail",
      expiresAt: expirationTime
    };
  }

  /**
   * Verifica o código de autenticação de dois fatores
   * 1. Verifica se o código é válido e não expirou
   * 2. Se válido, autentica o usuário
   * 3. Retorna o token de acesso
   */
  /**
   * Primeira etapa da autenticação de dois fatores: verificar o código
   */
  async twoFactorAuth(email: string, code: string) {
    if (!email || !code) {
      throw new Error("E-mail e código são obrigatórios");
    }

    // Recupera o código de verificação armazenado
    const storedVerification = verificationCodes.get(email);
    
    if (!storedVerification) {
      throw new Error("Nenhum código de verificação solicitado para este e-mail");
    }

    // Verifica se o código expirou
    const now = new Date();
    if (now > storedVerification.expiresAt) {
      verificationCodes.delete(email);
      throw new Error("Código de verificação expirado");
    }

    // Incrementa o número de tentativas
    storedVerification.attempts += 1;
    
    // Limite de 3 tentativas
    if (storedVerification.attempts > 3) {
      verificationCodes.delete(email);
      throw new Error("Número máximo de tentativas excedido");
    }

    // Verifica se o código está correto
    if (storedVerification.code !== code) {
      throw new Error("Código de verificação inválido");
    }

    // Código correto, remove da memória
    verificationCodes.delete(email);

    // Realiza o login do usuário sem senha (usando supabase admin)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      throw new Error("Usuário não encontrado");
    }

    // Após verificar o código, o usuário precisa informar a senha para completar o login
    // Este método retorna um token temporário que será usado pelo frontend para completar o login
    // com a senha do usuário
    
    // Para o propósito de desenvolvimento, podemos criar um token temporário
    const temporaryToken = crypto.randomBytes(32).toString('hex');
    
    // Armazenar o token temporário (idealmente em um cache/redis com TTL)
    temporaryAuthTokens.set(temporaryToken, {
      email: email,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutos
    });
    
    return {
      // Este token é temporário e deve ser usado apenas para a próxima etapa do login
      temporaryToken,
      user: {
        id: userData.id,
        email: userData.email,
      },
      message: "Verificação concluída com sucesso. Forneça sua senha para completar o login."
    };
  }
  
  /**
   * Segunda etapa da autenticação de dois fatores: completar o login com a senha
   */
  async completeTwoFactorAuth(temporaryToken: string, password: string) {
    if (!temporaryToken || !password) {
      throw new Error("Token temporário e senha são obrigatórios");
    }

    // Recupera o token temporário
    const tokenData = temporaryAuthTokens.get(temporaryToken);
    
    if (!tokenData) {
      throw new Error("Token temporário inválido ou expirado");
    }

    // Verifica se o token expirou
    const now = new Date();
    if (now > tokenData.expiresAt) {
      temporaryAuthTokens.delete(temporaryToken);
      throw new Error("Token temporário expirado");
    }

    // Remove o token temporário
    temporaryAuthTokens.delete(temporaryToken);
    
    // Realiza o login com email e senha
    const { data, error } = await supabase.auth.signInWithPassword({
      email: tokenData.email,
      password,
    });

    if (error) {
      throw new Error("Falha na autenticação: " + error.message);
    }

    return {
      token: data.session?.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      message: "Autenticação de dois fatores concluída com sucesso"
    };
  }
}

export default new AuthService();
