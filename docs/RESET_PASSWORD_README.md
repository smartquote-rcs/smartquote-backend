# Reset de Senha - SmartQuote

## Fluxo de Reset de Senha

O sistema de reset de senha foi implementado com as seguintes funcionalidades:

### 1. Solicitar Reset de Senha

**Frontend (LoginPage):**
- Na página de login, o usuário pode clicar em "Esqueci minha senha"
- Insere o email e clica em "Enviar link de recuperação"
- O sistema valida o email e envia para o backend

**Backend (AuthController.recoverPassword):**
- Endpoint: `POST /auth/forget`
- Valida se o email existe no sistema
- Usa o Supabase para enviar email de recuperação
- Retorna sucesso ou erro

### 2. Email de Recuperação

O Supabase envia um email com:
- Link de recuperação que redireciona para: `http://localhost:5173/`
- Token de acesso incluído nos parâmetros da URL
- Instruções para o usuário

### 3. Reset da Senha

**Duas opções de implementação:**

#### Opção A: LoginPage (Implementação Atual)
- O token é detectado automaticamente na URL quando o usuário clica no link do email
- A LoginPage exibe automaticamente o formulário de reset de senha
- Usuário insere nova senha e confirmação
- Sistema valida e chama a API para alterar a senha

#### Opção B: Página Dedicada (Implementação Criada)
- Página separada em `/reset-password`
- Interface dedicada para reset de senha
- Validação em tempo real dos critérios de senha
- Redirecionamento após sucesso

### 4. Backend - Reset da Senha

**Endpoint: `POST /auth/reset-password`**
- Recebe: `token` e `newPassword`
- Valida o token usando Supabase Auth
- Atualiza a senha do usuário
- Retorna sucesso ou erro

## Estrutura de Arquivos

### Frontend
```
src/
├── components/
│   ├── LoginPage.tsx                    # Contém funcionalidade de reset integrada
│   └── pages/
│       └── ResetPasswordPage.tsx        # Página dedicada para reset (alternativa)
├── api/
│   └── services.ts                      # authService.recoverPassword() e resetPassword()
└── App.tsx                              # Roteamento atualizado
```

### Backend
```
src/
├── controllers/
│   └── AuthController.ts                # recoverPassword() e resetPassword()
├── services/
│   └── AuthService.ts                   # Lógica de negócio
└── routers/
    └── auth.route.ts                    # Rotas /forget e /reset-password
```

## URLs e Endpoints

### Frontend
- Login: `http://localhost:5173/`
- Reset dedicado: `http://localhost:5173/reset-password` (opcional)

### Backend
- Solicitar reset: `POST /auth/forget`
- Aplicar reset: `POST /auth/reset-password`

## Como Testar

1. **Iniciar o backend:**
   ```bash
   cd smartquote-backend
   npm run dev
   ```

2. **Iniciar o frontend:**
   ```bash
   cd SmartQuote-RCS-Front-End
   npm run dev
   ```

3. **Testar o fluxo:**
   - Acessar `http://localhost:5173/`
   - Clicar em "Esqueci minha senha"
   - Inserir um email válido cadastrado no sistema
   - Verificar o email recebido
   - Clicar no link do email
   - Redefinir a senha
   - Fazer login com a nova senha

## Validações de Senha

A nova senha deve atender aos seguintes critérios:
- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula  
- Pelo menos 1 número
- Pelo menos 1 caractere especial

## Segurança

- Tokens de reset têm validade limitada (controlado pelo Supabase)
- URLs de reset são limpas após o uso para não expor tokens
- Validação de força de senha implementada
- Erros tratados adequadamente sem exposição de informações sensíveis
