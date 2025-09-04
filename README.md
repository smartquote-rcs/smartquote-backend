# SmartQuote Backend

Bem-vindo ao backend do SmartQuote! Este documento fornece todas as informações necessárias para que você possa entender, configurar e contribuir com o projeto.

## 📝 Descrição

O SmartQuote Backend é uma API RESTful desenvolvida em Node.js e TypeScript, responsável por gerenciar as principais funcionalidades da plataforma SmartQuote. Isso inclui o gerenciamento de cotações, produtos, fornecedores, usuários, integrações com sistemas externos como o ERP Dynamics, e a automação de processos através do monitoramento de e-mails e uso de inteligência artificial.

## ✨ Funcionalidades Principais

-   **Autenticação:** Sistema de login e gerenciamento de usuários com base em tokens.
-   **Gerenciamento de Cotações:** Criação, leitura, atualização e exclusão de cotações e seus itens.
-   **Busca de Produtos:**
    -   Busca interna no banco de dados.
    -   Busca externa através de uma API em Python para consultas mais complexas.
-   **Integração com Dynamics:** Sincronização de dados com o Microsoft Dynamics ERP.
-   **Monitoramento de E-mail:** Um worker dedicado monitora caixas de entrada de e-mail para processar novas cotações ou informações relevantes automaticamente.
-   **IA Generativa:** Utiliza o Google Gemini para auxiliar em tarefas como interpretação de dados e sugestões.
-   **Notificações:** Sistema para notificar os usuários sobre eventos importantes na plataforma.
-   **Geração de Relatórios:** Criação e download de relatórios em formatos como XLSX e CSV.
-   **Documentação da API:** Documentação interativa disponível via Swagger.

## 🛠️ Tecnologias Utilizadas

-   **Node.js:** Ambiente de execução JavaScript.
-   **TypeScript:** Superset do JavaScript que adiciona tipagem estática.
-   **Express.js:** Framework para construção de APIs.
-   **Supabase:** Plataforma BaaS (Backend as a Service) que provê banco de dados PostgreSQL e autenticação.
-   **Jest:** Framework para testes unitários.
-   **Swagger (OpenAPI):** Para documentação da API.
-   **Dotenv:** Para gerenciamento de variáveis de ambiente.

---

## 🚀 Começando

Siga estas instruções para ter uma cópia do projeto rodando em sua máquina local para desenvolvimento e testes.

### Pré-requisitos

-   [Node.js](https://nodejs.org/) (versão 18 ou superior)
-   [npm](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)
-   [Git](https://git-scm.com/)
-   Acesso ao workspace do Supabase do projeto.

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/alfredo003/smartquote-backend.git
    cd smartquote-backend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    -   Crie uma cópia do arquivo `.env.example` e renomeie para `.env`.
    -   Preencha as variáveis de ambiente no arquivo `.env` com as credenciais corretas do Supabase e outras chaves de API necessárias.
    ```bash
    cp env.example .env
    ```

### Executando a Aplicação

**Modo de Desenvolvimento:**
Para iniciar o servidor em modo de desenvolvimento com hot-reload (reinicia automaticamente ao detectar alterações nos arquivos):
```bash
npm run dev
```
O servidor estará disponível em `http://localhost:2001` (ou a porta definida em seu `.env`).

**API de Busca em Python:**
Algumas funcionalidades dependem de uma API em Python. Para iniciá-la:
```bash
npm run python-api:dev
```

**Produção:**
Para construir e iniciar a aplicação em modo de produção:
```bash
# 1. Construir o projeto (compilar TypeScript para JavaScript)
npm run build

# 2. Iniciar o servidor de produção
npm run start:prod
```

### Executando os Testes

Para rodar a suíte de testes unitários:
```bash
npm test
```

---

## 📚 Documentação da API

A documentação completa dos endpoints da API está disponível e pode ser acessada interativamente através do Swagger UI. Com o servidor rodando, acesse:

[http://localhost:2001/doc](http://localhost:2001/doc)

## 📂 Estrutura do Projeto

```
smartquote-backend/
├── src/
│   ├── controllers/  # Lógica de requisição/resposta (rotas)
│   ├── services/     # Lógica de negócio e regras da aplicação
│   ├── models/       # Definições de tipos e interfaces de dados
│   ├── routers/      # Definição das rotas da API
│   ├── middleware/   # Middlewares do Express (ex: autenticação)
│   ├── workers/      # Processos em segundo plano (ex: monitor de email)
│   ├── infra/        # Configuração de infraestrutura (ex: cliente Supabase)
│   ├── schemas/      # Esquemas de validação (Zod)
│   ├── utils/        # Funções utilitárias
│   ├── server.ts     # Ponto de entrada da aplicação
│   └── swagger.json  # Arquivo de definição da OpenAPI
├── scripts/          # Scripts de automação e teste
├── migrations/       # Migrações do banco de dados
├── .env.example      # Arquivo de exemplo para variáveis de ambiente
├── package.json      # Dependências e scripts do projeto
└── tsconfig.json     # Configurações do compilador TypeScript
```


