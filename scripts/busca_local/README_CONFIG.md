# Configuração do Sistema de Busca Local

## Configuração de Variáveis de Ambiente

Este sistema usa variáveis de ambiente para proteger credenciais sensíveis.

### Passo 1: Criar arquivo .env

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

### Passo 2: Configurar credenciais

Edite o arquivo `.env` com suas credenciais:


### Passo 3: Executar migração

Execute o script de migração SQL no Supabase:

```sql
-- Copie e execute o conteúdo de migration_script_otimizado.sql
```

### Passo 4: Testar sistema

```bash
python main.py --help
```

## Segurança

- ⚠️ **NUNCA** faça commit do arquivo `.env`
- ✅ Use apenas `.env.example` como template
- ✅ O arquivo `.env` está protegido pelo `.gitignore`

## Estrutura de Arquivos

```
busca_local/
├── .env                    # Credenciais (NÃO fazer commit)
├── .env.example           # Template de exemplo
├── .gitignore             # Proteção de arquivos sensíveis
├── config.py              # Configurações do sistema
├── migration_script_otimizado.sql  # Script de migração DB
└── ...
```
