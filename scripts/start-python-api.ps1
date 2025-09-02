# Script PowerShell para inicializar a API Python de busca local
# Uso: .\start-python-api.ps1 [port] [host] [debug]

param(
    [int]$Port = 5001,
    [string]$Host = "127.0.0.1",
    [string]$Debug = "false"
)

# Configurações
$ErrorActionPreference = "Stop"

Write-Host "🐍 [PYTHON-API] Iniciando API Python de busca local..." -ForegroundColor Green
Write-Host "📁 Diretório de trabalho: $PWD" -ForegroundColor Cyan
Write-Host "🌐 Endereço: $Host`:$Port" -ForegroundColor Cyan
Write-Host "🔧 Debug: $Debug" -ForegroundColor Cyan

# Obter diretórios
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$BuscaLocalDir = Join-Path $ScriptDir "busca_local"

Write-Host "📂 Diretório busca_local: $BuscaLocalDir" -ForegroundColor Yellow

# Verificar se o diretório existe
if (-not (Test-Path $BuscaLocalDir)) {
    Write-Host "❌ Erro: Diretório busca_local não encontrado em $BuscaLocalDir" -ForegroundColor Red
    exit 1
}

# Navegar para o diretório
Set-Location $BuscaLocalDir

# Verificar se Python está disponível
try {
    $PythonVersion = python --version 2>&1
    Write-Host "🐍 Versão do Python: $PythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: Python não encontrado no PATH" -ForegroundColor Red
    exit 1
}

# Verificar e instalar dependências
Write-Host "📦 Verificando dependências..." -ForegroundColor Yellow

if (Test-Path "requirements-api.txt") {
    Write-Host "📋 Instalando dependências do requirements-api.txt..." -ForegroundColor Yellow
    pip install -r requirements-api.txt
} elseif (Test-Path "requirements.txt") {
    Write-Host "📋 Instalando dependências do requirements.txt + Flask..." -ForegroundColor Yellow
    pip install -r requirements.txt
    pip install flask flask-cors
} else {
    Write-Host "⚠️ Nenhum arquivo requirements encontrado. Instalando dependências mínimas..." -ForegroundColor Yellow
    pip install flask flask-cors pydantic weaviate-client sentence-transformers groq supabase
}

# Verificar se app.py existe
if (-not (Test-Path "app.py")) {
    Write-Host "❌ Erro: app.py não encontrado no diretório busca_local" -ForegroundColor Red
    exit 1
}

# Carregar variáveis de ambiente se .env existir
$envFile = ".env"
$projectEnvFile = Join-Path $ProjectDir ".env"

if (Test-Path $envFile) {
    Write-Host "🔧 Carregando variáveis de ambiente do .env local" -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
        }
    }
} elseif (Test-Path $projectEnvFile) {
    Write-Host "🔧 Carregando variáveis de ambiente do .env do projeto" -ForegroundColor Yellow
    Get-Content $projectEnvFile | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
        }
    }
}

# Definir variáveis de ambiente para a API
$env:PYTHON_API_PORT = $Port.ToString()
$env:PYTHON_API_HOST = $Host
$env:PYTHON_API_DEBUG = $Debug.ToLower()

# Adicionar diretório pai ao PYTHONPATH
$env:PYTHONPATH = "$ProjectDir;$env:PYTHONPATH"

Write-Host ""
Write-Host "🚀 Iniciando API Python..." -ForegroundColor Green
Write-Host "💡 Para parar o servidor, pressione Ctrl+C" -ForegroundColor Yellow
Write-Host "🔗 Health check: http://$Host`:$Port/health" -ForegroundColor Cyan
Write-Host ""

# Iniciar a aplicação Flask
try {
    python app.py
} catch {
    Write-Host "❌ Erro ao iniciar a API Python: $_" -ForegroundColor Red
    exit 1
} finally {
    Write-Host "🛑 API Python encerrada." -ForegroundColor Yellow
}
