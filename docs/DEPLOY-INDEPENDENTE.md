# 🚀 Guia de Deploy Independente - API Python

Guia rápido para hospedar a API Python em servidor separado da API principal.

## 📦 O Que Você Precisa

### No Servidor da API Python
- Docker e Docker Compose OU Python 3.10+
- Acesso aos serviços: Supabase (remoto) + Weaviate (local ou remoto) + GROQ (remoto)
- Porta 5001 disponível (configurável)

### No Servidor da API Principal (Node.js)
- Apenas acesso HTTP à API Python
- Variável `PYTHON_API_URL=http://servidor-python:5001`

## 🏃‍♂️ Deploy Rápido

### 1. Preparar Servidor Python

```bash
# Clone apenas o necessário
git clone https://github.com/alfredo003/smartquote-backend.git
cd smartquote-backend/scripts/busca_local

# Configurar ambiente
cp .env.example .env
nano .env  # Editar configurações
```

### 2. Configurar .env

```bash
# API Python
PYTHON_API_HOST=0.0.0.0
PYTHON_API_PORT=5001

# Supabase (sempre remoto)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# GROQ (sempre remoto)  
GROQ_API_KEY=gsk_sua_chave_groq

# Weaviate (local ou remoto)
WEAVIATE_URL=http://localhost:8080  # Para local
# WEAVIATE_URL=https://seu-cluster.weaviate.io  # Para remoto
```

### 3. Deploy com Docker (Recomendado)

```bash
# Para produção simples
docker-compose up --build -d

# Para desenvolvimento com Weaviate local
docker-compose --profile local up --build -d

# Para produção com Nginx load balancer
docker-compose --profile production up --build -d
```

### 4. Deploy Nativo (Alternativo)

```bash
# Instalar dependências
pip install -r requirements-api.txt

# Executar API
python app.py
```

### 5. Configurar API Principal

No servidor da API Node.js, configure:

```bash
# .env da API principal
PYTHON_API_URL=http://ip-servidor-python:5001
PYTHON_API_TIMEOUT=120000
```

## 🧪 Verificar Deploy

### Health Check
```bash
curl http://ip-servidor-python:5001/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "services": {
    "weaviate": true,
    "supabase": true,
    "decomposer": true
  }
}
```

### Teste de Busca
```bash
curl -X POST http://ip-servidor-python:5001/hybrid-search \
  -H "Content-Type: application/json" \
  -d '{"pesquisa": "notebook", "limite": 3}'
```

### Sincronizar Produtos
```bash
curl -X POST http://ip-servidor-python:5001/sync-products
```

## 🌐 Exemplos de Deploy por Provedor

### AWS EC2
```bash
# 1. Lançar EC2 Ubuntu 20.04+
# 2. Instalar Docker
sudo apt update && sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER

# 3. Deploy API Python
git clone https://github.com/alfredo003/smartquote-backend.git
cd smartquote-backend/scripts/busca_local
# ... configurar .env ...
docker-compose up --build -d

# 4. Configurar Security Group: porta 5001
```

### Google Cloud Run
```bash
# 1. Build da imagem
docker build -t gcr.io/seu-projeto/python-api .

# 2. Push para GCR
docker push gcr.io/seu-projeto/python-api

# 3. Deploy no Cloud Run
gcloud run deploy python-api \
  --image gcr.io/seu-projeto/python-api \
  --port 5001 \
  --set-env-vars PYTHON_API_HOST=0.0.0.0
```

### DigitalOcean Droplet
```bash
# 1. Criar Droplet Ubuntu
# 2. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Deploy
git clone https://github.com/alfredo003/smartquote-backend.git
cd smartquote-backend/scripts/busca_local
# ... configurar .env ...
docker-compose up --build -d

# 4. Configurar firewall
ufw allow 5001
```

### Heroku
```bash
# 1. Criar Dockerfile na raiz
FROM python:3.10-slim
WORKDIR /app
COPY scripts/busca_local/ .
RUN pip install -r requirements-api.txt
CMD python app.py

# 2. Deploy
heroku create seu-app-python
heroku config:set PYTHON_API_HOST=0.0.0.0
heroku config:set PYTHON_API_PORT=$PORT
# ... outras variáveis ...
git push heroku main
```

## 🔧 Configurações Avançadas

### Load Balancing (Múltiplas Instâncias)
```yaml
# docker-compose.yml
services:
  python-api-1:
    build: .
    environment:
      - INSTANCE_ID=api-1
  
  python-api-2:
    build: .
    environment:
      - INSTANCE_ID=api-2
      
  nginx:
    image: nginx:alpine
    ports: ["80:80"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### Weaviate Externo (Recomendado para Produção)
```bash
# Use Weaviate Cloud ou cluster dedicado
WEAVIATE_URL=https://seu-cluster.weaviate.io
WEAVIATE_API_KEY=sua_chave_weaviate
```

### Monitoramento
```bash
# Logs em tempo real
docker-compose logs -f python-api

# Métricas de containers
docker stats

# Health check automático
curl -f http://localhost:5001/health || echo "API down"
```

## 🆘 Troubleshooting

### Problema: API Python não conecta com Supabase
```bash
# Verificar variáveis
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Testar conexão
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     "$SUPABASE_URL/rest/v1/produtos?limit=1"
```

### Problema: Weaviate não está acessível
```bash
# Para Weaviate local
docker-compose logs weaviate
curl http://localhost:8080/v1/.well-known/ready

# Para Weaviate remoto
curl $WEAVIATE_URL/v1/.well-known/ready
```

### Problema: API Principal não conecta
```bash
# Da API Node.js, testar:
curl http://ip-servidor-python:5001/health

# Verificar firewall/security groups
# Verificar variável PYTHON_API_URL na API principal
```

## 📞 Suporte

- **Logs da API**: `docker-compose logs python-api`
- **Status dos serviços**: `curl http://localhost:5001/health`
- **Teste de conectividade**: Scripts em `scripts/test-python-api.ts`

---

**Resultado**: APIs Node.js e Python rodando em servidores completamente separados! 🎉
