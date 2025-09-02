#!/bin/bash

# Script para inicializar a API Python de busca local
# Uso: ./start-python-api.sh [port] [host]

set -e

# Configurações padrão
DEFAULT_PORT=5001
DEFAULT_HOST="127.0.0.1"
DEFAULT_DEBUG="false"

# Obter argumentos
PORT=${1:-$DEFAULT_PORT}
HOST=${2:-$DEFAULT_HOST}
DEBUG=${3:-$DEFAULT_DEBUG}

# Diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUSCA_LOCAL_DIR="$SCRIPT_DIR/busca_local"

echo "🐍 [PYTHON-API] Iniciando API Python de busca local..."
echo "📁 Diretório: $BUSCA_LOCAL_DIR"
echo "🌐 Endereço: $HOST:$PORT"
echo "🔧 Debug: $DEBUG"

# Verificar se o diretório existe
if [ ! -d "$BUSCA_LOCAL_DIR" ]; then
    echo "❌ Erro: Diretório busca_local não encontrado em $BUSCA_LOCAL_DIR"
    exit 1
fi

# Navegar para o diretório
cd "$BUSCA_LOCAL_DIR"

# Verificar se Python está disponível
if ! command -v python &> /dev/null; then
    echo "❌ Erro: Python não encontrado no PATH"
    exit 1
fi

# Verificar versão do Python
PYTHON_VERSION=$(python --version 2>&1)
echo "🐍 Versão do Python: $PYTHON_VERSION"

# Verificar se requirements estão instalados
echo "📦 Verificando dependências..."
if [ -f "requirements-api.txt" ]; then
    echo "📋 Instalando dependências do requirements-api.txt..."
    pip install -r requirements-api.txt
elif [ -f "requirements.txt" ]; then
    echo "📋 Instalando dependências do requirements.txt + Flask..."
    pip install -r requirements.txt flask flask-cors
else
    echo "⚠️ Nenhum arquivo requirements encontrado. Instalando dependências mínimas..."
    pip install flask flask-cors pydantic weaviate-client sentence-transformers groq supabase
fi

# Verificar se app.py existe
if [ ! -f "app.py" ]; then
    echo "❌ Erro: app.py não encontrado no diretório busca_local"
    exit 1
fi

# Carregar variáveis de ambiente se .env existir
if [ -f ".env" ]; then
    echo "🔧 Carregando variáveis de ambiente do .env"
    export $(cat .env | xargs)
elif [ -f "../.env" ]; then
    echo "🔧 Carregando variáveis de ambiente do .env do projeto"
    export $(cat ../.env | xargs)
fi

# Definir variáveis de ambiente para a API
export PYTHON_API_PORT="$PORT"
export PYTHON_API_HOST="$HOST"
export PYTHON_API_DEBUG="$DEBUG"

# Adicionar diretório pai ao PYTHONPATH
export PYTHONPATH="$PROJECT_DIR:$PYTHONPATH"

echo ""
echo "🚀 Iniciando API Python..."
echo "💡 Para parar o servidor, pressione Ctrl+C"
echo "🔗 Health check: http://$HOST:$PORT/health"
echo ""

# Iniciar a aplicação Flask
python app.py
